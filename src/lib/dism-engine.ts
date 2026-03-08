/**
 * DevMapper SDG Impact Scoring Model (DISM)
 * 
 * A comprehensive 8-dimension scoring model that quantifies project
 * contributions to the Sustainable Development Goals.
 * 
 * Total Impact Score = 100 points across 8 dimensions:
 *   SDG Alignment (15) + Impact Scale (15) + Impact Depth (15) +
 *   Outcome Effectiveness (15) + Sustainability (10) +
 *   Evidence & Verification (10) + Governance & Ethics (10) +
 *   Innovation & Replicability (10)
 * 
 * Rating System (AAA–D):
 *   AAA (90-100) → Transformational global impact
 *   AA  (75-89)  → Exceptional high impact
 *   A   (60-74)  → Strong verified impact
 *   BBB (50-59)  → Solid impact
 *   BB  (40-49)  → Moderate impact
 *   B   (30-39)  → Emerging impact
 *   CCC (20-29)  → Low impact
 *   CC  (10-19)  → Weak impact
 *   C   (1-9)    → Minimal impact
 *   D   (0)      → No verified impact
 */

// ─── Types ───────────────────────────────────────────────────────────

export type DISMRating = 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' | 'CC' | 'C' | 'D';

export interface DISMDimensions {
  sdgAlignment: number;       // 0-15
  impactScale: number;        // 0-15
  impactDepth: number;        // 0-15
  outcomeEffectiveness: number; // 0-15
  sustainability: number;     // 0-10
  evidenceVerification: number; // 0-10
  governanceEthics: number;   // 0-10
  innovationReplicability: number; // 0-10
}

export interface DISMResult {
  dimensions: DISMDimensions;
  totalScore: number;
  rating: DISMRating;
  ratingLabel: string;
  ratingColor: string;
  impactCategory: string;
}

export interface SDGContribution {
  sdg: number;
  contribution: number; // percentage
}

// ─── Constants ───────────────────────────────────────────────────────

export const DISM_DIMENSIONS = {
  sdgAlignment: { label: 'SDG Alignment', maxScore: 15, weight: 0.15 },
  impactScale: { label: 'Impact Scale', maxScore: 15, weight: 0.15 },
  impactDepth: { label: 'Impact Depth', maxScore: 15, weight: 0.15 },
  outcomeEffectiveness: { label: 'Outcome Effectiveness', maxScore: 15, weight: 0.15 },
  sustainability: { label: 'Sustainability', maxScore: 10, weight: 0.10 },
  evidenceVerification: { label: 'Evidence & Verification', maxScore: 10, weight: 0.10 },
  governanceEthics: { label: 'Governance & Ethics', maxScore: 10, weight: 0.10 },
  innovationReplicability: { label: 'Innovation & Replicability', maxScore: 10, weight: 0.10 },
} as const;

export const DISM_DIMENSION_DETAILS: Record<keyof DISMDimensions, {
  label: string;
  maxScore: number;
  description: string;
  scoringLevels: { score: number; description: string }[];
  subCriteria?: { name: string; maxPoints: number }[];
}> = {
  sdgAlignment: {
    label: 'SDG Alignment',
    maxScore: 15,
    description: 'Measures how well the project contributes to specific SDGs and targets.',
    scoringLevels: [
      { score: 0, description: 'No SDG linkage' },
      { score: 3, description: 'General SDG reference' },
      { score: 6, description: 'Specific SDG identified' },
      { score: 9, description: 'SDG target identified' },
      { score: 12, description: 'Indicators aligned with SDG metrics' },
      { score: 15, description: 'Fully integrated SDG monitoring system' },
    ],
  },
  impactScale: {
    label: 'Impact Scale',
    maxScore: 15,
    description: 'Measures how many people or systems benefit from the project.',
    scoringLevels: [
      { score: 2, description: 'Less than 100 beneficiaries' },
      { score: 5, description: '100–1,000 beneficiaries' },
      { score: 8, description: '1,000–10,000 beneficiaries' },
      { score: 11, description: '10,000–100,000 beneficiaries' },
      { score: 13, description: '100,000–1 million beneficiaries' },
      { score: 15, description: 'Over 1 million beneficiaries' },
    ],
  },
  impactDepth: {
    label: 'Impact Depth',
    maxScore: 15,
    description: 'Measures how transformative the change is.',
    scoringLevels: [
      { score: 3, description: 'Awareness only' },
      { score: 6, description: 'Capacity building' },
      { score: 9, description: 'Service delivery' },
      { score: 12, description: 'Structural improvement' },
      { score: 15, description: 'System transformation' },
    ],
  },
  outcomeEffectiveness: {
    label: 'Outcome Effectiveness',
    maxScore: 15,
    description: 'Measures achievement of intended outcomes.',
    scoringLevels: [
      { score: 0, description: 'No evidence of outcomes' },
      { score: 5, description: 'Outputs only' },
      { score: 8, description: 'Partial outcomes achieved' },
      { score: 12, description: 'Strong outcomes demonstrated' },
      { score: 15, description: 'Outcomes plus systemic change' },
    ],
  },
  sustainability: {
    label: 'Sustainability',
    maxScore: 10,
    description: 'Measures long-term viability of project benefits.',
    scoringLevels: [],
    subCriteria: [
      { name: 'Financial sustainability', maxPoints: 3 },
      { name: 'Institutional ownership', maxPoints: 2 },
      { name: 'Community participation', maxPoints: 2 },
      { name: 'Environmental sustainability', maxPoints: 2 },
      { name: 'Exit strategy', maxPoints: 1 },
    ],
  },
  evidenceVerification: {
    label: 'Evidence & Verification',
    maxScore: 10,
    description: 'Measures credibility of impact claims.',
    scoringLevels: [
      { score: 2, description: 'Self-reported only' },
      { score: 4, description: 'Internal monitoring data' },
      { score: 7, description: 'Third-party evaluation' },
      { score: 10, description: 'Independent impact audit' },
    ],
  },
  governanceEthics: {
    label: 'Governance & Ethics',
    maxScore: 10,
    description: 'Evaluates transparency and accountability.',
    scoringLevels: [],
    subCriteria: [
      { name: 'Transparent budgeting', maxPoints: 2 },
      { name: 'Safeguards & ethics policies', maxPoints: 2 },
      { name: 'Community participation', maxPoints: 2 },
      { name: 'Gender inclusion', maxPoints: 2 },
      { name: 'Anti-corruption mechanisms', maxPoints: 2 },
    ],
  },
  innovationReplicability: {
    label: 'Innovation & Replicability',
    maxScore: 10,
    description: 'Measures whether the project introduces scalable new approaches.',
    scoringLevels: [
      { score: 2, description: 'Standard program' },
      { score: 5, description: 'Improved model' },
      { score: 7, description: 'Innovative solution' },
      { score: 10, description: 'Highly scalable model' },
    ],
  },
};

export const DISM_RATING_CONFIG: Record<DISMRating, {
  label: string;
  color: string;
  category: string;
  minScore: number;
}> = {
  AAA: { label: 'AAA — Transformational', color: 'hsl(142, 76%, 36%)', category: 'Transformational impact', minScore: 90 },
  AA:  { label: 'AA — Exceptional', color: 'hsl(142, 60%, 45%)', category: 'Exceptional high impact', minScore: 75 },
  A:   { label: 'A — Strong', color: 'hsl(80, 60%, 45%)', category: 'Strong verified impact', minScore: 60 },
  BBB: { label: 'BBB — Solid', color: 'hsl(45, 93%, 47%)', category: 'Solid impact', minScore: 50 },
  BB:  { label: 'BB — Moderate', color: 'hsl(35, 80%, 50%)', category: 'Moderate impact', minScore: 40 },
  B:   { label: 'B — Emerging', color: 'hsl(25, 80%, 50%)', category: 'Emerging impact', minScore: 30 },
  CCC: { label: 'CCC — Low', color: 'hsl(15, 70%, 50%)', category: 'Low impact', minScore: 20 },
  CC:  { label: 'CC — Weak', color: 'hsl(0, 60%, 50%)', category: 'Weak impact', minScore: 10 },
  C:   { label: 'C — Minimal', color: 'hsl(0, 70%, 40%)', category: 'Minimal impact', minScore: 1 },
  D:   { label: 'D — None', color: 'hsl(var(--muted-foreground))', category: 'No verified impact', minScore: 0 },
};

export const IMPACT_CATEGORIES = [
  { range: '81–100', label: 'Transformational impact', color: 'hsl(142, 76%, 36%)' },
  { range: '61–80', label: 'High impact', color: 'hsl(80, 60%, 45%)' },
  { range: '41–60', label: 'Moderate impact', color: 'hsl(45, 93%, 47%)' },
  { range: '21–40', label: 'Emerging impact', color: 'hsl(25, 80%, 50%)' },
  { range: '0–20', label: 'Minimal impact', color: 'hsl(0, 60%, 50%)' },
];

// ─── Verification Levels ─────────────────────────────────────────────

export const VERIFICATION_LEVELS = [
  { level: 1, label: 'Self Reported', description: 'Project team reports progress with photos, reports, and indicators.', badge: 'Self Reported' },
  { level: 2, label: 'Document Verified', description: 'DevMapper verifies financial reports, project reports, and monitoring data.', badge: 'Document Verified' },
  { level: 3, label: 'Third-Party Verified', description: 'External verification from consulting firms, universities, NGOs, or auditors.', badge: 'Third-Party Verified' },
  { level: 4, label: 'Impact Audited', description: 'Independent impact evaluation via randomized evaluation, satellite monitoring, or beneficiary surveys.', badge: 'Impact Audited' },
];

// ─── Calculation Functions ───────────────────────────────────────────

export function calculateDISM(dimensions: DISMDimensions): number {
  const total =
    dimensions.sdgAlignment +
    dimensions.impactScale +
    dimensions.impactDepth +
    dimensions.outcomeEffectiveness +
    dimensions.sustainability +
    dimensions.evidenceVerification +
    dimensions.governanceEthics +
    dimensions.innovationReplicability;
  return Math.min(100, Math.max(0, Math.round(total)));
}

export function getDISMRating(score: number): DISMRating {
  if (score >= 90) return 'AAA';
  if (score >= 75) return 'AA';
  if (score >= 60) return 'A';
  if (score >= 50) return 'BBB';
  if (score >= 40) return 'BB';
  if (score >= 30) return 'B';
  if (score >= 20) return 'CCC';
  if (score >= 10) return 'CC';
  if (score >= 1) return 'C';
  return 'D';
}

export function getImpactCategory(score: number): string {
  if (score >= 81) return 'Transformational impact';
  if (score >= 61) return 'High impact';
  if (score >= 41) return 'Moderate impact';
  if (score >= 21) return 'Emerging impact';
  return 'Minimal impact';
}

export function computeFullDISM(dimensions: DISMDimensions): DISMResult {
  const totalScore = calculateDISM(dimensions);
  const rating = getDISMRating(totalScore);
  const config = DISM_RATING_CONFIG[rating];
  return {
    dimensions,
    totalScore,
    rating,
    ratingLabel: config.label,
    ratingColor: config.color,
    impactCategory: getImpactCategory(totalScore),
  };
}

/**
 * Calculate the final composite rating that blends DISM Impact Score
 * with verification level and evidence quality.
 * 
 * Final Rating Score = (Impact Score × 0.5) + (Verification Score × 0.3) + (Evidence Score × 0.2)
 */
export function calculateCompositeRating(
  impactScore: number,
  verificationLevel: number, // 1-4
  evidenceQuality: number   // 0-100
): { score: number; rating: DISMRating } {
  const verificationScore = (verificationLevel / 4) * 100;
  const compositeScore = Math.round(
    (impactScore * 0.5) + (verificationScore * 0.3) + (evidenceQuality * 0.2)
  );
  return { score: compositeScore, rating: getDISMRating(compositeScore) };
}

// ─── DSPM 7-Phase Lifecycle ──────────────────────────────────────────

export const DSPM_PHASES = [
  {
    phase: 1,
    title: 'Problem Definition & Context Analysis',
    purpose: 'Identify the development challenge.',
    activities: ['Needs assessment', 'Development gap analysis', 'Baseline data collection', 'Stakeholder consultation', 'Context mapping'],
    tools: ['Problem Tree Analysis', 'Community Needs Assessment', 'Stakeholder Mapping', 'Baseline Surveys'],
    outputs: ['Problem Statement', 'Development Context Analysis', 'Baseline Indicators'],
    icon: 'Search',
  },
  {
    phase: 2,
    title: 'SDG Alignment & Theory of Change',
    purpose: 'Connect the project to SDGs and development outcomes.',
    activities: ['SDG target mapping', 'Theory of Change development', 'Impact pathway modeling', 'Define outcomes and impacts'],
    tools: ['SDG Target Mapping', 'Impact Pathway Model', 'Logical Framework (LogFrame)'],
    outputs: ['SDG Alignment Matrix', 'Theory of Change Diagram', 'Results Framework'],
    icon: 'Target',
  },
  {
    phase: 3,
    title: 'Strategic Project Planning',
    purpose: 'Create a fully structured project plan.',
    activities: ['Define objectives & deliverables', 'Activity planning', 'Timeline development', 'Budget planning', 'Risk management'],
    tools: ['Work Breakdown Structure (WBS)', 'Gantt Chart', 'Budget Planning', 'Risk Matrix'],
    outputs: ['SDG Project Charter', 'Implementation Plan', 'Budget & Resource Plan'],
    icon: 'ClipboardList',
  },
  {
    phase: 4,
    title: 'Partnership & Financing Strategy',
    purpose: 'Mobilize financial and institutional support.',
    activities: ['Funding source identification', 'Partnership mapping', 'Stakeholder engagement planning', 'Governance structuring'],
    tools: ['Partnership Mapping', 'Financing Strategy', 'Stakeholder Engagement Plan'],
    outputs: ['Financing Model', 'Partnership Agreements', 'Governance Structure'],
    icon: 'Handshake',
  },
  {
    phase: 5,
    title: 'Implementation & Adaptive Management',
    purpose: 'Deliver project activities effectively.',
    activities: ['Activity execution', 'Resource management', 'Stakeholder engagement', 'Adaptive decision-making'],
    tools: ['Project Dashboards', 'Field Monitoring', 'Performance Reviews'],
    outputs: ['Implementation Reports', 'Activity Completion Documentation'],
    icon: 'Rocket',
  },
  {
    phase: 6,
    title: 'Monitoring, Evaluation & Learning (MEL)',
    purpose: 'Track progress and improve performance.',
    activities: ['Output tracking', 'Outcome assessment', 'Lesson capture', 'Best practice documentation'],
    tools: ['Key Performance Indicators', 'Impact Measurement Frameworks', 'Surveys & Field Assessments'],
    outputs: ['Monitoring Reports', 'Mid-term Evaluation', 'Impact Assessment'],
    icon: 'BarChart3',
  },
  {
    phase: 7,
    title: 'Impact Verification & SDG Reporting',
    purpose: 'Validate and communicate development impact.',
    activities: ['Independent verification', 'Impact reporting', 'Public disclosure', 'Case study development'],
    tools: ['SDG Reporting Framework', 'ESG Metrics Alignment', 'Impact Scorecards'],
    outputs: ['Verified Impact Report', 'SDG Contribution Statement', 'Public Impact Dashboard'],
    icon: 'Award',
  },
] as const;

// ─── DSPM Competency Framework (IPMA-inspired) ──────────────────────

export const DSPM_COMPETENCIES = {
  leadership: {
    label: 'Leadership Competencies',
    items: ['Ethical leadership', 'Vision and strategy', 'Stakeholder engagement', 'Change management'],
  },
  technical: {
    label: 'Technical Competencies',
    items: ['Project planning', 'Monitoring and evaluation', 'Data analysis', 'Risk management'],
  },
  sustainability: {
    label: 'Sustainability Competencies',
    items: ['Systems thinking', 'Environmental sustainability', 'Social inclusion', 'Governance and transparency'],
  },
  perspective: {
    label: 'Perspective Competencies (IPMA)',
    items: ['Sustainability systems thinking', 'Governance and compliance', 'Power and stakeholder dynamics', 'Culture and values'],
  },
  people: {
    label: 'People Competencies (IPMA)',
    items: ['Leadership', 'Communication', 'Conflict resolution', 'Negotiation', 'Teamwork'],
  },
  practice: {
    label: 'Practice Competencies (IPMA)',
    items: ['Project planning', 'Risk management', 'Quality assurance', 'Monitoring and evaluation'],
  },
};

// ─── Impact Measurement Model (4 levels) ─────────────────────────────

export const IMPACT_MEASUREMENT_LEVELS = [
  { level: 'Inputs', description: 'Resources invested', examples: ['Funding', 'Personnel', 'Technology'] },
  { level: 'Outputs', description: 'Direct deliverables', examples: ['Schools built', 'Farmers trained', 'Solar units installed'] },
  { level: 'Outcomes', description: 'Short to medium-term change', examples: ['Increased school attendance', 'Higher crop yields'] },
  { level: 'Impact', description: 'Long-term development transformation', examples: ['Reduced poverty', 'Improved public health'] },
];

// ─── Global Framework Alignment ──────────────────────────────────────

export const FRAMEWORK_ALIGNMENTS = [
  { name: 'UN SDG Global Indicator Framework', description: '231+ global indicators across 17 SDGs' },
  { name: 'OECD DAC Evaluation Criteria', description: 'Relevance, effectiveness, efficiency, impact, sustainability' },
  { name: 'Impact Management Project (IMP)', description: 'Shared norms for impact classification' },
  { name: 'IRIS+ Metrics', description: 'Impact measurement standards for investors' },
  { name: 'Global Reporting Initiative (GRI)', description: 'Sustainability reporting standards' },
  { name: 'PMI PMBOK Guide', description: 'Project management processes and knowledge areas' },
  { name: 'IPMA ICB4', description: 'Competency-based project leadership standards' },
  { name: 'World Bank IEG', description: 'Development project evaluation frameworks' },
  { name: 'IFC Impact Principles', description: 'Operating principles for impact management' },
  { name: 'SASB Standards', description: 'Sector-specific sustainability accounting metrics' },
];
