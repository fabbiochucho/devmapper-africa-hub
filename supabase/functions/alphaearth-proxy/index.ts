import { type Database, type Db, asJson, logAuditEvent } from "../_shared/db.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Carbon-intensity benchmark: a country's total greenhouse-gas emissions (Climate TRACE)
// divided by its GDP (World Bank), for the same year, in kg CO2e per US$ of output.
// It is an economy-wide average - there is no free, sourced sector-level series, so the
// requested sector is echoed back but does not change the number. Nothing here is estimated
// or invented: if either source has no figure, the benchmark is reported as unavailable.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Expose-Headers': 'X-Cache',
};

const CLIMATETRACE_API = 'https://api.climatetrace.org/v6';
const WORLDBANK_API = 'https://api.worldbank.org/v2';
// Climate TRACE's last full year; the current year is partial.
const LATEST_FULL_YEAR = 2024;
const CACHE_DAYS = 30;

interface BenchmarkRequest {
  country: string; // ISO 3166-1 alpha-2 (as stored on organisations/suppliers)
  sector: string;
  year?: number;
  organizationId?: string;
}

interface SupplierEnrichRequest {
  organizationId: string;
  suppliers: Array<{
    id: string;
    name: string;
    country_code: string;
    sector: string;
    annual_spend?: number;
  }>;
  year?: number;
}

interface Benchmark {
  country: string;
  sector: string;
  year: number | null;
  /** kg CO2e per US$ of GDP (= tonnes CO2e per US$1,000). null when unavailable. */
  avg_carbon_intensity: number | null;
  available: boolean;
  scope: 'economy-wide';
  source: string;
  note?: string;
  inputs?: { emissions_t_co2e: number; gdp_usd: number };
  confidence_score: number;
  cached?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let supabaseClient: Db | null = null;

  try {
    console.log('[ALPHAEARTH-PROXY] Incoming request');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Unauthorized');
    }

    supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Shared cache rows have no organization_id, which RLS only lets admins read or write,
    // so cache reads/writes go through the service role (the user is already verified above).
    const cacheClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'benchmark';
    const body = await req.json();

    console.log('[ALPHAEARTH-PROXY] Action:', action);

    let result;

    switch (action) {
      case 'benchmark':
        result = await handleBenchmark(body as BenchmarkRequest, supabaseClient, cacheClient, user.id);
        break;
      case 'enrich-suppliers':
        result = await handleSupplierEnrichment(body as SupplierEnrichRequest, supabaseClient, cacheClient, user.id);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[ALPHAEARTH-PROXY] Error:', error);
    const isAuth = error instanceof Error && error.message === 'Unauthorized';
    if (!isAuth && supabaseClient) {
      try {
        await supabaseClient.rpc('record_provider_health', {
          p_provider_key: 'alphaearth', p_success: false, p_error_message: error instanceof Error ? error.message : 'Unknown error',
        });
      } catch { /* best-effort */ }
    }
    return new Response(JSON.stringify({ error: isAuth ? 'Unauthorized' : 'Internal server error' }), {
      status: isAuth ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleBenchmark(
  request: BenchmarkRequest,
  supabase: Db,
  cacheClient: Db,
  userId: string
): Promise<Benchmark> {
  const country = (request.country || '').toUpperCase();
  const { sector, organizationId } = request;
  const cacheKey = `benchmark:${country}:${request.year || 'latest'}`;

  const { data: cached } = await cacheClient
    .from('alphaearth_cache')
    .select('payload')
    .eq('cache_key', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (cached) {
    console.log('[ALPHAEARTH-PROXY] Cache hit for benchmark');
    return { ...(cached.payload as unknown as Benchmark), sector, cached: true };
  }

  const benchmark = await computeBenchmark(country, sector, request.year);

  // Only real readings are cached, so an outage isn't remembered for a month.
  if (benchmark.available) {
    const { error: cacheError } = await cacheClient.from('alphaearth_cache').upsert({
      cache_key: cacheKey,
      payload: asJson(benchmark),
      provider: 'benchmark',
      fetched_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + CACHE_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'cache_key' });
    if (cacheError) console.warn('[ALPHAEARTH-PROXY] Cache write failed:', cacheError.message);
  }

  try {
    await supabase.rpc('record_provider_health', {
      p_provider_key: 'alphaearth', p_success: benchmark.available, p_error_message: benchmark.available ? undefined : benchmark.note,
    });
  } catch { /* best-effort */ }

  await logAuditEvent(supabase, {
    p_actor_id: userId,
    p_actor_type: 'user',
    p_org_id: organizationId || null,
    p_action: 'alphaearth_benchmark_request',
    p_payload: { country, sector, year: benchmark.year, available: benchmark.available }
  });

  return { ...benchmark, cached: false };
}

async function computeBenchmark(country: string, sector: string, year?: number): Promise<Benchmark> {
  const unavailable = (note: string): Benchmark => ({
    country, sector, year: year ?? null, avg_carbon_intensity: null, available: false,
    scope: 'economy-wide', source: 'Climate TRACE ÷ World Bank GDP', note, confidence_score: 0,
  });

  if (!/^[A-Z]{2}$/.test(country)) return unavailable('A two-letter country code is required for a benchmark.');

  try {
    // GDP for recent years; World Bank also returns the ISO3 code Climate TRACE needs.
    const wbRes = await fetch(
      `${WORLDBANK_API}/country/${country}/indicator/NY.GDP.MKTP.CD?format=json&mrv=8`,
      { signal: AbortSignal.timeout(20_000) },
    );
    if (!wbRes.ok) return unavailable(`World Bank returned ${wbRes.status}.`);
    const wb = await wbRes.json() as [unknown, { date: string; value: number | null; countryiso3code: string }[] | null];
    const rows = (wb[1] ?? []).filter((r) => r.value && Number(r.date) <= LATEST_FULL_YEAR && (!year || Number(r.date) === year));
    if (!rows.length) return unavailable('World Bank has no GDP figure for this country and year.');

    // Newest year that both sources cover.
    for (const row of rows.sort((a, b) => Number(b.date) - Number(a.date))) {
      const y = Number(row.date);
      const ctRes = await fetch(
        `${CLIMATETRACE_API}/country/emissions?since=${y}&to=${y}&countries=${row.countryiso3code}`,
        { signal: AbortSignal.timeout(30_000) },
      );
      if (!ctRes.ok) return unavailable(`Climate TRACE returned ${ctRes.status}.`);
      const ct = await ctRes.json() as { emissions?: { co2e_100yr?: number } }[];
      const tonnes = ct[0]?.emissions?.co2e_100yr;
      if (!tonnes || tonnes <= 0) continue;

      const gdp = row.value as number;
      return {
        country, sector, year: y,
        // tonnes * 1000 kg / US$
        avg_carbon_intensity: Math.round(((tonnes * 1000) / gdp) * 1000) / 1000,
        available: true,
        scope: 'economy-wide',
        source: `Climate TRACE emissions ÷ World Bank GDP (${y})`,
        note: 'Economy-wide average for the country, not specific to the sector.',
        inputs: { emissions_t_co2e: Math.round(tonnes), gdp_usd: Math.round(gdp) },
        // Real data, but an economy-wide proxy for a sector comparison.
        confidence_score: 0.5,
      };
    }
    return unavailable('Climate TRACE has no emissions figure for this country in the years World Bank covers.');
  } catch (error) {
    console.warn('[ALPHAEARTH-PROXY] Benchmark sources failed:', error);
    return unavailable('Benchmark sources are unreachable right now.');
  }
}

async function handleSupplierEnrichment(
  request: SupplierEnrichRequest,
  supabase: Db,
  cacheClient: Db,
  userId: string
) {
  const { organizationId, suppliers, year } = request;

  const enrichedResults = [];

  for (const supplier of suppliers) {
    try {
      const benchmark = await handleBenchmark({
        country: supplier.country_code,
        sector: supplier.sector,
        year,
        organizationId
      }, supabase, cacheClient, userId);

      if (!benchmark.available || benchmark.avg_carbon_intensity == null) {
        enrichedResults.push({
          supplier_id: supplier.id,
          supplier_name: supplier.name,
          error: benchmark.note || 'No benchmark available for this supplier',
        });
        continue;
      }

      // Spend-based estimate: US$ spend x kg CO2e/US$ = kg; / 1000 = tonnes CO2e.
      const estimatedEmissions = supplier.annual_spend
        ? (supplier.annual_spend * benchmark.avg_carbon_intensity) / 1000
        : 0;

      enrichedResults.push({
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        estimated_emissions: estimatedEmissions,
        benchmark_used: benchmark,
        enrichment_date: new Date().toISOString()
      });

      await supabase
        .from('esg_suppliers')
        .update({ alphaearth_enriched: true })
        .eq('id', supplier.id);

    } catch (error) {
      console.error(`[ALPHAEARTH-PROXY] Failed to enrich supplier ${supplier.name}:`, error);
      enrichedResults.push({
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        error: 'Failed to enrich supplier'
      });
    }
  }

  return { enriched: enrichedResults, total: suppliers.length };
}
