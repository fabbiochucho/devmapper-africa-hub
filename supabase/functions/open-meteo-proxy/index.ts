import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Open-Meteo - public, no key required (confirmed live). Free-tier terms:
// https://open-meteo.com/en/terms - non-commercial, no more than one call
// per location per hour; the cache below keeps this well within that.
const OPEN_METEO_API = "https://api.open-meteo.com/v1/forecast";

interface OpenMeteoRequest {
  lat: number;
  lng: number;
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

    const { lat, lng }: OpenMeteoRequest = await req.json();
    if (typeof lat !== "number" || typeof lng !== "number" || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error("lat/lng must be valid coordinates");
    }

    // Round to ~1km precision so nearby report locations share a cache
    // entry instead of each making its own upstream call.
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLng = Math.round(lng * 100) / 100;
    const cacheKey = `openmeteo:${roundedLat}:${roundedLng}`;

    const { data: cached } = await supabaseClient
      .from("alphaearth_cache")
      .select("payload")
      .eq("cache_key", cacheKey)
      .eq("provider", "open_meteo")
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify(cached.payload), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "HIT" },
      });
    }

    const url = `${OPEN_METEO_API}?latitude=${roundedLat}&longitude=${roundedLng}&current=temperature_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=7`;
    const resp = await fetch(url, { headers: { Accept: "application/json" } });
    if (!resp.ok) throw new Error(`Open-Meteo request failed: ${resp.status}`);

    try { await supabaseClient.rpc("record_provider_health", { p_provider_key: "open_meteo", p_success: true }); } catch { /* best-effort */ }

    const json = await resp.json();
    const payload = {
      lat: roundedLat,
      lng: roundedLng,
      current: json.current ?? null,
      daily: json.daily ?? null,
      metadata: {
        source: "Open-Meteo (Live)",
        generated_at: new Date().toISOString(),
      },
    };

    await supabaseClient.from("alphaearth_cache").insert({
      cache_key: cacheKey,
      provider: "open_meteo",
      payload,
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
    });
  } catch (error) {
    console.error("[OPEN-METEO-PROXY] Error:", error);
    const isAuth = error instanceof Error && error.message === "Unauthorized";
    if (!isAuth && supabaseClient) {
      try {
        await supabaseClient.rpc("record_provider_health", {
          p_provider_key: "open_meteo", p_success: false, p_error_message: (error as Error).message ?? "Unknown error",
        });
      } catch { /* best-effort */ }
    }
    return new Response(JSON.stringify({ error: isAuth ? "Unauthorized" : (error as Error).message ?? "Internal server error" }), {
      status: isAuth ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
