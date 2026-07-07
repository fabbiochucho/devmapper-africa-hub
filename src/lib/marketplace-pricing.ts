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

// Per-tonne price anchors by project type, sourced from Ecosystem
// Marketplace's "State of the Voluntary Carbon Market" 2024/2025 reports
// and S&P Global Commodity Insights' dedicated Blue Carbon price
// assessments (launched March 2024) - real published secondary-market
// averages, not guessed ranges. Confidence varies by category (see
// PROJECT_TYPE_PRICE_CONFIDENCE below); this still isn't a live feed, so
// treat it as a periodically-refreshed anchor, not real-time pricing.
//
//   reforestation:     $14/t  - SOVCM 2024, "restoration credits averaged $14/t"
//   cookstoves:        $17.3/t - 2023 VCM average (range $1.3-$31); notably
//                                HIGHER than the old placeholder guess of $8
//   renewable_energy:  $5.8/t - SOVCM 2024, "energy efficiency credits $5.80/t"
//   soil_carbon:       $20/t  - midpoint of the confirmed $10-35 agricultural
//                                credit range (VM0042-methodology projects)
//   mangrove:          $27/t  - blue carbon: multiple sources converge on
//                                mid-$20s-$32/t (S&P Global Blue Carbon index:
//                                $25.25/t Dec 2024, $29.30/t Aug 2025 record)
//   waste_management:  $6.37/t - no landfill-gas-specific figure found with
//                                confidence; anchored to the overall VCM
//                                average instead of guessing a category number
//   other:             $6.37/t - overall VCM 2024 average (Ecosystem Marketplace)
const PROJECT_TYPE_BASE_PRICE: Record<string, number> = {
  reforestation: 14,
  cookstoves: 17.3,
  renewable_energy: 5.8,
  waste_management: 6.37,
  mangrove: 27,
  soil_carbon: 20,
  other: 6.37,
};

/** Lower confidence = wider suggested range. waste_management/other are anchored to the market-wide average rather than a category-specific figure. */
const PROJECT_TYPE_PRICE_CONFIDENCE: Record<string, number> = {
  reforestation: 0.7,
  cookstoves: 0.7,
  renewable_energy: 0.7,
  soil_carbon: 0.55,
  mangrove: 0.75,
  waste_management: 0.4,
  other: 0.3,
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

  // Overall confidence blends two independent sources: how solid the
  // underlying AlphaEarth/GEE benchmark reading is, and how solid the
  // price anchor itself is (some project types have a directly-cited
  // market average; others are anchored to the market-wide average
  // because no category-specific figure was found - see
  // PROJECT_TYPE_PRICE_CONFIDENCE above). Lower confidence widens the
  // suggested range.
  const benchmarkConfidence = benchmark.confidence_score ?? 0.5;
  const priceAnchorConfidence = PROJECT_TYPE_PRICE_CONFIDENCE[input.projectType] ?? PROJECT_TYPE_PRICE_CONFIDENCE.other;
  const confidence = Math.round((benchmarkConfidence * 0.4 + priceAnchorConfidence * 0.6) * 100) / 100;
  const spread = mid * (0.35 - confidence * 0.2);

  return {
    low: Math.max(1, Math.round((mid - spread) * 100) / 100),
    mid,
    high: Math.round((mid + spread) * 100) / 100,
    // Kept short for inline UI display; see module comments above for the
    // full attribution (Ecosystem Marketplace SOVCM 2024/2025, S&P Global
    // Blue Carbon index) behind the per-type price anchors.
    source: `VCM market average + ${benchmark.source}`,
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
