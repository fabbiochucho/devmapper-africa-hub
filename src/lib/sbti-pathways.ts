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
 * The **Sectoral Decarbonization Approach (SDA)** convergence formula is
 * also implemented (computeSdaPathway), per the standard SDA structure
 * (SBTi's "Sectoral Decarbonization Approach" report, and the equivalent
 * formulation used by PACTA/r2dii.analysis for financial-sector alignment):
 * a company's target intensity converges *linearly* from its own baseline
 * intensity toward the sector's benchmark convergence intensity, reaching
 * full convergence by the sector's convergence year (SBTi's default: 2050).
 *
 *   I_target(t) = I_company(t0) - [I_company(t0) - I_sector_benchmark] x (t - t0) / (t_convergence - t0)
 *
 * This is the real convergence *shape*; what it can't include is the
 * sector benchmark intensity itself (I_sector_benchmark, above), which
 * comes from SBTi's/IEA's licensed sector decarbonization pathway data
 * (their SDA tool). computeSdaPathway therefore REQUIRES that benchmark as
 * an input parameter rather than embedding a guessed number - the caller
 * (or a future integration with SBTi's tool) must supply it from a real
 * licensed source. Sectors where SBTi requires SDA rather than ACA: power,
 * iron & steel, aluminium, cement, pulp & paper, transport, buildings.
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

export interface SdaPathwayInput {
  baselineYear: number;
  /** Company's own emissions intensity in the baseline year (e.g. tCO2e per tonne of product, or per unit of activity - units must match sectorBenchmarkIntensity). */
  companyBaselineIntensity: number;
  /**
   * The sector's benchmark/convergence intensity, in the same units as
   * companyBaselineIntensity. This is licensed IEA/SBTi sector pathway
   * data (via SBTi's SDA tool) - there is no public default here. The
   * caller must supply a real value from a licensed source.
   */
  sectorBenchmarkIntensity: number;
  /** Projected annual activity (production volume, floor area, tonne-km, etc.) used to convert intensity back to absolute emissions. */
  projectedActivityByYear: Record<number, number>;
  /** SBTi's SDA convergence year default is 2050. */
  convergenceYear?: number;
}

export interface SdaPathwayPoint {
  year: number;
  targetIntensity: number;
  projectedActivity: number;
  targetAbsoluteEmissions: number;
}

export interface SdaPathwayResult {
  points: SdaPathwayPoint[];
  methodology: 'SDA';
  convergenceYear: number;
}

/**
 * Computes an SDA linear intensity-convergence pathway. See module-level
 * docs for the formula and the licensed-data caveat on
 * sectorBenchmarkIntensity.
 */
export function computeSdaPathway(input: SdaPathwayInput): SdaPathwayResult {
  const convergenceYear = input.convergenceYear ?? 2050;
  const years = Object.keys(input.projectedActivityByYear).map(Number).sort((a, b) => a - b);

  const points: SdaPathwayPoint[] = years.map((year) => {
    const progress = convergenceYear === input.baselineYear
      ? 1
      : Math.min(1, Math.max(0, (year - input.baselineYear) / (convergenceYear - input.baselineYear)));
    const targetIntensity = input.companyBaselineIntensity
      - (input.companyBaselineIntensity - input.sectorBenchmarkIntensity) * progress;
    const projectedActivity = input.projectedActivityByYear[year];

    return {
      year,
      targetIntensity,
      projectedActivity,
      targetAbsoluteEmissions: Math.round(targetIntensity * projectedActivity),
    };
  });

  return { points, methodology: 'SDA', convergenceYear };
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
