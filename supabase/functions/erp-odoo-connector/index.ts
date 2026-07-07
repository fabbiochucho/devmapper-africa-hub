// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  connectionId: string;
}

/**
 * Pulls Odoo vendor bill lines (account.move.line on in_invoice moves) and
 * estimates Scope 3 emissions per line by matching against emission_factors
 * (category/region), writing one esg_supplier_emissions row per line item.
 *
 * TODO(business-logic, unverified): field names for Odoo's account.move.line
 * JSON-RPC schema (partner_id, product_id.categ_id, price_subtotal, etc.)
 * are best-effort from public Odoo API documentation and have NOT been
 * checked against a live Odoo sandbox. Verify the exact field/model shape
 * for the target Odoo version before relying on this in production.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing required environment variables");
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { connectionId }: SyncRequest = await req.json();

    const { data: connection, error: connError } = await supabase
      .from('erp_connections')
      .select('id, organization_id, provider, base_url, api_key_secret_name')
      .eq('id', connectionId)
      .single();

    if (connError || !connection) {
      return new Response(JSON.stringify({ error: 'Connection not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (connection.provider !== 'odoo') {
      return new Response(JSON.stringify({ error: 'Only Odoo sync is implemented' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Verify the caller belongs to the connection's org.
    const { data: org } = await supabase
      .from('organizations')
      .select('id, created_by')
      .eq('id', connection.organization_id)
      .maybeSingle();
    const { data: membership } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', connection.organization_id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!org || (org.created_by !== user.id && !membership)) {
      return new Response(JSON.stringify({ error: 'Not authorized for this organization' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    await supabase.from('erp_connections').update({ sync_status: 'syncing' }).eq('id', connectionId);

    if (!connection.api_key_secret_name) {
      throw new Error('No credentials configured for this connection');
    }

    const rawCreds = Deno.env.get(connection.api_key_secret_name);
    if (!rawCreds) {
      throw new Error(`Secret ${connection.api_key_secret_name} not configured`);
    }
    // Credentials are stored as a JSON-encoded secret: {"db","username","apiKey"}
    const { db, username, apiKey } = JSON.parse(rawCreds);

    const rpc = async (service: string, method: string, args: unknown[]) => {
      const response = await fetch(`${connection.base_url}/jsonrpc`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { service, method, args }, id: Date.now() }),
      });
      const json = await response.json();
      if (json.error) throw new Error(json.error.data?.message || 'Odoo RPC error');
      return json.result;
    };

    const uid = await rpc('common', 'login', [db, username, apiKey]);
    if (!uid) throw new Error('Odoo authentication failed');

    const lines: any[] = await rpc('object', 'execute_kw', [
      db, uid, apiKey, 'account.move.line', 'search_read',
      [[['move_id.move_type', '=', 'in_invoice'], ['exclude_from_invoice_tab', '=', false]]],
      { fields: ['id', 'partner_id', 'name', 'quantity', 'price_subtotal', 'product_id'], limit: 200 },
    ]);

    let processed = 0;
    let matched = 0;
    const errors: string[] = [];

    for (const line of lines) {
      try {
        const vendorName: string = Array.isArray(line.partner_id) ? line.partner_id[1] : 'Unknown vendor';

        let { data: supplier } = await supabase
          .from('esg_suppliers')
          .select('id')
          .eq('organization_id', connection.organization_id)
          .eq('name', vendorName)
          .maybeSingle();

        if (!supplier) {
          const { data: newSupplier, error: supplierError } = await supabase
            .from('esg_suppliers')
            .insert([{ organization_id: connection.organization_id, name: vendorName, data_source: 'erp_odoo' }])
            .select('id')
            .single();
          if (supplierError || !newSupplier) throw new Error(supplierError?.message || 'Failed to create supplier');
          supplier = newSupplier;
        }

        // Heuristic category match against emission_factors - real Odoo
        // product/account taxonomy likely needs an explicit mapping table
        // in a follow-up pass rather than this simplified string match.
        const category = (line.name || '').split(' ')[0].toLowerCase();
        const { data: factor } = await supabase
          .from('emission_factors')
          .select('factor_kgco2e, source')
          .ilike('category', `%${category}%`)
          .limit(1)
          .maybeSingle();

        const estimatedTonnes = factor
          ? (Number(line.price_subtotal || 0) * factor.factor_kgco2e) / 1000
          : 0;
        if (factor) matched++;

        await supabase.from('esg_supplier_emissions').insert([{
          supplier_id: supplier.id,
          organization_id: connection.organization_id,
          reporting_year: new Date().getFullYear(),
          activity_description: line.name || null,
          emissions_tonnes: estimatedTonnes,
          emission_factor: factor?.factor_kgco2e ?? null,
          emission_factor_source: factor?.source ?? 'unmatched',
          data_quality: factor ? 'estimated' : 'unverified',
        }]);

        processed++;
      } catch (lineError) {
        errors.push(`Line ${line.id}: ${lineError instanceof Error ? lineError.message : 'unknown error'}`);
      }
    }

    await supabase.from('erp_connections').update({
      sync_status: 'connected',
      last_synced_at: new Date().toISOString(),
      last_error: errors.length > 0 ? errors.slice(0, 5).join('; ') : null,
    }).eq('id', connectionId);

    return new Response(
      JSON.stringify({ success: true, processed, matched, errors }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[erp-odoo-connector] Sync failed:', error);
    try {
      const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? '', Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? '');
      const body = await req.clone().json().catch(() => ({}));
      if (body.connectionId) {
        await supabase.from('erp_connections').update({
          sync_status: 'error',
          last_error: error instanceof Error ? error.message : 'Unknown error',
        }).eq('id', body.connectionId);
      }
    } catch {
      // best-effort status update only
    }
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
