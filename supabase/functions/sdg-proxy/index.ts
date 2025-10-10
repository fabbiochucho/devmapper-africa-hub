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
    console.log('[SDG-PROXY] Incoming request');
    
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

    const { goal, country, indicator } = await req.json();
    console.log('[SDG-PROXY] Request:', { goal, country, indicator });

    // Check cache
    const cacheKey = `sdg:${goal}:${country}:${indicator}`;
    const { data: cached } = await supabaseClient
      .from('alphaearth_cache')
      .select('payload')
      .eq('cache_key', cacheKey)
      .eq('provider', 'sdg')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cached) {
      console.log('[SDG-PROXY] Cache hit');
      return new Response(JSON.stringify(cached.payload), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
      });
    }

    // Mock SDG data (in production, fetch from UN SDG API / World Bank API)
    const sdgData = {
      goal,
      country,
      indicator,
      data: generateMockSDGData(goal, country),
      metadata: {
        source: 'UN SDG Database',
        note: 'Mock data - Will fetch from real APIs in production',
        generated_at: new Date().toISOString()
      }
    };

    // Cache for 30 days (SDG data updates infrequently)
    await supabaseClient
      .from('alphaearth_cache')
      .insert({
        cache_key: cacheKey,
        provider: 'sdg',
        payload: sdgData,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

    await supabaseClient.rpc('log_audit_event', {
      p_actor_id: user.id,
      p_actor_type: 'user',
      p_org_id: null,
      p_action: 'sdg_proxy_request',
      p_target_table: null,
      p_target_id: null,
      p_payload: { goal, country, indicator, cached: false }
    });

    return new Response(JSON.stringify(sdgData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
    });
  } catch (error) {
    console.error('[SDG-PROXY] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.message === 'Unauthorized' ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateMockSDGData(goal: number, country: string) {
  const years = [2018, 2019, 2020, 2021, 2022];
  return years.map(year => ({
    year,
    value: 40 + Math.random() * 40, // Mock progress percentage
    target: 80,
    trend: Math.random() > 0.5 ? 'improving' : 'stable'
  }));
}
