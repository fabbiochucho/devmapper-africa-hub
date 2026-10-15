/**
 * ISO 14040/14044 Life Cycle Assessment workflow.
 *
 * Implements the standard's real 4-phase structure (goal & scope, inventory
 * analysis, impact assessment, interpretation) with two real, working
 * impact-category characterization steps:
 *
 * - Global Warming Potential (GWP100, IPCC AR6) - climate change category.
 * - Ozone Depletion Potential (ODP) - stratospheric ozone depletion
 *   category, using EPA-published values from the Montreal Protocol's
 *   original reference list (ODP1) alongside the WMO 2011 Scientific
 *   Assessment update (ODP2) for comparison.
 * - Acidification Potential (AP) - using US EPA TRACI 2.1 characterization
 *   factors (kg SO2-eq basis), confirmed via multiple independent public
 *   sources for the three major acidifying air emissions: SO2 (the
 *   reference substance, =1.0 by definition), NOx (~0.7), and NH3 (1.88,
 *   directly sourced from EPA's published TRACI 2.1/FEDEFL factor list).
 *
 * - Eutrophication Potential (EP) - CML-IA baseline (Leiden University
 *   CML, after Heijungs et al. 1992) generic factors, kg PO4(3-)-eq. TRACI
 *   2.2's eutrophication factors are spatially resolved, so the
 *   site-independent CML factors are used instead and the result says so.
 *
 * NOT implemented: ozone formation/smog, resource depletion and other
 * categories - left out rather than characterized with guessed factors.
 */

export type LcaStage = 'goal_and_scope' | 'inventory_analysis' | 'impact_assessment' | 'interpretation';

export const LCA_STAGES: LcaStage[] = ['goal_and_scope', 'inventory_analysis', 'impact_assessment', 'interpretation'];

export type SystemBoundary = 'cradle_to_gate' | 'cradle_to_grave' | 'gate_to_gate';

export interface LcaGoalAndScope {
  functionalUnit: string;
  systemBoundary: SystemBoundary;
  completed: boolean;
}

export interface LcaInventoryFlow {
  substance: 'co2' | 'ch4' | 'n2o' | 'hfc' | 'other';
  amountKg: number;
  direction: 'input' | 'output';
  stage: string;
}

/** IPCC AR6 100-year Global Warming Potentials (no climate-carbon feedbacks), the standard basis for corporate GHG characterization. */
const GWP100: Record<LcaInventoryFlow['substance'], number> = {
  co2: 1,
  ch4: 27.9,
  n2o: 273,
  hfc: 1530, // HFC-134a, the most common refrigerant (IPCC AR6 Table 7.SM.7); other HFCs vary widely (~4-14,600) - flag per-substance if precision matters
  other: 0,
};

export interface LcaImpactAssessmentResult {
  totalKgCo2e: number;
  breakdownBySubstance: Record<string, number>;
  note: string;
}

export function characterizeInventory(flows: LcaInventoryFlow[]): LcaImpactAssessmentResult {
  const breakdown: Record<string, number> = {};
  let total = 0;

  for (const flow of flows) {
    const sign = flow.direction === 'output' ? 1 : -1; // outputs (emissions) add, inputs (removals/credits) subtract
    const co2e = sign * flow.amountKg * GWP100[flow.substance];
    breakdown[flow.substance] = (breakdown[flow.substance] ?? 0) + co2e;
    total += co2e;
  }

  return {
    totalKgCo2e: Math.round(total),
    breakdownBySubstance: breakdown,
    note: 'Global Warming Potential (GWP100, IPCC AR6) only - see module-level TODO for other impact categories not covered.',
  };
}

export type OdpSubstance =
  | 'cfc_11' | 'cfc_12' | 'halon_1301' | 'halon_1211'
  | 'hcfc_22' | 'hcfc_141b' | 'carbon_tetrachloride' | 'methyl_chloroform';

export interface OdpInventoryFlow {
  substance: OdpSubstance;
  amountKg: number;
  direction: 'input' | 'output';
  stage: string;
}

/**
 * Ozone Depletion Potential, relative to CFC-11 = 1.0. Montreal Protocol
 * original reference values (source: US EPA "Ozone-Depleting Substances"
 * Class I/II tables, ODP1 column).
 */
const ODP_MONTREAL_PROTOCOL: Record<OdpSubstance, number> = {
  cfc_11: 1,
  cfc_12: 1,
  halon_1301: 10,
  halon_1211: 3,
  carbon_tetrachloride: 1.1,
  methyl_chloroform: 0.1,
  hcfc_22: 0.055,
  hcfc_141b: 0.11,
};

/** WMO 2011 Scientific Assessment update to the same ODP values (US EPA "ODP2" column) - included for comparison since the two references diverge, particularly for halons. */
export const ODP_WMO_2011: Record<OdpSubstance, number> = {
  cfc_11: 1,
  cfc_12: 0.82,
  halon_1301: 15.9,
  halon_1211: 7.9,
  carbon_tetrachloride: 0.82,
  methyl_chloroform: 0.16,
  hcfc_22: 0.04,
  hcfc_141b: 0.12,
};

export interface OdpAssessmentResult {
  totalKgCfc11e: number;
  breakdownBySubstance: Record<string, number>;
  referenceStandard: 'montreal_protocol' | 'wmo_2011';
  note: string;
}

export function characterizeOdpInventory(
  flows: OdpInventoryFlow[],
  referenceStandard: 'montreal_protocol' | 'wmo_2011' = 'montreal_protocol',
): OdpAssessmentResult {
  const factors = referenceStandard === 'wmo_2011' ? ODP_WMO_2011 : ODP_MONTREAL_PROTOCOL;
  const breakdown: Record<string, number> = {};
  let total = 0;

  for (const flow of flows) {
    const sign = flow.direction === 'output' ? 1 : -1;
    const cfc11e = sign * flow.amountKg * factors[flow.substance];
    breakdown[flow.substance] = (breakdown[flow.substance] ?? 0) + cfc11e;
    total += cfc11e;
  }

  return {
    totalKgCfc11e: Math.round(total * 1000) / 1000,
    breakdownBySubstance: breakdown,
    referenceStandard,
    note: `Ozone Depletion Potential relative to CFC-11=1.0, ${referenceStandard === 'wmo_2011' ? 'WMO 2011 Scientific Assessment' : 'Montreal Protocol original reference'} values (source: US EPA Ozone-Depleting Substances tables).`,
  };
}

export type AcidifyingSubstance = 'so2' | 'nox' | 'nh3';

export interface AcidificationInventoryFlow {
  substance: AcidifyingSubstance;
  amountKg: number;
  direction: 'input' | 'output';
  stage: string;
}

/**
 * Acidification Potential, kg SO2-eq basis, US EPA TRACI 2.1
 * characterization factors. SO2 is the reference substance (=1.0 by
 * definition); NOx (~0.7) and NH3 (1.88) are the other two major
 * acidifying air emissions, both confirmed against public TRACI 2.1/FEDEFL
 * sources.
 */
const AP_TRACI_2_1: Record<AcidifyingSubstance, number> = {
  so2: 1,
  nox: 0.7,
  nh3: 1.88,
};

export interface ApAssessmentResult {
  totalKgSo2e: number;
  breakdownBySubstance: Record<string, number>;
  note: string;
}

export function characterizeAcidificationInventory(flows: AcidificationInventoryFlow[]): ApAssessmentResult {
  const breakdown: Record<string, number> = {};
  let total = 0;

  for (const flow of flows) {
    const sign = flow.direction === 'output' ? 1 : -1;
    const so2e = sign * flow.amountKg * AP_TRACI_2_1[flow.substance];
    breakdown[flow.substance] = (breakdown[flow.substance] ?? 0) + so2e;
    total += so2e;
  }

  return {
    totalKgSo2e: Math.round(total * 1000) / 1000,
    breakdownBySubstance: breakdown,
    note: 'Acidification Potential (kg SO2-eq), US EPA TRACI 2.1 characterization factors.',
  };
}

export type EutrophyingSubstance = 'nox' | 'nh3' | 'no3' | 'po4' | 'total_n' | 'total_p' | 'cod';

export interface EutrophicationInventoryFlow {
  substance: EutrophyingSubstance;
  amountKg: number;
  direction: 'input' | 'output';
  stage: string;
}

/**
 * Eutrophication Potential, kg PO4(3-)-eq, CML-IA baseline generic
 * (site-independent) characterization factors. NOx is expressed as NO2;
 * total N and total P are emissions to water; COD is chemical oxygen demand.
 */
const EP_CML_IA: Record<EutrophyingSubstance, number> = {
  nox: 0.13,
  nh3: 0.35,
  no3: 0.1,
  po4: 1,
  total_n: 0.42,
  total_p: 3.06,
  cod: 0.022,
};

export interface EpAssessmentResult {
  totalKgPo4e: number;
  breakdownBySubstance: Record<string, number>;
  note: string;
}

export function characterizeEutrophicationInventory(flows: EutrophicationInventoryFlow[]): EpAssessmentResult {
  const breakdown: Record<string, number> = {};
  let total = 0;

  for (const flow of flows) {
    const sign = flow.direction === 'output' ? 1 : -1;
    const po4e = sign * flow.amountKg * EP_CML_IA[flow.substance];
    breakdown[flow.substance] = (breakdown[flow.substance] ?? 0) + po4e;
    total += po4e;
  }

  return {
    totalKgPo4e: Math.round(total * 1000) / 1000,
    breakdownBySubstance: breakdown,
    note: 'Eutrophication Potential (kg PO4-eq), CML-IA baseline generic factors (not site-specific).',
  };
}

export interface LcaAssessmentStub {
  stage: LcaStage;
  completed: boolean;
  notes: string | null;
}

export function createEmptyLcaAssessment(): LcaAssessmentStub[] {
  return LCA_STAGES.map((stage) => ({ stage, completed: false, notes: null }));
}
