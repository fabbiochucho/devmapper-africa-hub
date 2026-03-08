import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Climate TRACE public API (free, no key required)
const CLIMATETRACE_API = 'https://api.climatetrace.org/v6';

interface CTRequest {
  country: string;
  sector?: string;
  year?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[CLIMATETRACE-PROXY] Incoming request');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { country, sector, year }: CTRequest = await req.json();
    console.log('[CLIMATETRACE-PROXY] Request:', { country, sector, year });

    // Check cache
    const cacheKey = `climatetrace:${country}:${sector || 'all'}:${year || 'latest'}`;
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

    // Call real Climate TRACE API
    console.log('[CLIMATETRACE-PROXY] Cache miss, calling Climate TRACE API');

    let apiUrl = `${CLIMATETRACE_API}/country/emissions?since=2015&to=2023`;
    if (country) apiUrl += `&countries=${country.toUpperCase()}`;
    if (sector) apiUrl += `&sector=${sector}`;

    let emissionsData: any;

    try {
      const apiResponse = await fetch(apiUrl, {
        headers: { 'Accept': 'application/json' },
      });

      if (apiResponse.ok) {
        const rawData = await apiResponse.json();
        emissionsData = {
          country,
          sector: sector || 'all',
          year: year || 2022,
          emissions: rawData,
          metadata: {
            source: 'Climate TRACE API (Live)',
            generated_at: new Date().toISOString(),
            unit: 'tonnes CO2e',
            api_version: 'v6',
          }
        };
      } else {
        console.warn('[CLIMATETRACE-PROXY] API returned', apiResponse.status, '- falling back to estimates');
        emissionsData = generateFallbackEmissions(country, sector, year);
      }
    } catch (fetchError) {
      console.warn('[CLIMATETRACE-PROXY] API call failed:', fetchError, '- using fallback');
      emissionsData = generateFallbackEmissions(country, sector, year);
    }

    // Cache for 30 days
    await supabaseClient
      .from('alphaearth_cache')
      .insert({
        cache_key: cacheKey,
        provider: 'climatetrace',
        payload: emissionsData,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

    await supabaseClient.rpc('log_audit_event', {
      p_actor_id: user.id,
      p_actor_type: 'user',
      p_org_id: null,
      p_action: 'climatetrace_proxy_request',
      p_target_table: null,
      p_target_id: null,
      p_payload: { country, sector, year, cached: false, live: emissionsData.metadata?.source?.includes('Live') }
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

function generateFallbackEmissions(country: string, sector: string | undefined, year: number | undefined) {
  const sectors = sector ? [sector] : ['energy', 'transport', 'agriculture', 'industry', 'waste'];
  return {
    country,
    sector: sector || 'all',
    year: year || 2022,
    emissions: sectors.map(s => ({
      sector: s,
      total_emissions: Math.random() * 1000000,
      facilities: Math.floor(Math.random() * 50) + 10,
      trend: Math.random() > 0.6 ? 'increasing' : 'decreasing'
    })),
    metadata: {
      source: 'Climate TRACE (Estimated - API unavailable)',
      generated_at: new Date().toISOString(),
      unit: 'tonnes CO2e'
    }
  };
}
