/**
 * Verra VCS (Verified Carbon Standard) methodology registry and eligibility
 * rules.
 *
 * Honesty note on confidence: methodology *codes* (VM00xx) are specific
 * regulatory identifiers - presenting a wrong one with confidence is worse
 * than not having it in a compliance product. Every entry below has been
 * checked against live web search results (Verra's own site and
 * industry-tracker coverage) at the time of writing, not pulled from
 * training-data memory alone - `confidence: 'verified'` means the code and
 * current version number were directly confirmed this way. Verra revises
 * methodology versions and occasionally consolidates/retires codes (eg.
 * VM0050 recently superseded the older VMR0006/VMR0011 cookstove
 * methodologies, with a mandatory cutover by the 2027 vintage year) - always
 * cross-check against Verra's live registry (verra.org/methodologies)
 * before using a code in a real filing, since versions here can drift out
 * of date even though they were correct when checked.
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
    description: 'Afforestation, Reforestation, and Revegetation, v1.1',
    sourceUrl: 'https://verra.org/methodologies/vm0047',
    confidence: 'verified',
  },
  {
    projectType: 'cookstoves',
    methodologyCode: 'VM0050',
    description: 'Energy Efficiency and Fuel-Switch Measures in Cookstoves, v1.0 (supersedes VMR0006/VMR0011 - mandatory for all projects from the 2027 vintage year)',
    sourceUrl: 'https://verra.org/verra-releases-new-cookstoves-methodology/',
    confidence: 'verified',
  },
  {
    projectType: 'renewable_energy',
    methodologyCode: 'VMR0017',
    description: 'Grid-Connected Electricity Generation from Renewable Sources (ACM0002 Revision), v1.0 - covers solar PV, geothermal, onshore/offshore wind',
    sourceUrl: 'https://verra.org/methodologies/vmr0017-grid-connected-electricity-generation-from-renewable-sources-acm0002-revision-v1-0/',
    confidence: 'verified',
  },
  {
    projectType: 'waste_management',
    methodologyCode: 'VM0018',
    description: 'Landfill gas/waste diversion for methane avoidance - not applicable for landfill gas flaring or electricity/energy production (use ACM0001 for those)',
    sourceUrl: 'https://verra.org/methodologies/',
    confidence: 'best_effort',
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
