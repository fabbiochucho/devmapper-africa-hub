import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// GreenCalculus - 16,673 sourced emission factors (DEFRA/DESNZ + others)
// behind an auditable calculation API (every response carries a source id +
// cell reference). Free tier: 1,000 calls/month - cached aggressively below
// since factor values don't change intra-year, to keep real usage well
// under quota.
const GREENCALCULUS_API = "https://api.greencalculus.com/v1";
const CACHE_TTL_DAYS = 60;

// Only the read-only/calculation paths this proxy is meant for - not an
// open passthrough to arbitrary GreenCalculus endpoints.
const ALLOWED_PATHS = new Set([
  "factors",
  "calculate/ghg-activity",
  "calculate/electricity",
  "calculate/freight",
  "calculate/spend-based",
  "calculate/business-travel",
  "calculate/embodied",
]);

interface ProxyRequest {
  path: string;
  method?: "GET" | "POST";
  query?: Record<string, string>;
  body?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let supabaseClient: ReturnType<typeof createClient> | null = null;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { path, method = "GET", query, body }: ProxyRequest = await req.json();
    if (!ALLOWED_PATHS.has(path)) throw new Error(`Unsupported path: ${path}`);

    const apiKey = Deno.env.get("GREENCALCULUS_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({
        configured: false,
        message: "GreenCalculus integration is not yet activated. Add a GREENCALCULUS_API_KEY secret to enable it.",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const cacheKey = `greencalculus:${path}:${JSON.stringify(query ?? {})}:${JSON.stringify(body ?? {})}`;
    const { data: cached } = await supabaseClient
      .from("alphaearth_cache")
      .select("payload")
      .eq("cache_key", cacheKey)
      .eq("provider", "greencalculus")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify({ configured: true, ...(cached.payload as object) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "HIT" },
      });
    }

    let url = `${GREENCALCULUS_API}/${path}`;
    if (method === "GET" && query) {
      url += `?${new URLSearchParams(query).toString()}`;
    }

    const resp = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({
        configured: true, rateLimited: true,
        message: "GreenCalculus monthly quota reached, please try again later.",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      try {
        await supabaseClient.rpc("record_provider_health", {
          p_provider_key: "greencalculus", p_success: false, p_error_message: `GreenCalculus API error ${resp.status}: ${text.slice(0, 200)}`,
        });
      } catch { /* best-effort */ }
      throw new Error(`GreenCalculus API error ${resp.status}: ${text.slice(0, 300)}`);
    }

    const payload = await resp.json();

    await supabaseClient.from("alphaearth_cache").insert({
      cache_key: cacheKey,
      provider: "greencalculus",
      payload,
      expires_at: new Date(Date.now() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    });

    try { await supabaseClient.rpc("record_provider_health", { p_provider_key: "greencalculus", p_success: true }); } catch { /* best-effort */ }

    return new Response(JSON.stringify({ configured: true, ...payload }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
    });
  } catch (error) {
    console.error("[GREENCALCULUS-PROXY] Error:", error);
    const isAuth = error instanceof Error && error.message === "Unauthorized";
    if (!isAuth && supabaseClient) {
      try {
        await supabaseClient.rpc("record_provider_health", {
          p_provider_key: "greencalculus", p_success: false, p_error_message: (error as Error).message ?? "Unknown error",
        });
      } catch { /* best-effort */ }
    }
    return new Response(JSON.stringify({ error: isAuth ? "Unauthorized" : (error as Error).message ?? "Internal server error" }), {
      status: isAuth ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
