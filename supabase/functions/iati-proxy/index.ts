import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// IATI Datastore (Azure API Management) - confirmed live via a direct probe
// that this endpoint requires a registered "Ocp-Apim-Subscription-Key"
// (401 Www-Authenticate: AzureApiManagementKey ... name="Ocp-Apim-Subscription-Key").
// Unlike World Bank's API (#95, confirmed public/keyless), this genuinely
// cannot return real data without a credential this session doesn't have -
// root-caused and documented rather than faked, matching the payment-gateway
// precedent (#83) for the same situation.
const IATI_API = "https://api.iatistandard.org/datastore/activity/select";

interface IatiRequest {
  countryCode: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { countryCode }: IatiRequest = await req.json();
    if (!countryCode || countryCode.length !== 2) throw new Error("countryCode must be a 2-letter ISO code");

    const apiKey = Deno.env.get("IATI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({
        configured: false,
        message: "IATI integration is not yet activated. Register for a free subscription key at " +
          "https://developer.iatistandard.org (IATI Datastore product) and add it as the IATI_API_KEY " +
          "secret on this project's edge functions to enable real aid-flow data.",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const code = countryCode.toUpperCase();
    const cacheKey = `iati:${code}`;

    const { data: cached } = await supabaseClient
      .from("alphaearth_cache")
      .select("payload")
      .eq("cache_key", cacheKey)
      .eq("provider", "iati")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify({ configured: true, ...cached.payload }), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "HIT" },
      });
    }

    const url = `${IATI_API}?q=recipient_country_code:${code}&rows=20&wt=json`;
    const resp = await fetch(url, {
      headers: { "Ocp-Apim-Subscription-Key": apiKey, Accept: "application/json" },
    });

    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      throw new Error(`IATI API error ${resp.status}: ${body.slice(0, 300)}`);
    }

    const raw = await resp.json();
    const activities = (raw?.response?.docs ?? []).map((doc: any) => ({
      iatiIdentifier: doc.iati_identifier,
      title: doc.title_narrative?.[0] ?? null,
      reportingOrg: doc.reporting_org_narrative?.[0] ?? null,
      sector: doc.sector_code?.[0] ?? null,
      totalBudget: doc.transaction_value?.reduce((s: number, v: number) => s + v, 0) ?? null,
    }));

    const payload = {
      countryCode: code,
      activities,
      metadata: { source: "IATI Datastore (Live)", generated_at: new Date().toISOString() },
    };

    await supabaseClient.from("alphaearth_cache").insert({
      cache_key: cacheKey,
      provider: "iati",
      payload,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });

    return new Response(JSON.stringify({ configured: true, ...payload }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
    });
  } catch (error) {
    console.error("[IATI-PROXY] Error:", error);
    const isAuth = error instanceof Error && error.message === "Unauthorized";
    return new Response(JSON.stringify({ error: isAuth ? "Unauthorized" : (error as Error).message ?? "Internal server error" }), {
      status: isAuth ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
