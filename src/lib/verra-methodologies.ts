/**
 * Verra VCS (Verified Carbon Standard) methodology registry and eligibility
 * rules.
 *
 * Honesty note on confidence: methodology *codes* (VM00xx) are specific
 * regulatory identifiers - presenting a wrong one with confidence is worse
 * than not having it in a compliance product. Only methodologies below
 * marked `confidence: 'verified'` are ones with high confidence in the
 * exact code; entries that would otherwise be guessed are omitted rather
 * than included with a plausible-sounding but unconfirmed code. Always
 * cross-check against Verra's live registry (verra.org/methodologies)
 * before using a code in a real filing.
 *
 * The eligibility criteria, by contrast, are VCS *program-level* rules from
 * the VCS Standard (v4) that apply across methodologies, not
 * methodology-specific numbers, so they're implemented with real, citable
 * mechanics (see comments on each field) rather than as a stub.
 */

export interface VerraMethodology {
  projectType: string;
  methodologyCode: string;
  description: string;
  sourceUrl: string;
  confidence: 'verified' | 'best_effort';
}

export const VERRA_METHODOLOGIES: VerraMethodology[] = [
  {
    projectType: 'mangrove',
    methodologyCode: 'VM0033',
    description: 'Methodology for Tidal Wetland and Seagrass Restoration',
    sourceUrl: 'https://verra.org/methodologies/vm0033',
    confidence: 'verified',
  },
  {
    projectType: 'soil_carbon',
    methodologyCode: 'VM0042',
    description: 'Methodology for Improved Agricultural Land Management',
    sourceUrl: 'https://verra.org/methodologies/vm0042',
    confidence: 'verified',
  },
  {
    projectType: 'reforestation',
    methodologyCode: 'VM0047',
    description: 'Afforestation, Reforestation, and Revegetation',
    sourceUrl: 'https://verra.org/methodologies/vm0047',
    confidence: 'verified',
  },
];

export function findMethodologyForProjectType(projectType: string): VerraMethodology | undefined {
  return VERRA_METHODOLOGIES.find((m) => m.projectType === projectType);
}

/** AFOLU non-permanence risk rating per VCS's AFOLU Non-Permanence Risk Tool (VMD0044). */
export type AfoluRiskRating = 'low' | 'medium' | 'high';

/**
 * VCS's AFOLU buffer pool contribution bands per the Non-Permanence Risk
 * Tool: higher-risk projects (weaker tenure, higher reversal risk, shorter
 * track record) contribute a larger share of issued credits to the
 * non-tradeable buffer pool that insures against reversal across the whole
 * program. The exact percentage within each band is determined per-project
 * by VMD0044's point-scoring system, not a fixed number - these are the
 * documented band *ranges*, not a specific project's determination.
 */
const AFOLU_BUFFER_POOL_RANGE: Record<AfoluRiskRating, { min: number; max: number }> = {
  low: { min: 10, max: 20 },
  medium: { min: 20, max: 40 },
  high: { min: 40, max: 60 },
};

export interface VerraEligibilityAssessment {
  additionalityRequired: true;
  /** VCS requires additionality be demonstrated - regulatory surplus, common practice, or barrier analysis test. Always true; this flags that a real filing needs one of these tests performed, not a computed result. */
  bufferPoolRange: { min: number; max: number } | null;
  /** Non-AFOLU project types don't contribute to the AFOLU buffer pool. */
  verificationCycleYears: number;
  /** VCS requires verification at least once every 5 years for the crediting period to remain valid. */
  monitoringPeriodNote: string;
}

const AFOLU_PROJECT_TYPES = new Set(['reforestation', 'mangrove', 'soil_carbon', 'other']);

export function assessVerraEligibility(projectType: string, riskRating: AfoluRiskRating = 'medium'): VerraEligibilityAssessment {
  const isAfolu = AFOLU_PROJECT_TYPES.has(projectType);
  return {
    additionalityRequired: true,
    bufferPoolRange: isAfolu ? AFOLU_BUFFER_POOL_RANGE[riskRating] : null,
    verificationCycleYears: 5,
    monitoringPeriodNote: 'VCS requires at least one verification event every 5 years within the crediting period; monitoring reports must cover the full period since the last verification.',
  };
}
