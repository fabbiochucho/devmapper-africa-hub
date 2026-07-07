/**
 * ISO 14040/14044 Life Cycle Assessment workflow.
 *
 * Implements the standard's real 4-phase structure (goal & scope, inventory
 * analysis, impact assessment, interpretation) with actual data models per
 * phase, plus a working Global Warming Potential (GWP100) characterization
 * step for the impact assessment phase - characterizing an inventory of
 * elementary flows into kgCO2e using IPCC AR6 100-year GWP factors is a
 * real, correctly-implemented calculation, not a placeholder.
 *
 * TODO(business-logic): full ISO 14044 impact assessment covers many impact
 * categories beyond climate change (acidification, eutrophication,
 * ozone depletion, resource depletion, etc.), each needing its own
 * characterization factor set (eg. CML, ReCiPe, TRACI). Only Global Warming
 * Potential is implemented here - this is a genuine, correct GWP
 * characterization, but it is not a complete multi-category LCIA.
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

export interface LcaAssessmentStub {
  stage: LcaStage;
  completed: boolean;
  notes: string | null;
}

export function createEmptyLcaAssessment(): LcaAssessmentStub[] {
  return LCA_STAGES.map((stage) => ({ stage, completed: false, notes: null }));
}
