import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { type Database, type Db, asJson } from "../_shared/db.ts";
import { worldBankIndicators } from "../_shared/connectors.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// World Bank Open Data API - public, no key required (confirmed live).

interface WorldBankRequest {
  countryCode: string;
}



serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let supabaseClient: Db | null = null;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    supabaseClient = createClient<Database>(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { countryCode }: WorldBankRequest = await req.json();
    if (!countryCode || !/^[A-Za-z]{2,3}$/.test(countryCode)) throw new Error("countryCode must be an ISO 3166 alpha-2 or alpha-3 code");

    const code = countryCode.toUpperCase();
    const cacheKey = `worldbank:${code}`;

    const { data: cached } = await supabaseClient
      .from("alphaearth_cache")
      .select("payload")
      .eq("cache_key", cacheKey)
      .eq("provider", "worldbank")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify(cached.payload), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "HIT" },
      });
    }

    const results = await worldBankIndicators(code);

    const payload = {
      countryCode: code,
      indicators: results,
      metadata: {
        source: "World Bank Open Data API (Live)",
        generated_at: new Date().toISOString(),
      },
    };

    await supabaseClient.from("alphaearth_cache").insert({
      cache_key: cacheKey,
      provider: "worldbank",
      payload: asJson(payload),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    try { await supabaseClient.rpc("record_provider_health", { p_provider_key: "worldbank", p_success: true }); } catch { /* best-effort */ }

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
    });
  } catch (error) {
    console.error("[WORLDBANK-PROXY] Error:", error);
    const isAuth = error instanceof Error && error.message === "Unauthorized";
    if (!isAuth && supabaseClient) {
      try {
        await supabaseClient.rpc("record_provider_health", {
          p_provider_key: "worldbank", p_success: false, p_error_message: (error as Error).message ?? "Unknown error",
        });
      } catch { /* best-effort */ }
    }
    return new Response(JSON.stringify({ error: isAuth ? "Unauthorized" : (error as Error).message ?? "Internal server error" }), {
      status: isAuth ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
