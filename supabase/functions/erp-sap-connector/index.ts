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
 * Pulls SAP Business One vendor purchase invoice line items via the Service
 * Layer REST API and estimates Scope 3 emissions the same way the Odoo
 * connector does (see _shared/erpEmissionsSync.ts).
 *
 * Targets SAP Business One's Service Layer specifically (not S/4HANA's
 * OData API, which uses a different auth model and entity set) - this is
 * an assumption about which "SAP" product is in use, not a verified fact
 * about any specific customer's landscape.
 *
 * Confirmed against SAP's published Service Layer documentation and
 * community reference material: the Login request shape (POST /Login with
 * {CompanyDB, UserName, Password}), the dual Set-Cookie response
 * (B1SESSION + ROUTEID for load-balanced deployments), and the
 * PurchaseInvoices/DocumentLines field names used below (CardCode,
 * CardName, DocEntry, ItemCode, LineTotal, Quantity). One operational
 * detail worth knowing: B1SESSION is documented as expiring after 30
 * minutes, with production integrations typically catching SAP's -5002
 * "session expired" error code and re-authenticating - this function's
 * single sync pass is short enough that mid-sync expiry is unlikely, but
 * isn't handled if it does happen.
 *
 * TODO(business-logic, unverified): field *documentation* is confirmed,
 * but this has still NOT been exercised against a live SAP B1 instance -
 * exact field availability/behavior can vary by SAP B1 version and
 * localization. ItemDescription specifically was not strongly confirmed in
 * research (falls back to ItemCode if absent, so this degrades safely
 * either way). Verify against a real sandbox before production use.
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let connection: any = null;
  let supabase: any = null;
  let sessionCookie: string | null = null;

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

    supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { connectionId }: SyncRequest = await req.json();

    const { data: connectionRow, error: connError } = await supabase
      .from('erp_connections')
      .select('id, organization_id, provider, base_url, api_key_secret_name')
      .eq('id', connectionId)
      .single();

    if (connError || !connectionRow) {
      return new Response(JSON.stringify({ error: 'Connection not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    connection = connectionRow;

    if (connection.provider !== 'sap') {
      return new Response(JSON.stringify({ error: 'Only SAP sync is implemented in this function' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

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
    // Credentials are stored as a JSON-encoded secret: {"companyDb","username","password"}
    const { companyDb, username, password } = JSON.parse(rawCreds);
    const baseUrl = connection.base_url.replace(/\/$/, '');

    // 1. Login - Service Layer returns the session via a Set-Cookie header
    // (B1SESSION, plus ROUTEID when the server sits behind a load balancer).
    // Deno's fetch doesn't manage cookies across calls automatically, so we
    // capture and forward it manually on every subsequent request.
    const loginResponse = await fetch(`${baseUrl}/Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ CompanyDB: companyDb, UserName: username, Password: password }),
    });

    if (!loginResponse.ok) {
      throw new Error(`SAP Service Layer login failed: ${loginResponse.status} ${await loginResponse.text()}`);
    }

    const setCookieHeader = loginResponse.headers.get('set-cookie');
    if (!setCookieHeader) {
      throw new Error('SAP Service Layer login did not return a session cookie');
    }
    // Forward every cookie the server set (B1SESSION and, if present,
    // ROUTEID) rather than assuming there's exactly one.
    sessionCookie = setCookieHeader
      .split(/,(?=[^;]+?=)/) // split multiple Set-Cookie values, not commas inside a single cookie's attributes
      .map((c) => c.split(';')[0].trim())
      .join('; ');

    try {
      // 2. Query open purchase invoices with their line items.
      const query = new URLSearchParams({
        '$select': 'DocEntry,CardName,DocDate,DocumentLines',
        '$top': '50',
      });
      const invoicesResponse = await fetch(`${baseUrl}/PurchaseInvoices?${query}`, {
        headers: { Cookie: sessionCookie, 'Content-Type': 'application/json' },
      });

      if (!invoicesResponse.ok) {
        throw new Error(`SAP PurchaseInvoices query failed: ${invoicesResponse.status} ${await invoicesResponse.text()}`);
      }

      const invoicesData = await invoicesResponse.json();
      const invoices: any[] = invoicesData.value ?? [];

      const lineItems: ErpLineItem[] = invoices.flatMap((invoice) =>
        (invoice.DocumentLines ?? []).map((line: any) => ({
          vendorName: invoice.CardName || 'Unknown vendor',
          description: line.ItemDescription || line.ItemCode || '',
          amount: Number(line.LineTotal ?? 0),
          categoryHint: line.ItemDescription || line.ItemCode || '',
        }))
      );

      const result = await syncErpLineItems(supabase, connection.organization_id, 'sap', lineItems);

      await supabase.from('erp_connections').update({
        sync_status: 'connected',
        last_synced_at: new Date().toISOString(),
        last_error: result.errors.length > 0 ? result.errors.slice(0, 5).join('; ') : null,
      }).eq('id', connectionId);

      return new Response(
        JSON.stringify({ success: true, ...result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } finally {
      // 3. Always log out to release the SAP session slot, even on error.
      await fetch(`${baseUrl}/Logout`, {
        method: 'POST',
        headers: { Cookie: sessionCookie ?? '' },
      }).catch(() => { /* best-effort logout */ });
    }

  } catch (error) {
    console.error('[erp-sap-connector] Sync failed:', error);
    if (supabase && connection) {
      try {
        await supabase.from('erp_connections').update({
          sync_status: 'error',
          last_error: error instanceof Error ? error.message : 'Unknown error',
        }).eq('id', connection.id);
      } catch {
        // best-effort status update only
      }
    }
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
