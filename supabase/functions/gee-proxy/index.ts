import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { type Database, type Db, asJson, logAuditEvent } from '../_shared/db.ts';
import * as eeModule from 'https://esm.sh/@google/earthengine@1.7.47';
// CommonJS package: esm.sh exposes it as the default export. Its types don't cover the call
// signatures used here, so treat it as untyped.
// deno-lint-ignore no-explicit-any
const ee = ((eeModule as any).default ?? eeModule) as any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};


interface GEERequest {
  type: 'ndvi' | 'water' | 'urban';
  bounds: { north: number; south: number; east: number; west: number };
  startDate?: string;
  endDate?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let supabaseClient: Db | null = null;

  try {
    console.log('[GEE-PROXY] Incoming request');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');

    supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const body: GEERequest = await req.json();
    console.log('[GEE-PROXY] Request params:', body);

    // Check cache
    const cacheKey = `gee:${body.type}:${JSON.stringify(body.bounds)}:${body.startDate}:${body.endDate}`;
    const { data: cached } = await supabaseClient
      .from('alphaearth_cache')
      .select('payload, fetched_at, expires_at')
      .eq('cache_key', cacheKey)
      .eq('provider', 'gee')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cached) {
      console.log('[GEE-PROXY] Cache hit');
      return new Response(JSON.stringify(cached.payload), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
      });
    }

    // Check if GEE service account is configured
    const geeServiceAccount = Deno.env.get('GEE_SERVICE_ACCOUNT_KEY');
    let geeData: unknown;

    if (geeServiceAccount) {
      console.log('[GEE-PROXY] Using live GEE API');
      try {
        geeData = await fetchLiveGEEData(body, geeServiceAccount);
        try { await supabaseClient.rpc('record_provider_health', { p_provider_key: 'gee', p_success: true }); } catch { /* best-effort */ }
      } catch (geeError) {
        console.warn('[GEE-PROXY] GEE API failed:', geeError);
        geeData = notAvailable(body, 'Earth Engine request failed; no reading available.');
        try {
          await supabaseClient.rpc('record_provider_health', {
            p_provider_key: 'gee', p_success: false, p_error_message: geeError instanceof Error ? geeError.message : 'Unknown error',
          });
        } catch { /* best-effort */ }
      }
    } else {
      console.log('[GEE-PROXY] No GEE_SERVICE_ACCOUNT_KEY configured');
      geeData = notAvailable(body, 'Earth Engine is not configured (GEE_SERVICE_ACCOUNT_KEY); no reading available.');
    }

    // Cache real readings only, so a fixed key or outage isn't masked for 24h
    if ((geeData as { metadata?: { available?: boolean } }).metadata?.available !== false) await supabaseClient
      .from('alphaearth_cache')
      .insert({
        cache_key: cacheKey,
        provider: 'gee',
        payload: asJson(geeData),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });

    await logAuditEvent(supabaseClient, {
      p_actor_id: user.id,
      p_actor_type: 'user',
      p_org_id: null,
      p_action: 'gee_proxy_request',
      p_target_table: null,
      p_target_id: null,
      p_payload: { type: body.type, cached: false, live: !!geeServiceAccount }
    });

    return new Response(JSON.stringify(geeData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
    });
  } catch (error) {
    console.error('[GEE-PROXY] Error:', error);
    const isAuth = error instanceof Error && error.message === 'Unauthorized';
    if (!isAuth && supabaseClient) {
      try {
        await supabaseClient.rpc('record_provider_health', {
          p_provider_key: 'gee', p_success: false, p_error_message: error instanceof Error ? error.message : 'Unknown error',
        });
      } catch { /* best-effort */ }
    }
    return new Response(JSON.stringify({ error: isAuth ? 'Unauthorized' : 'Internal server error' }), {
      status: isAuth ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Live readings through Google's Earth Engine client, authenticated with the service-account key
// (GEE_SERVICE_ACCOUNT_KEY). The previous hand-rolled REST call never signed its token and asked for
// pixel coordinates rather than values, so it could not have returned real data.
let eeReady: Promise<void> | null = null; // one login per function instance

function initEarthEngine(serviceAccountKey: string): Promise<void> {
  if (eeReady) return eeReady;
  const key = JSON.parse(serviceAccountKey);
  eeReady = new Promise<void>((resolve, reject) => {
    ee.data.authenticateViaPrivateKey(key, () => {
      ee.initialize(null, null, () => resolve(), (e: unknown) => reject(e), null, key.project_id);
    }, (e: unknown) => reject(e));
  }).catch((e) => { eeReady = null; throw e; });
  return eeReady;
}

const evaluate = <T>(obj: { evaluate: (cb: (v: T, err?: string) => void) => void }) =>
  new Promise<T>((resolve, reject) => obj.evaluate((v, err) => (err ? reject(new Error(err)) : resolve(v))));

// What each layer measures, as a single-band image named "value".
// ponytail: fixed dataset per layer; make them parameters if users need to pick sources.
const LAYERS: Record<GEERequest['type'], { dataset: string; scale: number; image: (start: string, end: string) => unknown }> = {
  ndvi: { // vegetation index, -1..1
    dataset: 'MODIS/061/MOD13A2', scale: 1000,
    image: (start, end) => ee.ImageCollection('MODIS/061/MOD13A2').filterDate(start, end).select('NDVI').mean().multiply(0.0001).rename('value'),
  },
  water: { // share of 1984-2021 observations with surface water, 0..1
    dataset: 'JRC/GSW1_4/GlobalSurfaceWater', scale: 100,
    image: () => ee.Image('JRC/GSW1_4/GlobalSurfaceWater').select('occurrence').divide(100).unmask(0).rename('value'),
  },
  urban: { // built-up share of each 100 m cell, 0..1 (2025 epoch)
    dataset: 'JRC/GHSL/P2023A/GHS_BUILT_S', scale: 100,
    image: () => ee.Image('JRC/GHSL/P2023A/GHS_BUILT_S/2025').select('built_surface').divide(10000).rename('value'),
  },
};

async function fetchLiveGEEData(body: GEERequest, serviceAccountKey: string) {
  await initEarthEngine(serviceAccountKey);
  const layer = LAYERS[body.type] ?? LAYERS.ndvi;
  const end = body.endDate ?? new Date().toISOString().slice(0, 10);
  const start = body.startDate ?? new Date(Date.now() - 365 * 86400_000).toISOString().slice(0, 10);

  // A grid of at most 10 x 10 points over the requested area (capped at 2 degrees a side).
  const { south, west } = body.bounds;
  const north = Math.min(body.bounds.north, south + 2), east = Math.min(body.bounds.east, west + 2);
  const n = 10, points = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const lat = south + ((i + 0.5) * (north - south)) / n, lng = west + ((j + 0.5) * (east - west)) / n;
    points.push(ee.Feature(ee.Geometry.Point([lng, lat]), { lat, lng }));
  }
  const sampled = (layer.image(start, end) as { reduceRegions: (o: unknown) => unknown }).reduceRegions({
    collection: ee.FeatureCollection(points), reducer: ee.Reducer.first(), scale: layer.scale,
  });
  const fc = await evaluate<{ features: { properties: { lat: number; lng: number; first?: number | null } }[] }>(sampled as never);
  const data = fc.features
    .map((f) => ({ lat: f.properties.lat, lng: f.properties.lng, value: f.properties.first }))
    .filter((p): p is { lat: number; lng: number; value: number } => typeof p.value === 'number');

  return {
    type: body.type,
    bounds: body.bounds,
    data,
    metadata: {
      source: `Google Earth Engine (${layer.dataset})`,
      available: data.length > 0,
      ...(data.length ? {} : { note: 'Earth Engine returned no readings for this area.' }),
      period: body.type === 'ndvi' ? { start, end } : undefined,
      generated_at: new Date().toISOString(),
      dataset: layer.dataset,
    },
  };
}

// No reading: say so instead of inventing one. Random 'estimated' NDVI used to reach report
// evidence and auto-validation verdicts.
function notAvailable(body: GEERequest, note: string) {
  return {
    type: body.type,
    bounds: body.bounds,
    data: [],
    metadata: { source: 'Google Earth Engine', available: false, note, generated_at: new Date().toISOString() },
  };
}
