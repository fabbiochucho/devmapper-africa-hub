import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// World Bank Open Data API - public, no key required (confirmed live).
const WORLD_BANK_API = "https://api.worldbank.org/v2";

// Curated indicators relevant to a donor/development report's country context.
const INDICATORS: Record<string, string> = {
  "NY.GDP.MKTP.CD": "GDP (current US$)",
  "NY.GDP.PCAP.CD": "GDP per capita (current US$)",
  "SP.POP.TOTL": "Population, total",
  "SI.POV.DDAY": "Poverty headcount ratio at $2.15/day (% of population)",
  "EN.ATM.CO2E.PC": "CO2 emissions (metric tons per capita)",
};

interface WorldBankRequest {
  countryCode: string;
}

interface IndicatorResult {
  code: string;
  label: string;
  value: number | null;
  year: string | null;
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

    const { countryCode }: WorldBankRequest = await req.json();
    if (!countryCode || countryCode.length !== 2) throw new Error("countryCode must be a 2-letter ISO code");

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

    const indicatorEntries = Object.entries(INDICATORS);
    const results = await Promise.all(
      indicatorEntries.map(async ([indicatorCode, label]): Promise<IndicatorResult> => {
        try {
          const url = `${WORLD_BANK_API}/country/${code}/indicator/${indicatorCode}?format=json&date=2015:2024&per_page=20`;
          const resp = await fetch(url, { headers: { Accept: "application/json" } });
          if (!resp.ok) return { code: indicatorCode, label, value: null, year: null };

          const json = await resp.json();
          const rows: any[] = Array.isArray(json) ? json[1] ?? [] : [];
          const withValue = rows.find((r) => r.value != null);
          return { code: indicatorCode, label, value: withValue?.value ?? null, year: withValue?.date ?? null };
        } catch {
          return { code: indicatorCode, label, value: null, year: null };
        }
      }),
    );

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
      payload,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
    });
  } catch (error) {
    console.error("[WORLDBANK-PROXY] Error:", error);
    const isAuth = error instanceof Error && error.message === "Unauthorized";
    return new Response(JSON.stringify({ error: isAuth ? "Unauthorized" : (error as Error).message ?? "Internal server error" }), {
      status: isAuth ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
