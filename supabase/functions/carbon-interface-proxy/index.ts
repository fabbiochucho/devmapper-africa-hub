import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Carbon Interface - confirmed real request/response shape from their own
// tutorial at https://www.carboninterface.com/tutorials/electricity (2026).
// Requires a CARBON_INTERFACE_API_KEY this project doesn't have; degrades
// to a "not configured" message rather than faking a result, same pattern
// as iati-proxy.
const CARBON_INTERFACE_API = "https://www.carboninterface.com/api/v1/estimates";
const CACHE_TTL_DAYS = 30;

interface CarbonInterfaceRequest {
  type: "electricity" | "flight" | "shipping" | "vehicle" | "fuel_combustion";
  [key: string]: unknown;
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

    const body: CarbonInterfaceRequest = await req.json();
    if (!body.type) throw new Error("type is required (electricity, flight, shipping, vehicle, fuel_combustion)");

    const apiKey = Deno.env.get("CARBON_INTERFACE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({
        configured: false,
        message: "Carbon Interface integration is not yet activated. Get an API key at " +
          "https://www.carboninterface.com and add it as the CARBON_INTERFACE_API_KEY secret " +
          "on this project's edge functions to enable it as a fallback emission-factor source.",
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const cacheKey = `carbon_interface:${JSON.stringify(body)}`;
    const { data: cached } = await supabaseClient
      .from("alphaearth_cache")
      .select("payload")
      .eq("cache_key", cacheKey)
      .eq("provider", "carbon_interface")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify({ configured: true, ...(cached.payload as object) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "HIT" },
      });
    }

    const resp = await fetch(CARBON_INTERFACE_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      try {
        await supabaseClient.rpc("record_provider_health", {
          p_provider_key: "carbon_interface", p_success: false, p_error_message: `Carbon Interface API error ${resp.status}: ${text.slice(0, 200)}`,
        });
      } catch { /* best-effort */ }
      throw new Error(`Carbon Interface API error ${resp.status}: ${text.slice(0, 300)}`);
    }

    const payload = await resp.json();

    await supabaseClient.from("alphaearth_cache").insert({
      cache_key: cacheKey,
      provider: "carbon_interface",
      payload,
      expires_at: new Date(Date.now() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    });

    try { await supabaseClient.rpc("record_provider_health", { p_provider_key: "carbon_interface", p_success: true }); } catch { /* best-effort */ }

    return new Response(JSON.stringify({ configured: true, ...payload }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
    });
  } catch (error) {
    console.error("[CARBON-INTERFACE-PROXY] Error:", error);
    const isAuth = error instanceof Error && error.message === "Unauthorized";
    if (!isAuth && supabaseClient) {
      try {
        await supabaseClient.rpc("record_provider_health", {
          p_provider_key: "carbon_interface", p_success: false, p_error_message: (error as Error).message ?? "Unknown error",
        });
      } catch { /* best-effort */ }
    }
    return new Response(JSON.stringify({ error: isAuth ? "Unauthorized" : (error as Error).message ?? "Internal server error" }), {
      status: isAuth ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
