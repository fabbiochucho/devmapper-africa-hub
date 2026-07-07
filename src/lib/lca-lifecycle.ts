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
 *   Assessment update (ODP2) for comparison. Unlike CML/ReCiPe
 *   acidification/eutrophication factors (which are complex multi-substance
 *   datasets not embedded here with confidence), ODP values are simple,
 *   stable, treaty-referenced constants - genuinely solid ground to
 *   implement directly.
 *
 * TODO(business-logic): full ISO 14044 impact assessment covers further
 * categories (acidification, eutrophication, resource depletion, etc.),
 * each needing its own characterization factor set (eg. CML, ReCiPe,
 * TRACI) that would require sourcing complex per-substance datasets with
 * real confidence - not implemented here to avoid presenting guessed
 * factors as authoritative in a compliance-adjacent tool.
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
  hfc: 1430, // representative value for common refrigerant HFC-134a; actual HFCs vary widely (140-14800) - flag per-substance if precision matters
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

export interface LcaAssessmentStub {
  stage: LcaStage;
  completed: boolean;
  notes: string | null;
}

export function createEmptyLcaAssessment(): LcaAssessmentStub[] {
  return LCA_STAGES.map((stage) => ({ stage, completed: false, notes: null }));
}
