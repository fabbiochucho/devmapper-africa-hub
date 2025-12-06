import { supabase } from '@/integrations/supabase/client';

// Types for AlphaEarth API responses
export interface AlphaEarthBenchmark {
  country: string;
  sector: string;
  year?: number;
  avg_carbon_intensity: number;
  water_intensity?: number;
  waste_intensity?: number;
  source: string;
  confidence_score?: number;
  data_points?: number;
  cached?: boolean;
}

export interface SupplierEnrichmentResult {
  supplier_id: string;
  supplier_name: string;
  estimated_emissions?: number;
  benchmark_used?: AlphaEarthBenchmark;
  enrichment_date?: string;
  error?: string;
}

/**
 * Get benchmark data via the server-side AlphaEarth proxy
 * This is the secure way to access AlphaEarth data
 */
export async function getBenchmark(
  country: string,
  sector: string,
  year?: number,
  organizationId?: string
): Promise<AlphaEarthBenchmark> {
  const { data, error } = await supabase.functions.invoke('alphaearth-proxy', {
    body: {
      country,
      sector,
      year,
      organizationId
    }
  });

  if (error) {
    console.error('AlphaEarth proxy error:', error);
    throw new Error(error.message || 'Failed to fetch benchmark data');
  }

  return data as AlphaEarthBenchmark;
}

/**
 * Enrich supplier emissions data via the server-side proxy
 */
export async function enrichSuppliers(
  organizationId: string,
  suppliers: Array<{
    id: string;
    name: string;
    country_code: string;
    sector: string;
    annual_spend?: number;
  }>,
  year?: number
): Promise<{ enriched: SupplierEnrichmentResult[]; total: number }> {
  const { data, error } = await supabase.functions.invoke('alphaearth-proxy?action=enrich-suppliers', {
    body: {
      organizationId,
      suppliers,
      year
    }
  });

  if (error) {
    console.error('Supplier enrichment error:', error);
    throw new Error(error.message || 'Failed to enrich supplier data');
  }

  return data;
}

/**
 * Get cached benchmark (for display purposes, falls back gracefully)
 */
export async function getCachedBenchmark(
  country: string,
  sector: string,
  year?: number
): Promise<AlphaEarthBenchmark | null> {
  try {
    const cacheKey = `benchmark:${country}:${sector}:${year || 'latest'}`;
    
    const { data, error } = await supabase
      .from('alphaearth_cache')
      .select('payload')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error || !data?.payload) return null;
    
    // Safely cast the JSON payload
    const payload = data.payload as unknown as AlphaEarthBenchmark;
    return payload;
  } catch {
    return null;
  }
}