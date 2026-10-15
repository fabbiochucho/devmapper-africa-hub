import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { type Database, type Db, asJson, logAuditEvent } from '../_shared/db.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Expose-Headers': 'X-Cache',
};

// Climate TRACE public API (free, no key required)
const CLIMATETRACE_API = 'https://api.climatetrace.org/v6';
// Last full year of asset data (the current year's is partial).
const DEFAULT_YEAR = 2024;
// Largest-emitting African facilities fetched per sector/year; the map filters these to its view.
const ASSET_LIMIT = 1000;

interface CTRequest {
  bounds?: { north: number; south: number; east: number; west: number };
  sector?: string;
  year?: number;
}

interface CTAsset {
  Name?: string;
  Country?: string;
  Sector?: string;
  Centroid?: { Geometry?: [number, number] };
  EmissionsSummary?: { Gas?: string; EmissionsQuantity?: number | null }[];
}

interface Facility { lat: number; lng: number; emissions_t: number; name: string; country: string; sector: string }

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let supabaseClient: Db | null = null;

  try {
    console.log('[CLIMATETRACE-PROXY] Incoming request');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');

    supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    // Shared cache rows have no organization_id, which RLS only lets admins read or write,
    // so cache reads/writes go through the service role (the user is already verified above).
    const cacheClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body: CTRequest = await req.json();
    const sector = body.sector && body.sector !== 'all' ? body.sector : undefined;
    const year = body.year ?? DEFAULT_YEAR;
    console.log('[CLIMATETRACE-PROXY] Request:', { sector, year, bounds: body.bounds });

    const cacheKey = `climatetrace:assets:v2:africa:${sector || 'all'}:${year}`;
    const { data: cached } = await cacheClient
      .from('alphaearth_cache')
      .select('payload')
      .eq('cache_key', cacheKey)
      .eq('provider', 'climatetrace')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    let facilities: Facility[] | null = (cached?.payload as { facilities?: Facility[] } | null)?.facilities ?? null;
    const cacheHit = !!facilities;
    let unavailableNote: string | null = null;

    if (!facilities) {
      let apiUrl = `${CLIMATETRACE_API}/assets?continents=Africa&limit=${ASSET_LIMIT}&year=${year}`;
      if (sector) apiUrl += `&sectors=${encodeURIComponent(sector)}`;
      try {
        const apiResponse = await fetch(apiUrl, { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(60_000) });
        if (!apiResponse.ok) throw new Error(`Climate TRACE API returned ${apiResponse.status}`);
        const raw = await apiResponse.json() as { assets?: CTAsset[] };
        facilities = (raw.assets ?? []).flatMap((a) => {
          const [lng, lat] = a.Centroid?.Geometry ?? [];
          const co2e = a.EmissionsSummary?.find((e) => e.Gas === 'co2e_100yr')?.EmissionsQuantity;
          // 'removals' are carbon sinks (CO2 taken out), reported as positive quantities -
          // drawing them on an emissions heatmap would show forests as pollution hot spots.
          if (a.Sector === 'removals') return [];
          if (typeof lat !== 'number' || typeof lng !== 'number' || !co2e || co2e <= 0) return [];
          return [{ lat, lng, emissions_t: co2e, name: a.Name ?? '', country: a.Country ?? '', sector: a.Sector ?? '' }];
        });
        const { error: cacheError } = await cacheClient.from('alphaearth_cache').upsert({
          cache_key: cacheKey,
          provider: 'climatetrace',
          payload: asJson({ facilities }),
          fetched_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: 'cache_key' });
        if (cacheError) console.warn('[CLIMATETRACE-PROXY] Cache write failed:', cacheError.message);
        try { await supabaseClient.rpc('record_provider_health', { p_provider_key: 'climatetrace', p_success: true }); } catch { /* best-effort */ }
      } catch (fetchError) {
        // Never substitute invented numbers: report that no reading is available.
        console.warn('[CLIMATETRACE-PROXY] API call failed:', fetchError);
        unavailableNote = 'Climate TRACE is unreachable right now; no emissions data available.';
        try {
          await supabaseClient.rpc('record_provider_health', {
            p_provider_key: 'climatetrace', p_success: false, p_error_message: fetchError instanceof Error ? fetchError.message : 'Unknown error',
          });
        } catch { /* best-effort */ }
      }
    }

    const b = body.bounds;
    const inView = (facilities ?? []).filter((f) => !b || (f.lat <= b.north && f.lat >= b.south && f.lng <= b.east && f.lng >= b.west));
    // Heatmap weight: log-scaled 0..1 against the largest facility in view, so a few
    // super-emitters don't wash out everything else. Real tonnes travel in emissions_t.
    const maxLog = Math.log10(Math.max(1, ...inView.map((f) => f.emissions_t)));
    const emissionsData = {
      sector: sector || 'all',
      year,
      data: inView.map((f) => ({ ...f, value: maxLog > 0 ? Math.log10(Math.max(1, f.emissions_t)) / maxLog : 0 })),
      metadata: {
        source: 'Climate TRACE',
        available: !unavailableNote,
        ...(unavailableNote ? { note: unavailableNote } : {}),
        unit: 'tonnes CO2e (100-year GWP)',
        coverage: `Largest ${ASSET_LIMIT} emitting facilities in Africa, ${year}`,
        generated_at: new Date().toISOString(),
      },
    };

    await logAuditEvent(supabaseClient, {
      p_actor_id: user.id,
      p_actor_type: 'user',
      p_org_id: null,
      p_action: 'climatetrace_proxy_request',
      p_target_table: null,
      p_target_id: null,
      p_payload: { sector: sector || 'all', year, cached: cacheHit, facilities: emissionsData.data.length, available: emissionsData.metadata.available }
    });

    return new Response(JSON.stringify(emissionsData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': cacheHit ? 'HIT' : 'MISS' },
    });
  } catch (error) {
    console.error('[CLIMATETRACE-PROXY] Error:', error);
    const isAuth = error instanceof Error && error.message === 'Unauthorized';
    if (!isAuth && supabaseClient) {
      try {
        await supabaseClient.rpc('record_provider_health', {
          p_provider_key: 'climatetrace', p_success: false, p_error_message: error instanceof Error ? error.message : 'Unknown error',
        });
      } catch { /* best-effort */ }
    }
    return new Response(JSON.stringify({ error: isAuth ? 'Unauthorized' : 'Internal server error' }), {
      status: isAuth ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
