/**
 * DevMapper SDG Impact Score (SIS) Engine
 * Based on the Standardized SDG Project Verification Framework (SPVF)
 * 
 * SDG-PVS 1000 — Sustainable Development Goal Project Verification Standard
 * 
 * Score = (SDG Alignment × 0.15) + (Evidence Strength × 0.20) + 
 *         (Implementation Integrity × 0.15) + (Output Delivery × 0.15) +
 *         (Outcome Achievement × 0.20) + (Sustainability × 0.10) +
 *         (Community Validation × 0.05)
 * 
 * Maximum score = 100
 */

export type CertificationRating = 'platinum' | 'gold' | 'silver' | 'bronze' | 'unverified';

export interface SISComponents {
  sdgAlignmentScore: number;
  evidenceStrengthScore: number;
  implementationIntegrityScore: number;
  outputDeliveryScore: number;
  outcomeAchievementScore: number;
  sustainabilityScore: number;
  communityValidationScore: number;
}

export interface SISResult {
  components: SISComponents;
  totalSIS: number;
  rating: CertificationRating;
  ratingLabel: string;
  ratingColor: string;
}

export const SIS_WEIGHTS = {
  sdgAlignment: 0.15,
  evidenceStrength: 0.20,
  implementationIntegrity: 0.15,
  outputDelivery: 0.15,
  outcomeAchievement: 0.20,
  sustainability: 0.10,
  communityValidation: 0.05,
} as const;

export const RATING_THRESHOLDS = {
  platinum: 90,
  gold: 80,
  silver: 70,
  bronze: 60,
} as const;

export const RATING_CONFIG: Record<CertificationRating, { label: string; color: string; description: string }> = {
  platinum: { label: 'Platinum Verified', color: 'hsl(var(--primary))', description: 'Fully verified high-impact project with transformational SDG outcomes' },
  gold: { label: 'Gold Verified', color: 'hsl(45, 93%, 47%)', description: 'Verified impact with strong evidence and measurable outcomes' },
  silver: { label: 'Silver Verified', color: 'hsl(0, 0%, 65%)', description: 'Verified outputs with developing outcome data' },
  bronze: { label: 'Bronze Verified', color: 'hsl(30, 60%, 50%)', description: 'Basic compliance verified with initial evidence' },
  unverified: { label: 'Unverified', color: 'hsl(var(--muted-foreground))', description: 'Insufficient evidence for verification' },
};

export const DIMENSION_DESCRIPTIONS = {
  sdgAlignment: {
    label: 'SDG Alignment',
    weight: '15%',
    description: 'Measures alignment with official SDG targets and indicators.',
    factors: ['Clear target linkage', 'Indicator alignment', 'Cross-SDG synergies'],
  },
  evidenceStrength: {
    label: 'Evidence Strength',
    weight: '20%',
    description: 'Quality and quantity of verification evidence.',
    factors: ['Independent audit (high)', 'Government data (medium)', 'Self-reported (low)', 'Minimum 3 evidence forms per claim'],
  },
  implementationIntegrity: {
    label: 'Implementation Integrity',
    weight: '15%',
    description: 'Measures governance quality and execution fidelity.',
    factors: ['Procurement transparency', 'Financial accountability', 'Timely implementation'],
  },
  outputDelivery: {
    label: 'Output Delivery',
    weight: '15%',
    description: 'Ratio of delivered outputs to planned outputs.',
    factors: ['Output Delivery = Outputs Delivered ÷ Planned Outputs'],
  },
  outcomeAchievement: {
    label: 'Outcome Achievement',
    weight: '20%',
    description: 'Improvement relative to baseline measurements.',
    factors: ['Outcome Score = Observed Change ÷ Target Change'],
  },
  sustainability: {
    label: 'Sustainability',
    weight: '10%',
    description: 'Evaluates long-term durability of project benefits.',
    factors: ['Maintenance plan', 'Local ownership', 'Financial sustainability'],
  },
  communityValidation: {
    label: 'Community Validation',
    weight: '5%',
    description: 'Crowd validation via beneficiary feedback.',
    factors: ['Beneficiary feedback', 'Community surveys', 'Public reporting'],
  },
};

export function calculateSIS(components: SISComponents): number {
  return Math.round(
    (components.sdgAlignmentScore * SIS_WEIGHTS.sdgAlignment)
    + (components.evidenceStrengthScore * SIS_WEIGHTS.evidenceStrength)
    + (components.implementationIntegrityScore * SIS_WEIGHTS.implementationIntegrity)
    + (components.outputDeliveryScore * SIS_WEIGHTS.outputDelivery)
    + (components.outcomeAchievementScore * SIS_WEIGHTS.outcomeAchievement)
    + (components.sustainabilityScore * SIS_WEIGHTS.sustainability)
    + (components.communityValidationScore * SIS_WEIGHTS.communityValidation)
  );
}

export function getRating(totalSIS: number): CertificationRating {
  if (totalSIS >= RATING_THRESHOLDS.platinum) return 'platinum';
  if (totalSIS >= RATING_THRESHOLDS.gold) return 'gold';
  if (totalSIS >= RATING_THRESHOLDS.silver) return 'silver';
  if (totalSIS >= RATING_THRESHOLDS.bronze) return 'bronze';
  return 'unverified';
}

export function computeFullSIS(components: SISComponents): SISResult {
  const totalSIS = calculateSIS(components);
  const rating = getRating(totalSIS);
  const config = RATING_CONFIG[rating];
  return {
    components,
    totalSIS,
    rating,
    ratingLabel: config.label,
    ratingColor: config.color,
  };
}

// SPVF 7-Stage Verification Process
export const VERIFICATION_STAGES = [
  {
    key: 'registration',
    label: 'Stage 1: Registration & SDG Mapping',
    shortLabel: 'Registration',
    description: 'Project proponents submit project description, geographic location, stakeholders, target beneficiaries, budget, and implementation partners. Projects must map to SDGs, targets, and indicators.',
    checks: ['Is the mapping accurate?', 'Are targets realistic?', 'Are outcomes plausible?'],
  },
  {
    key: 'baseline',
    label: 'Stage 2: Baseline Verification',
    shortLabel: 'Baseline',
    description: 'Baseline establishes pre-project conditions using surveys, satellite imagery, government statistics, community records, and environmental assessments.',
    checks: ['Independent data review', 'Field verification', 'Community validation'],
  },
  {
    key: 'design',
    label: 'Stage 3: Design Validation',
    shortLabel: 'Design',
    description: 'Project design must demonstrate a credible Theory of Change with evidence-based intervention logic, realistic assumptions, and risk mitigation.',
    checks: ['Is the intervention evidence-based?', 'Are assumptions realistic?', 'Are risks addressed?'],
  },
  {
    key: 'implementation',
    label: 'Stage 4: Implementation Verification',
    shortLabel: 'Implementation',
    description: 'Ensures the project is being implemented as reported through financial verification, activity verification, and evidence review.',
    checks: ['Budget allocation verified', 'Procurement transparency', 'Activity reports reviewed'],
  },
  {
    key: 'output',
    label: 'Stage 5: Output Verification',
    shortLabel: 'Output',
    description: 'Outputs are direct deliverables of the project. Verification requires physical inspection, beneficiary confirmation, and document review.',
    checks: ['Physical inspection', 'Beneficiary confirmation', 'Document review'],
  },
  {
    key: 'outcome',
    label: 'Stage 6: Outcome & Impact Verification',
    shortLabel: 'Outcome',
    description: 'Outcomes measure changes in people\'s lives. Impact should align with official SDG indicators from the UN Global Indicator Framework.',
    checks: ['Household surveys', 'Administrative records', 'Remote sensing / digital monitoring'],
  },
  {
    key: 'impact',
    label: 'Stage 7: Certification & Impact Rating',
    shortLabel: 'Certification',
    description: 'After verification, projects receive an SDG Verification Rating (Platinum/Gold/Silver/Bronze) based on their SDG Impact Score.',
    checks: ['SDG Impact Score calculated', 'Certification rating assigned', 'Certificate issued'],
  },
] as const;

export type VerificationStageKey = typeof VERIFICATION_STAGES[number]['key'];

// Evidence type weights for Evidence Strength scoring
export const EVIDENCE_TYPE_WEIGHTS: Record<string, number> = {
  satellite: 90,
  inspection: 85,
  financial: 80,
  survey: 75,
  document: 60,
  photo: 50,
  testimonial: 40,
};

// SDG-PVS Standard codes
export const SPVF_STANDARDS = [
  { code: 'SDG-PVS 1000', title: 'Core Principles & Verification Framework' },
  { code: 'SDG-PVS 1100', title: 'Project Registration & SDG Alignment' },
  { code: 'SDG-PVS 1200', title: 'Baseline & Needs Assessment' },
  { code: 'SDG-PVS 1300', title: 'Monitoring & Reporting' },
  { code: 'SDG-PVS 1400', title: 'Verification & Auditing' },
  { code: 'SDG-PVS 1500', title: 'Impact Measurement' },
  { code: 'SDG-PVS 1600', title: 'Certification & Rating' },
  { code: 'SDG-PVS 1700', title: 'Digital Verification Protocols' },
];

export const CORE_PRINCIPLES = [
  { name: 'Additionality', description: 'The project must demonstrate that its outcomes would not have occurred without the intervention.' },
  { name: 'Measurability', description: 'Impact must be quantifiable using recognized SDG indicators.' },
  { name: 'Transparency', description: 'All project claims must be traceable to documented evidence.' },
  { name: 'Community Relevance', description: 'Projects must address real local needs.' },
  { name: 'Sustainability', description: 'Benefits should continue beyond project completion.' },
  { name: 'Accountability', description: 'Clear governance and responsibility structures must exist.' },
];
