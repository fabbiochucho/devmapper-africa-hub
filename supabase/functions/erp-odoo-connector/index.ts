// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { syncErpLineItems, type ErpLineItem } from "../_shared/erpEmissionsSync.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  connectionId: string;
}

/**
 * Pulls Odoo vendor bill lines (account.move.line on in_invoice moves) and
 * estimates Scope 3 emissions per line by matching against emission_factors,
 * writing one esg_supplier_emissions row per line item.
 *
 * Field names below (partner_id, name, price_subtotal, product_id,
 * quantity, display_type, move_id.move_type) are confirmed against public
 * Odoo developer documentation and community references (account.move.line
 * model reference; display_type='line_section'/'line_note' marks
 * section/note rows with no debit/credit, filtered out via
 * `display_type = false` rather than the less-documented
 * `exclude_from_invoice_tab`, which an earlier version of this file used).
 *
 * Transport checked live against Odoo 20 (demo.odoo.com, Oct 2026): /jsonrpc
 * and /xmlrpc return 404 there and /json/2 is served, so JSON-2 is tried
 * first with a fallback to JSON-RPC for older instances. The line query
 * itself couldn't be run on the demo (an API key needs an interactive
 * identity check), so it follows the account.move.line field reference; a
 * customised installation can still differ.
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

    type OdooLine = { partner_id?: [number, string] | false; name?: string | false; price_subtotal?: number };
    // Product lines on posted vendor bills. Since Odoo 16 these have display_type
    // 'product' (sections/notes/tax/payment-term lines have other values); before 16
    // they had display_type False, so accept both and exclude tax lines explicitly.
    const domain = [
      ['move_id.move_type', '=', 'in_invoice'],
      ['parent_state', '=', 'posted'],
      ['display_type', 'in', ['product', false]],
      ['tax_line_id', '=', false],
    ];
    const fields = ['id', 'partner_id', 'name', 'quantity', 'price_subtotal', 'product_id'];

    // Odoo 19+ External JSON-2 API (the XML-RPC/JSON-RPC endpoints are deprecated, and
    // Odoo 20 - e.g. demo.odoo.com - already answers 404 on /jsonrpc and /xmlrpc).
    const json2 = await fetch(`${connection.base_url}/json/2/account.move.line/search_read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        Authorization: `bearer ${apiKey}`,
        ...(db ? { 'X-Odoo-Database': db } : {}),
        'User-Agent': 'DevMapper ERP connector',
      },
      body: JSON.stringify({ domain, fields, limit: 200 }),
    });

    let lines: OdooLine[];
    if (json2.status !== 404) {
      const body = await json2.json().catch(() => null);
      if (!json2.ok) throw new Error(`Odoo JSON-2 API error ${json2.status}: ${body?.message ?? 'unknown error'}`);
      lines = body as OdooLine[];
    } else {
      // Older Odoo (< 19): legacy JSON-RPC object service.
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
      const uid = await rpc('common', 'authenticate', [db, username, apiKey, {}]);
      if (!uid) throw new Error('Odoo authentication failed');
      lines = await rpc('object', 'execute_kw', [db, uid, apiKey, 'account.move.line', 'search_read', [domain], { fields, limit: 200 }]);
    }

    const lineItems: ErpLineItem[] = lines.map((line) => ({
      vendorName: Array.isArray(line.partner_id) ? line.partner_id[1] : 'Unknown vendor',
      description: line.name || '',
      amount: Number(line.price_subtotal || 0),
      categoryHint: line.name || '',
    }));

    const result = await syncErpLineItems(supabase, connection.organization_id, 'odoo', lineItems);

    await supabase.from('erp_connections').update({
      sync_status: 'connected',
      last_synced_at: new Date().toISOString(),
      last_error: result.errors.length > 0 ? result.errors.slice(0, 5).join('; ') : null,
    }).eq('id', connectionId);

    try { await supabase.rpc('record_provider_health', { p_provider_key: 'erp_odoo', p_success: true }); } catch { /* best-effort */ }

    return new Response(
      JSON.stringify({ success: true, ...result }),
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
      try {
        await supabase.rpc('record_provider_health', {
          p_provider_key: 'erp_odoo', p_success: false, p_error_message: error instanceof Error ? error.message : 'Unknown error',
        });
      } catch { /* best-effort */ }
    } catch {
      // best-effort status update only
    }
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
