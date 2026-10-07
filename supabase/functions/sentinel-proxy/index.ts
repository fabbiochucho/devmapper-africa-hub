import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { type Database, type Db } from '../_shared/db.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let supabaseClient: Db | null = null;

  try {
    console.log('[SENTINEL-PROXY] Incoming request');

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

    // No Sentinel Hub integration exists yet. This used to return a made-up ".../mock/..." tile URL
    // and record the call as a success; say plainly that imagery isn't available instead.
    try {
      await supabaseClient.rpc('record_provider_health', {
        p_provider_key: 'sentinel', p_success: false, p_error_message: 'Sentinel Hub is not connected',
      });
    } catch { /* best-effort */ }

    return new Response(JSON.stringify({
      tile: { z, x, y },
      layer,
      url: null,
      metadata: { source: 'Copernicus Sentinel Hub', available: false, note: 'Sentinel Hub is not connected; no imagery available.' },
    }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[SENTINEL-PROXY] Error:', error);
    const isAuth = error instanceof Error && error.message === 'Unauthorized';
    if (!isAuth && supabaseClient) {
      try {
        await supabaseClient.rpc('record_provider_health', {
          p_provider_key: 'sentinel', p_success: false, p_error_message: error instanceof Error ? error.message : 'Unknown error',
        });
      } catch { /* best-effort */ }
    }
    return new Response(JSON.stringify({ error: isAuth ? 'Unauthorized' : 'Internal server error' }), {
      status: isAuth ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
