import { getBenchmark, type AlphaEarthBenchmark } from '@/lib/alphaearth-client';

export interface SuggestedPriceInput {
  projectType: string;
  countryCode: string;
  vintageYear: number;
}

export interface SuggestedPriceRange {
  low: number;
  mid: number;
  high: number;
  source: string;
  confidence: number;
}

// Typical real-world per-tonne price anchors by project type (nature-based
// projects generally trade lower than tech-based removal credits).
// TODO(business-logic): these anchors are illustrative market ranges, not
// calibrated against a live carbon-price index (eg. a Verra/Gold Standard
// secondary-market feed) - revisit before relying on this commercially.
const PROJECT_TYPE_BASE_PRICE: Record<string, number> = {
  reforestation: 12,
  cookstoves: 8,
  renewable_energy: 6,
  waste_management: 10,
  mangrove: 15,
  soil_carbon: 14,
  other: 10,
};

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Pure function: maps a listing's project type/country/vintage plus an
 * AlphaEarth/GEE sector-benchmark reading into a suggested price-per-tonne
 * range. This is a non-binding suggestion shown to the seller - they still
 * set the final price_per_tonne themselves.
 */
export function computeSuggestedPriceRange(
  input: SuggestedPriceInput,
  benchmark: AlphaEarthBenchmark,
): SuggestedPriceRange {
  const base = PROJECT_TYPE_BASE_PRICE[input.projectType] ?? PROJECT_TYPE_BASE_PRICE.other;

  // Local emissions intensity is used as a rough demand/scarcity proxy: a
  // higher-intensity country/sector context nudges the suggested price up.
  // avg_carbon_intensity from the benchmark is a kg-CO2e-per-USD figure built
  // for ESG reporting, not a carbon-credit market signal - this mapping is a
  // heuristic, not a derived market price.
  const intensityMultiplier = 0.85 + Math.min(benchmark.avg_carbon_intensity, 2) * 0.15;

  // Older vintages typically trade at a discount.
  const age = Math.max(0, CURRENT_YEAR - input.vintageYear);
  const vintageMultiplier = Math.max(0.7, 1 - age * 0.03);

  const mid = Math.round(base * intensityMultiplier * vintageMultiplier * 100) / 100;

  // Lower confidence in the underlying benchmark widens the suggested range.
  const confidence = benchmark.confidence_score ?? 0.5;
  const spread = mid * (0.35 - confidence * 0.2);

  return {
    low: Math.max(1, Math.round((mid - spread) * 100) / 100),
    mid,
    high: Math.round((mid + spread) * 100) / 100,
    source: benchmark.source,
    confidence,
  };
}

/**
 * Thin async wrapper: fetches the benchmark via the existing secure
 * alphaearth-proxy path and computes a suggested price range from it.
 */
export async function getSuggestedPrice(
  input: SuggestedPriceInput,
  organizationId?: string,
): Promise<SuggestedPriceRange> {
  const benchmark = await getBenchmark(input.countryCode, input.projectType, input.vintageYear, organizationId);
  return computeSuggestedPriceRange(input, benchmark);
}
