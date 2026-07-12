// #97: extends #76's satellite-linked evidence (which only fetched and
// displayed an NDVI reading) with an automatic correlation pass - does the
// vegetation index plausibly support the kind of claim this report is
// making, or does it look inconsistent enough to flag for closer review.

export type SatelliteValidationVerdict = 'consistent' | 'possible_mismatch' | 'not_applicable' | 'no_data';

export interface SatelliteValidationInput {
  /** The report's primary SDG goal (1-17), used to decide whether vegetation
   * index is a meaningful signal for this kind of claim at all. */
  sdgGoal: number | null;
  ndviValue: number | null;
}

export interface SatelliteValidationResult {
  verdict: SatelliteValidationVerdict;
  message: string;
}

// SDGs where land cover / vegetation condition is directly relevant to the
// claim being made: 2 (agriculture/food security), 6 (water & wetlands),
// 13 (climate action - commonly reforestation/land-restoration projects),
// 14 (life below water - mangroves/coastal vegetation), 15 (life on land).
const VEGETATION_RELEVANT_SDG_GOALS = new Set([2, 6, 13, 14, 15]);

// NDVI reference bands (standard USGS/GEE convention): below ~0.1 is bare
// soil, water, or built-up land; 0.1-0.3 sparse vegetation; above 0.3
// moderate-to-dense vegetation.
const BARE_LAND_THRESHOLD = 0.1;

export function validateSatelliteReading({ sdgGoal, ndviValue }: SatelliteValidationInput): SatelliteValidationResult {
  if (ndviValue == null) {
    return { verdict: 'no_data', message: 'No satellite reading available to validate against.' };
  }

  if (sdgGoal == null || !VEGETATION_RELEVANT_SDG_GOALS.has(sdgGoal)) {
    return {
      verdict: 'not_applicable',
      message: 'Vegetation index is not a diagnostic signal for this report\'s SDG goal.',
    };
  }

  if (ndviValue < BARE_LAND_THRESHOLD) {
    return {
      verdict: 'possible_mismatch',
      message: `NDVI of ${ndviValue.toFixed(3)} indicates bare ground, water, or built-up land, which is unusual for a land/vegetation-related SDG ${sdgGoal} claim - worth a closer look.`,
    };
  }

  return {
    verdict: 'consistent',
    message: `NDVI of ${ndviValue.toFixed(3)} shows vegetation presence consistent with a land/vegetation-related SDG ${sdgGoal} claim.`,
  };
}
