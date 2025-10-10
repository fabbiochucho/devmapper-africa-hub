import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[SENTINEL-PROXY] Incoming request');
    
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

    const { z, x, y, layer } = await req.json();
    console.log('[SENTINEL-PROXY] Tile request:', { z, x, y, layer });

    // Check cache
    const cacheKey = `sentinel:${layer}:${z}:${x}:${y}`;
    const { data: cached } = await supabaseClient
      .from('alphaearth_cache')
      .select('payload')
      .eq('cache_key', cacheKey)
      .eq('provider', 'sentinel')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cached) {
      console.log('[SENTINEL-PROXY] Cache hit');
      return new Response(JSON.stringify(cached.payload), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
      });
    }

    // Mock Sentinel tile data
    const tileData = {
      tile: { z, x, y },
      layer,
      url: `https://services.sentinel-hub.com/ogc/wms/mock/${layer}/${z}/${x}/${y}`,
      metadata: {
        source: 'Copernicus Sentinel Hub',
        note: 'Mock tile URL - Configure SENTINEL_CLIENT_ID for real data',
        generated_at: new Date().toISOString()
      }
    };

    // Cache for 7 days
    await supabaseClient
      .from('alphaearth_cache')
      .insert({
        cache_key: cacheKey,
        provider: 'sentinel',
        payload: tileData,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });

    await supabaseClient.rpc('log_audit_event', {
      p_actor_id: user.id,
      p_actor_type: 'user',
      p_org_id: null,
      p_action: 'sentinel_proxy_request',
      p_target_table: null,
      p_target_id: null,
      p_payload: { layer, tile: { z, x, y }, cached: false }
    });

    return new Response(JSON.stringify(tileData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
    });
  } catch (error) {
    console.error('[SENTINEL-PROXY] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.message === 'Unauthorized' ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
