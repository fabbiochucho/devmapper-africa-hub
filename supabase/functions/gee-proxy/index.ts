import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { type Database, type Db, asJson, logAuditEvent } from '../_shared/db.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google Earth Engine REST API endpoint
const GEE_API = 'https://earthengine.googleapis.com/v1';

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

async function fetchLiveGEEData(body: GEERequest, serviceAccountKey: string) {
  // Parse service account key for JWT signing
  const serviceAccount = JSON.parse(serviceAccountKey);
  
  // Create JWT for GEE auth
  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/earthengine.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));

  // For actual RS256 signing we'd need a crypto library;
  // in practice, use Google's OAuth2 token endpoint with the service account
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${payload}.${serviceAccount.private_key}`, // Simplified; real impl needs proper signing
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`GEE token exchange failed: ${tokenResponse.status}`);
  }

  const { access_token } = await tokenResponse.json();

  // Map request type to GEE dataset
  const datasetMap: Record<string, string> = {
    ndvi: 'MODIS/006/MOD13A2',
    water: 'JRC/GSW1_4/GlobalSurfaceWater',
    urban: 'GHSL/GHS_BUILT_S_E2025_GLOBE_R2023A',
  };

  const dataset = datasetMap[body.type] || datasetMap.ndvi;
  
  // GEE computePixels API call
  const geeResponse = await fetch(`${GEE_API}/projects/earthengine-public/assets/${dataset}:computePixels`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      expression: {
        functionInvocationValue: {
          functionName: 'Image.pixelLonLat',
          arguments: {},
        }
      },
      fileFormat: 'JSON_PIXELS',
      grid: {
        dimensions: { width: 100, height: 100 },
        affineTransform: {
          scaleX: (body.bounds.east - body.bounds.west) / 100,
          scaleY: -(body.bounds.north - body.bounds.south) / 100,
          translateX: body.bounds.west,
          translateY: body.bounds.north,
        }
      }
    }),
  });

  if (!geeResponse.ok) {
    throw new Error(`GEE API returned ${geeResponse.status}`);
  }

  const rawData = await geeResponse.json();
  
  return {
    type: body.type,
    bounds: body.bounds,
    data: rawData.pixels || [],
    metadata: {
      source: `Google Earth Engine (Live - ${dataset})`,
      generated_at: new Date().toISOString(),
      dataset,
    }
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
