/**
 * SBTi (Science Based Targets initiative) pathway scaffolding.
 *
 * TODO(business-logic, unverified): the projection below is a simplified
 * linear-decarbonization approximation, not SBTi's actual sector-specific
 * methodology (SBTi uses sector decarbonization approach / absolute
 * contraction approach models that are meaningfully more complex). Do not
 * present this as an SBTi-validated target without expert review.
 */

export type SbtiTargetType = 'near_term' | 'net_zero' | 'renewable_energy';

export interface SbtiSectorDefinition {
  sector: string;
  label: string;
  description: string;
}

export const SBTI_SECTORS: SbtiSectorDefinition[] = [
  { sector: 'power', label: 'Power', description: 'Electricity generation and distribution' },
  { sector: 'transport', label: 'Transport', description: 'Freight, aviation, shipping, road transport' },
  { sector: 'buildings', label: 'Buildings', description: 'Commercial and residential building operations' },
  { sector: 'industry', label: 'Industry', description: 'Manufacturing, heavy industry, materials' },
  { sector: 'agriculture', label: 'Agriculture, Forestry & Land Use', description: 'AFOLU emissions' },
];

export interface SbtiPathwayInput {
  baselineYear: number;
  targetYear: number;
  baselineEmissions: number;
  targetType: SbtiTargetType;
}

export interface SbtiPathwayPoint {
  year: number;
  emissions: number;
}

/** Simplified linear pathway - see module-level TODO above. */
export function computeSbtiPathway(input: SbtiPathwayInput): SbtiPathwayPoint[] {
  const years = Math.max(1, input.targetYear - input.baselineYear);
  // Near-term/renewable pathways target ~4.2%/yr linear reduction (a common
  // 1.5C-aligned approximation); net-zero targets 100% by the target year.
  const annualReductionRate = input.targetType === 'net_zero' ? 1 / years : 0.042;

  const points: SbtiPathwayPoint[] = [];
  for (let i = 0; i <= years; i++) {
    const year = input.baselineYear + i;
    const remaining = Math.max(0, 1 - annualReductionRate * i);
    points.push({ year, emissions: Math.round(input.baselineEmissions * remaining) });
  }
  return points;
}
