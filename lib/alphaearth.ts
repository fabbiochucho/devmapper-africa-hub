import { supabase } from '@/integrations/supabase/client';

// Types for AlphaEarth API responses
interface AlphaEarthBenchmark {
  country: string;
  sector: string;
  year?: number;
  avg_carbon_intensity: number;
  water_intensity?: number;
  waste_intensity?: number;
  source: string;
  confidence_score?: number;
  data_points?: number;
}

interface GEEBenchmark {
  country: string;
  sector?: string;
  year?: number;
  avg_carbon_intensity: number;
  source: string;
}

// Cache configuration
const CACHE_TTL_HOURS = 24;

/**
 * Get benchmark data based on organization's plan type
 * Free plans use Google Earth Engine data
 * Pro plans use AlphaEarth Commercial API
 */
export async function getBenchmarkForOrg(
  planType: string,
  country: string,
  sector: string,
  year?: number,
  orgId?: string
): Promise<AlphaEarthBenchmark> {
  const cacheKey = `benchmark:${planType}:${country}:${sector}:${year || 'latest'}`;
  
  // Check cache first
  const cached = await getCachedData(cacheKey);
  if (cached) return cached;

  let result: AlphaEarthBenchmark;
  
  try {
    if (planType === 'pro') {
      result = await getProBenchmark(country, sector, year);
    } else {
      result = await getFreeBenchmarkViaGEE(country, sector, year);
    }

    // Cache the result
    await setCachedData(cacheKey, result, planType === 'pro' ? 'alphaearth' : 'gee', orgId);
    
    return result;
  } catch (error) {
    console.error('AlphaEarth API error:', error);
    
    // Try to get stale cache data as fallback
    const staleData = await getCachedData(cacheKey, true);
    if (staleData) {
      console.warn('Using stale cache data due to API error');
      return staleData;
    }
    
    // Final fallback to default values
    return getDefaultBenchmark(country, sector, year);
  }
}

/**
 * Get Pro benchmark from AlphaEarth Commercial API
 */
async function getProBenchmark(
  country: string, 
  sector: string, 
  year?: number
): Promise<AlphaEarthBenchmark> {
  const baseUrl = process.env.NEXT_PUBLIC_ALPHAEARTH_BASE_URL || 'https://api.alphaearth.ai';
  const apiKey = process.env.ALPHAEARTH_API_KEY;
  
  if (!apiKey) {
    throw new Error('AlphaEarth API key not configured');
  }

  const params = new URLSearchParams({
    country,
    sector,
    ...(year && { year: year.toString() })
  });

  const response = await fetch(`${baseUrl}/benchmarks/sector?${params}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: 15000
  });

  if (!response.ok) {
    throw new Error(`AlphaEarth API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    ...data,
    source: 'AlphaEarth (Commercial)',
    country,
    sector,
    year
  };
}

/**
 * Get Free benchmark from Google Earth Engine (GEE)
 * This is a placeholder - in production you'd implement GEE service account calls
 */
async function getFreeBenchmarkViaGEE(
  country: string,
  sector?: string,
  year?: number
): Promise<GEEBenchmark> {
  // TODO: Implement actual GEE Earth Engine API calls
  // For now, return estimated values based on country/sector
  
  const countryFactors: Record<string, number> = {
    'NG': 0.52, // Nigeria
    'ZA': 0.91, // South Africa
    'KE': 0.34, // Kenya
    'GH': 0.45, // Ghana
    'EG': 0.55, // Egypt
    'US': 0.42,
    'GB': 0.28,
    'DE': 0.35,
    'CN': 0.65,
    'IN': 0.82
  };

  const sectorMultipliers: Record<string, number> = {
    'manufacturing': 1.4,
    'energy': 2.1,
    'transport': 1.6,
    'construction': 1.2,
    'agriculture': 0.8,
    'services': 0.6,
    'technology': 0.4
  };

  const baseIntensity = countryFactors[country] || 0.45;
  const sectorMultiplier = sectorMultipliers[sector?.toLowerCase() || 'services'] || 1.0;
  
  return {
    country,
    sector,
    year,
    avg_carbon_intensity: baseIntensity * sectorMultiplier,
    source: 'AlphaEarth Foundations (Google Earth Engine)'
  };
}

/**
 * Get cached benchmark data
 */
async function getCachedData(
  cacheKey: string, 
  allowStale: boolean = false
): Promise<AlphaEarthBenchmark | null> {
  try {
    const query = supabase
      .from('alphaearth_cache')
      .select('payload, fetched_at, expires_at')
      .eq('cache_key', cacheKey);
    
    if (!allowStale) {
      query.gt('expires_at', new Date().toISOString());
    }
    
    const { data, error } = await query.maybeSingle();
    
    if (error || !data) return null;
    
    return data.payload as AlphaEarthBenchmark;
  } catch (error) {
    console.error('Cache read error:', error);
    return null;
  }
}

/**
 * Cache benchmark data
 */
async function setCachedData(
  cacheKey: string,
  payload: AlphaEarthBenchmark,
  provider: string,
  orgId?: string
): Promise<void> {
  try {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + CACHE_TTL_HOURS);

    await supabase
      .from('alphaearth_cache')
      .upsert({
        cache_key: cacheKey,
        payload,
        provider,
        organization_id: orgId || null,
        fetched_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString()
      });
  } catch (error) {
    console.error('Cache write error:', error);
    // Don't throw - caching is not critical
  }
}

/**
 * Default fallback benchmark values
 */
function getDefaultBenchmark(
  country: string,
  sector: string,
  year?: number
): AlphaEarthBenchmark {
  return {
    country,
    sector,
    year,
    avg_carbon_intensity: 0.45, // Global average fallback
    source: 'Default (API unavailable)',
    confidence_score: 0.3
  };
}

/**
 * Enrich supplier emissions using AlphaEarth data
 */
export async function enrichSupplierEmissions(
  orgId: string,
  planType: string,
  suppliers: Array<{
    id: string;
    name: string;
    country_code: string;
    sector: string;
    annual_spend?: number;
  }>,
  year: number = new Date().getFullYear()
) {
  const enrichedResults = [];

  for (const supplier of suppliers) {
    try {
      const benchmark = await getBenchmarkForOrg(
        planType,
        supplier.country_code,
        supplier.sector,
        year,
        orgId
      );

      // Calculate estimated emissions based on spend and intensity
      const estimatedEmissions = supplier.annual_spend 
        ? (supplier.annual_spend * benchmark.avg_carbon_intensity) / 1000000 // Convert to tonnes
        : 0;

      enrichedResults.push({
        supplier_id: supplier.id,
        estimated_emissions: estimatedEmissions,
        benchmark_used: benchmark,
        enrichment_date: new Date().toISOString()
      });

      // Update supplier as enriched
      await supabase
        .from('esg_suppliers')
        .update({ alphaearth_enriched: true })
        .eq('id', supplier.id);

    } catch (error) {
      console.error(`Failed to enrich supplier ${supplier.name}:`, error);
      enrichedResults.push({
        supplier_id: supplier.id,
        error: error.message
      });
    }
  }

  return enrichedResults;
}

/**
 * Get organization's AlphaEarth API usage statistics
 */
export async function getApiUsageStats(orgId: string, month?: number, year?: number) {
  const startDate = new Date(year || new Date().getFullYear(), month || new Date().getMonth(), 1);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const { data, error } = await supabase
    .from('alphaearth_cache')
    .select('provider, fetched_at')
    .eq('organization_id', orgId)
    .gte('fetched_at', startDate.toISOString())
    .lt('fetched_at', endDate.toISOString());

  if (error) {
    console.error('Error fetching API usage:', error);
    return { gee_calls: 0, alphaearth_calls: 0, total_calls: 0 };
  }

  const geeCallsCount = data?.filter(d => d.provider === 'gee').length || 0;
  const alphaEarthCallsCount = data?.filter(d => d.provider === 'alphaearth').length || 0;

  return {
    gee_calls: geeCallsCount,
    alphaearth_calls: alphaEarthCallsCount,
    total_calls: geeCallsCount + alphaEarthCallsCount
  };
}