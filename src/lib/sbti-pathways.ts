/**
 * SBTi (Science Based Targets initiative) target-setting methodology.
 *
 * Implements the **Absolute Contraction Approach (ACA)** exactly as
 * published in SBTi's "Corporate Near-Term Criteria" and "Foundations of
 * Science-Based Target Setting" (v5, 2021): a cross-sector method requiring
 * a minimum linear year-on-year reduction in absolute Scope 1+2 emissions of
 * 4.2%/year for 1.5°C alignment, or 2.5%/year for well-below-2°C alignment,
 * from the base year to the target year. This is the correct, citable
 * formula for ACA and is implemented faithfully below.
 *
 * NOT implemented: the **Sectoral Decarbonization Approach (SDA)**, SBTi's
 * other near-term method, which converges each company's emissions
 * intensity toward a sector-specific 1.5°C pathway. SDA requires SBTi's/
 * IEA's licensed sector decarbonization datasets (via SBTi's own SDA tool)
 * - there is no public formula to embed here, and this environment has no
 * access to that dataset. Do not represent computeSbtiPathway's output as
 * SDA-equivalent for sectors where SBTi requires SDA (power, iron & steel,
 * aluminium, cement, pulp & paper, transport, buildings).
 *
 * TODO(business-logic): the long-term net-zero pathway below (≥90%
 * reduction, ≤10% residual by the target year) is per SBTi's Corporate
 * Net-Zero Standard's baseline requirement, but the *exact* interim
 * milestone shape (linear vs. front-loaded) is a company-specific choice
 * SBTi does not fully prescribe - treat the interim points as one
 * reasonable linear path, not the only valid one.
 */

export type SbtiTargetType = 'near_term' | 'net_zero' | 'renewable_energy';
export type SbtiTemperatureScenario = '1.5C' | 'well_below_2C';

export interface SbtiSectorDefinition {
  sector: string;
  label: string;
  description: string;
  /** True if SBTi requires the Sectoral Decarbonization Approach for this sector (not implemented here - see module docs). */
  requiresSda: boolean;
}

export const SBTI_SECTORS: SbtiSectorDefinition[] = [
  { sector: 'power', label: 'Power', description: 'Electricity generation and distribution', requiresSda: true },
  { sector: 'transport', label: 'Transport', description: 'Freight, aviation, shipping, road transport', requiresSda: true },
  { sector: 'buildings', label: 'Buildings', description: 'Commercial and residential building operations', requiresSda: true },
  { sector: 'industry', label: 'Industry (general)', description: 'Manufacturing not covered by a dedicated SDA pathway', requiresSda: false },
  { sector: 'iron_steel', label: 'Iron & Steel', description: 'Iron and steel production', requiresSda: true },
  { sector: 'aluminium', label: 'Aluminium', description: 'Aluminium production', requiresSda: true },
  { sector: 'cement', label: 'Cement', description: 'Cement production', requiresSda: true },
  { sector: 'pulp_paper', label: 'Pulp & Paper', description: 'Pulp and paper production', requiresSda: true },
  { sector: 'agriculture', label: 'Agriculture, Forestry & Land Use', description: 'AFOLU emissions (FLAG guidance applies)', requiresSda: false },
];

/** Minimum linear annual reduction rate per SBTi's Absolute Contraction Approach. */
const ACA_ANNUAL_RATE: Record<SbtiTemperatureScenario, number> = {
  '1.5C': 0.042,
  well_below_2C: 0.025,
};

export interface SbtiPathwayInput {
  baselineYear: number;
  targetYear: number;
  baselineEmissions: number;
  targetType: SbtiTargetType;
  /** Only used for targetType === 'near_term'; ignored (net-zero always targets ~100% by target year) otherwise. */
  temperatureScenario?: SbtiTemperatureScenario;
}

export interface SbtiPathwayPoint {
  year: number;
  emissions: number;
  /** Emissions as a fraction of baseline (1 = no reduction yet, 0 = fully decarbonized). */
  fractionOfBaseline: number;
}

export interface SbtiPathwayResult {
  points: SbtiPathwayPoint[];
  annualReductionRate: number;
  methodology: 'ACA';
  /** SBTi's near-term criteria require target horizons of 5-10 years from the submission date - flagged, not enforced, since baseline/submission dates can differ. */
  withinRecommendedHorizon: boolean;
}

/**
 * Computes an Absolute Contraction Approach pathway. For near_term targets,
 * uses the published 4.2%/yr (1.5°C) or 2.5%/yr (well-below-2°C) linear
 * reduction rate. For net_zero targets, computes the linear rate needed to
 * reach ~90% reduction (10% residual) by the target year, per SBTi's
 * Corporate Net-Zero Standard floor. renewable_energy targets are a
 * procurement commitment (% renewable electricity), not an emissions
 * trajectory - see computeRenewableEnergyTarget below instead.
 */
export function computeSbtiPathway(input: SbtiPathwayInput): SbtiPathwayResult {
  const years = Math.max(1, input.targetYear - input.baselineYear);

  const annualReductionRate = input.targetType === 'net_zero'
    ? 0.9 / years // reach 90% cumulative reduction (10% residual) by the target year
    : ACA_ANNUAL_RATE[input.temperatureScenario ?? '1.5C'];

  const points: SbtiPathwayPoint[] = [];
  for (let i = 0; i <= years; i++) {
    const year = input.baselineYear + i;
    const fractionOfBaseline = Math.max(0, 1 - annualReductionRate * i);
    points.push({
      year,
      emissions: Math.round(input.baselineEmissions * fractionOfBaseline),
      fractionOfBaseline,
    });
  }

  return {
    points,
    annualReductionRate,
    methodology: 'ACA',
    withinRecommendedHorizon: years >= 5 && years <= 10,
  };
}

export interface RenewableEnergyTargetResult {
  targetYear: number;
  targetPercent: number;
  note: string;
}

/**
 * SBTi renewable electricity target guidance: companies are encouraged to
 * source 100% renewable electricity by 2030 as a complement to (not a
 * substitute for) an emissions-reduction target.
 */
export function computeRenewableEnergyTarget(currentPercent: number): RenewableEnergyTargetResult {
  return {
    targetYear: 2030,
    targetPercent: 100,
    note: currentPercent >= 100
      ? 'Renewable electricity target already met.'
      : `${(100 - currentPercent).toFixed(0)} percentage points of renewable electricity procurement needed by 2030.`,
  };
}
