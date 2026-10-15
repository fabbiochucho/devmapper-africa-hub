import { supabase } from '@/integrations/supabase/client';

// Types for AlphaEarth API responses
export interface AlphaEarthBenchmark {
  country: string;
  sector: string;
  year?: number;
  /** kg CO2e per US$ of GDP (economy-wide, Climate TRACE / World Bank). null when unavailable. */
  avg_carbon_intensity: number | null;
  available?: boolean;
  scope?: 'economy-wide';
  note?: string;
  source: string;
  confidence_score?: number;
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
 * Benchmark for display, or null when there is none. Goes through the proxy (which
 * caches server-side): the shared cache rows aren't readable by ordinary users.
 */
export async function getCachedBenchmark(
  country: string,
  sector: string,
  year?: number
): Promise<AlphaEarthBenchmark | null> {
  try {
    const benchmark = await getBenchmark(country, sector, year);
    return benchmark.available === false || benchmark.avg_carbon_intensity == null ? null : benchmark;
  } catch {
    return null;
  }
}