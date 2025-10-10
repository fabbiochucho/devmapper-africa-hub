import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GEERequest {
  type: 'ndvi' | 'water' | 'urban';
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  startDate?: string;
  endDate?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[GEE-PROXY] Incoming request');
    
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const body: GEERequest = await req.json();
    console.log('[GEE-PROXY] Request params:', body);

    // Check cache first
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

    // Simulated GEE response (in production, this would call actual GEE API)
    // For now, return mock data until GEE service account is configured
    console.log('[GEE-PROXY] Cache miss, generating mock response');
    
    const mockData = {
      type: body.type,
      bounds: body.bounds,
      data: generateMockGEEData(body.type, body.bounds),
      metadata: {
        source: 'Google Earth Engine',
        generated_at: new Date().toISOString(),
        note: 'Mock data - Configure GEE_SERVICE_ACCOUNT for real data'
      }
    };

    // Cache the response
    await supabaseClient
      .from('alphaearth_cache')
      .insert({
        cache_key: cacheKey,
        provider: 'gee',
        payload: mockData,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      });

    // Log to audit
    await supabaseClient.rpc('log_audit_event', {
      p_actor_id: user.id,
      p_actor_type: 'user',
      p_org_id: null,
      p_action: 'gee_proxy_request',
      p_target_table: null,
      p_target_id: null,
      p_payload: { type: body.type, cached: false }
    });

    return new Response(JSON.stringify(mockData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
    });
  } catch (error) {
    console.error('[GEE-PROXY] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.message === 'Unauthorized' ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateMockGEEData(type: string, bounds: any) {
  const resolution = 0.01; // ~1km resolution
  const data = [];
  
  for (let lat = bounds.south; lat < bounds.north; lat += resolution) {
    for (let lng = bounds.west; lng < bounds.east; lng += resolution) {
      let value;
      switch (type) {
        case 'ndvi':
          // NDVI ranges from -1 to 1, vegetation is typically 0.2 to 0.8
          value = 0.3 + Math.random() * 0.5;
          break;
        case 'water':
          // Water mask: 0 = no water, 1 = water
          value = Math.random() > 0.8 ? 1 : 0;
          break;
        case 'urban':
          // Urban density: 0 to 1
          value = Math.random() * 0.7;
          break;
        default:
          value = Math.random();
      }
      
      data.push({ lat, lng, value });
    }
  }
  
  return data.slice(0, 100); // Limit response size for demo
}
