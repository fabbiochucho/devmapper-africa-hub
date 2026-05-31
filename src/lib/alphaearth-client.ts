/**
 * AlphaEarth API Client
 * Communicates with server-side edge function to access AlphaEarth data
 * API key is never exposed to the client
 */

import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/lib/error-handler';

export interface BenchmarkData {
  sector: string;
  region: string;
  averageEmissions: number;
  industryLeaders: Array<{ company: string; emissions: number }>;
}

export interface EnrichedSupplier {
  supplierId: string;
  enrichedData: unknown;
  confidence: number;
}

export interface ApiUsage {
  callsUsed: number;
  callsLimit: number;
  callsRemaining: number;
}

/**
 * Get benchmark data via secure edge function
 */
export async function getBenchmarkForOrg(
  organizationId: string,
  options?: { sector?: string; region?: string; year?: number }
): Promise<BenchmarkData | null> {
  try {
    const { data, error } = await supabase.functions.invoke('alphaearth-benchmark', {
      body: {
        action: 'benchmark',
        organizationId,
        ...options,
      },
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Unknown error');

    return data.data as BenchmarkData;
  } catch (error) {
    logError('getBenchmarkForOrg', error);
    return null;
  }
}

/**
 * Enrich supplier data via secure edge function
 */
export async function enrichSupplierEmissions(
  supplierId: string,
  supplierName: string,
  category: string
): Promise<EnrichedSupplier | null> {
  try {
    const { data, error } = await supabase.functions.invoke('alphaearth-benchmark', {
      body: {
        action: 'enrich',
        supplierId,
        supplierName,
        category,
      },
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Enrichment failed');

    return {
      supplierId,
      enrichedData: data.data,
      confidence: 0.85, // Placeholder - real implementation would come from API
    };
  } catch (error) {
    logError('enrichSupplierEmissions', error);
    return null;
  }
}

/**
 * Get API usage statistics via secure edge function
 */
export async function getApiUsageStats(organizationId: string): Promise<ApiUsage | null> {
  try {
    const { data, error } = await supabase.functions.invoke('alphaearth-benchmark', {
      body: {
        action: 'usage',
        organizationId,
      },
    });

    if (error) throw error;
    if (!data?.success) throw new Error(data?.error || 'Failed to get usage stats');

    const statsData = data.data as { calls_used?: number; calls_limit?: number };
    const callsUsed = statsData.calls_used || 0;
    const callsLimit = statsData.calls_limit || 1000;

    return {
      callsUsed,
      callsLimit,
      callsRemaining: Math.max(0, callsLimit - callsUsed),
    };
  } catch (error) {
    logError('getApiUsageStats', error);
    return null;
  }
}
