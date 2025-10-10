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
    console.log('[CLIMATETRACE-PROXY] Incoming request');
    
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

    const { country, sector, year } = await req.json();
    console.log('[CLIMATETRACE-PROXY] Request:', { country, sector, year });

    // Check cache
    const cacheKey = `climatetrace:${country}:${sector}:${year}`;
    const { data: cached } = await supabaseClient
      .from('alphaearth_cache')
      .select('payload')
      .eq('cache_key', cacheKey)
      .eq('provider', 'climatetrace')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cached) {
      console.log('[CLIMATETRACE-PROXY] Cache hit');
      return new Response(JSON.stringify(cached.payload), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
      });
    }

    // Mock Climate TRACE data
    const emissionsData = {
      country,
      sector: sector || 'all',
      year: year || 2022,
      emissions: generateMockEmissions(country, sector),
      metadata: {
        source: 'Climate TRACE',
        note: 'Mock data - Will fetch from real Climate TRACE API in production',
        generated_at: new Date().toISOString(),
        unit: 'tonnes CO2e'
      }
    };

    // Cache for 90 days (emissions data updates quarterly)
    await supabaseClient
      .from('alphaearth_cache')
      .insert({
        cache_key: cacheKey,
        provider: 'climatetrace',
        payload: emissionsData,
        expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      });

    await supabaseClient.rpc('log_audit_event', {
      p_actor_id: user.id,
      p_actor_type: 'user',
      p_org_id: null,
      p_action: 'climatetrace_proxy_request',
      p_target_table: null,
      p_target_id: null,
      p_payload: { country, sector, year, cached: false }
    });

    return new Response(JSON.stringify(emissionsData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
    });
  } catch (error) {
    console.error('[CLIMATETRACE-PROXY] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.message === 'Unauthorized' ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateMockEmissions(country: string, sector: string) {
  const sectors = sector ? [sector] : ['energy', 'transport', 'agriculture', 'industry', 'waste'];
  
  return sectors.map(s => ({
    sector: s,
    total_emissions: Math.random() * 1000000, // Mock tonnes
    facilities: Math.floor(Math.random() * 50) + 10,
    trend: Math.random() > 0.6 ? 'increasing' : 'decreasing'
  }));
}
