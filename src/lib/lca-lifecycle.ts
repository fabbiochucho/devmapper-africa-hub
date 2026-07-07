/**
 * ISO 14040/14044 Life Cycle Assessment - Phase 3, scaffold only.
 * No computation implemented yet; defines the shape a future LCA workflow
 * would fill in (goal/scope definition through impact assessment).
 */

export type LcaStage = 'goal_and_scope' | 'inventory_analysis' | 'impact_assessment' | 'interpretation';

export interface LcaAssessmentStub {
  stage: LcaStage;
  completed: boolean;
  notes: string | null;
}

export const LCA_STAGES: LcaStage[] = ['goal_and_scope', 'inventory_analysis', 'impact_assessment', 'interpretation'];

export function createEmptyLcaAssessment(): LcaAssessmentStub[] {
  return LCA_STAGES.map((stage) => ({ stage, completed: false, notes: null }));
}
