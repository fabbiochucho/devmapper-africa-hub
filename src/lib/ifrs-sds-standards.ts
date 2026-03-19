/**
 * IFRS Sustainability Disclosure Standards (IFRS S1 & S2)
 * Based on ISSB standards effective Jan 1, 2024
 * Nigeria FRC SRG1 2026 compliance mappings
 */

export const IFRS_S1_SECTIONS = [
  {
    id: 'ifrs_s1_governance',
    label: 'Governance',
    standard: 'IFRS S1.26-27',
    description: 'Governance body oversight of sustainability-related risks and opportunities, including board composition, skills, frequency of consideration, and integration into strategy, decision-making, and risk management.',
    disclosures: [
      'Governance body(s) responsible for oversight of sustainability-related risks and opportunities',
      'How responsibilities are reflected in terms of reference, mandates, role descriptions, and policies',
      'Skills and competencies available or to be developed for managing sustainability matters',
      "How and how often the body is informed about sustainability-related risks and opportunities",
      'How the body considers sustainability when overseeing strategy, major transactions, and risk management',
      "Management's role in governance processes, controls, and procedures",
    ],
  },
  {
    id: 'ifrs_s1_strategy',
    label: 'Strategy',
    standard: 'IFRS S1.28-42',
    description: 'Current and anticipated effects of sustainability-related risks and opportunities on business model, value chain, strategy, decision-making, and financial position.',
    disclosures: [
      'Sustainability-related risks and opportunities that could affect prospects (short, medium, long term)',
      'Current and anticipated effects on business model and value chain',
      'Effects on strategy and decision-making',
      'Effects on financial position, financial performance, and cash flows (current period and anticipated)',
      'Climate resilience assessment using scenario analysis',
      'Transition plans and their effects on financial position',
    ],
  },
  {
    id: 'ifrs_s1_risk',
    label: 'Risk Management',
    standard: 'IFRS S1.43-44',
    description: 'Processes to identify, assess, prioritise, and monitor sustainability-related risks and opportunities, and integration with overall risk management.',
    disclosures: [
      'Processes and related policies used to identify, assess, prioritise, and monitor sustainability-related risks and opportunities',
      'Input parameters and assumptions used',
      'Whether and how processes are integrated into overall risk management',
      'Whether and how processes have changed compared to prior period',
    ],
  },
  {
    id: 'ifrs_s1_metrics',
    label: 'Metrics & Targets',
    standard: 'IFRS S1.45-53',
    description: 'Metrics used to measure and monitor sustainability-related risks and opportunities, and progress towards targets.',
    disclosures: [
      'Metrics required by applicable IFRS SDS',
      'Metrics used to measure and monitor sustainability risks and opportunities',
      'Performance metrics for each identified risk and opportunity',
      'Quantitative and qualitative targets, including timeframes',
      'Progress towards each target and analysis of trends',
      'Whether targets are required by law or regulation',
      'Whether targets are informed by scientific evidence',
    ],
  },
];

export const IFRS_S2_SECTIONS = [
  {
    id: 'ifrs_s2_governance',
    label: 'Climate Governance',
    standard: 'IFRS S2.5-6',
    description: 'Governance processes, controls, and procedures for monitoring and managing climate-related risks and opportunities.',
    disclosures: [
      'Board/management oversight of climate-related risks and opportunities',
      'How climate considerations are factored into executive remuneration',
    ],
  },
  {
    id: 'ifrs_s2_strategy',
    label: 'Climate Strategy',
    standard: 'IFRS S2.8-24',
    description: 'Climate-related risks and opportunities, their effects on business model, strategy, and financial planning, and climate resilience.',
    disclosures: [
      'Climate-related risks and opportunities (transition and physical)',
      'Current and anticipated effects on business model and value chain',
      'Effects on strategy and decision-making, including transition plans',
      'Climate resilience assessment using scenario analysis (1.5°C and 2°C scenarios)',
      'Significant areas of uncertainty in the assessment',
    ],
  },
  {
    id: 'ifrs_s2_risk',
    label: 'Climate Risk Management',
    standard: 'IFRS S2.25-27',
    description: 'Processes to identify, assess, prioritise, and monitor climate-related risks and opportunities.',
    disclosures: [
      'Processes for identifying and assessing climate-related risks and opportunities',
      'Processes for managing and monitoring climate-related risks',
      'Integration with overall risk management process',
    ],
  },
  {
    id: 'ifrs_s2_ghg',
    label: 'GHG Emissions (Scope 1, 2, 3)',
    standard: 'IFRS S2.29(a)',
    description: 'Absolute gross GHG emissions disaggregated by scope per GHG Protocol Corporate Standard.',
    disclosures: [
      'Scope 1 GHG emissions (consolidated group vs other investees)',
      'Scope 2 GHG emissions (location-based method, contractual instruments)',
      'Scope 3 GHG emissions by category per GHG Protocol Value Chain Standard',
      'Category 15 (financed emissions) for financial institutions',
      'Measurement approach, inputs, and assumptions',
      'Reason for chosen measurement approach',
    ],
  },
  {
    id: 'ifrs_s2_cross_industry',
    label: 'Cross-Industry Climate Metrics',
    standard: 'IFRS S2.29(b-g)',
    description: 'Standardised cross-industry metrics for climate-related risks and opportunities.',
    disclosures: [
      'Climate-related transition risks — amount and percentage of assets/activities vulnerable',
      'Climate-related physical risks — amount and percentage of assets/activities vulnerable',
      'Climate-related opportunities — amount and percentage of assets/activities aligned',
      'Capital deployment towards climate-related risks and opportunities',
      'Internal carbon price and how it is used in decision-making',
      'Executive remuneration linked to climate-related considerations',
    ],
  },
  {
    id: 'ifrs_s2_targets',
    label: 'Climate Targets & Transition Plans',
    standard: 'IFRS S2.33-36',
    description: 'Climate-related targets, including GHG emission reduction targets, and transition plans.',
    disclosures: [
      'GHG emission reduction targets (absolute or intensity-based)',
      'Whether targets are science-based (e.g., Paris Agreement aligned)',
      'Approach used to set and review targets',
      'Progress against each target and trend analysis',
      'Third-party validation or verification of targets',
      'Transition plan details and compatibility with Paris Agreement',
    ],
  },
];

/** Nigeria FRC SRG1 2026 specific requirements beyond base IFRS S1/S2 */
export const NIGERIA_SRG1_REQUIREMENTS = [
  {
    id: 'srg1_location',
    label: 'Report Location',
    requirement: 'Sustainability disclosures must be after Directors Report but before financial statements (SRG1 §2)',
  },
  {
    id: 'srg1_statement',
    label: 'Statement of Compliance',
    requirement: 'Explicit and unreserved statement of compliance with IFRS SDS required (SRG1 §2, IFRS S1.72)',
  },
  {
    id: 'srg1_industry',
    label: 'Industry Classification',
    requirement: 'Entities must specify SASB industry classification and applicable disclosure topics (SRG1 §7)',
  },
  {
    id: 'srg1_carbon_price',
    label: 'Internal Carbon Price',
    requirement: 'Must disclose internal carbon price per IFRS S2.29(f); if no Nigerian mechanism, use comparable jurisdiction (SRG1 §8-9)',
  },
  {
    id: 'srg1_ghg_calculator',
    label: 'GHG Calculator',
    requirement: 'Recommended use of IPCC/UNFCCC GHG emission calculator with Nigeria emission factor considerations (SRG1 §10)',
  },
  {
    id: 'srg1_business_model',
    label: 'Business Model & Value Chain',
    requirement: 'Entities may disclose business model and value chain immediately after sustainability disclosure policies (SRG1 §11)',
  },
  {
    id: 'srg1_policies',
    label: 'Sustainability Disclosure Policies',
    requirement: 'Must be disclosed at the beginning of sustainability disclosures (SRG1 §12)',
  },
  {
    id: 'srg1_interim',
    label: 'Interim Disclosures',
    requirement: 'Capital market entities must submit interim sustainability disclosures as part of interim financial statements (SRG1 §13)',
  },
  {
    id: 'srg1_icsr',
    label: 'Internal Control Over Sustainability Reporting',
    requirement: 'ICSR required: data ownership, documented methodologies, review/approval, data validation, audit trails (SRG1 §17)',
  },
  {
    id: 'srg1_signing',
    label: 'Professional Signing',
    requirement: 'Must be signed by management team member overseeing sustainability reporting with FRC registration number (SRG1 §15)',
  },
];

/** Transitional reliefs per IFRS S1/S2 and Nigeria FRC Roadmap 2026 */
export const TRANSITIONAL_RELIEFS = [
  {
    id: 'relief_climate_first',
    label: 'Climate-First Reporting',
    description: 'In the first annual reporting period, entities may provide only climate-related disclosures (IFRS S1 transition, FRC Roadmap §9.1)',
  },
  {
    id: 'relief_scope3',
    label: 'Scope 3 GHG Emissions Deferral',
    description: 'First-year relief from disclosing Scope 3 GHG emissions (IFRS S2 transition)',
  },
  {
    id: 'relief_timing',
    label: 'Timing of Reporting',
    description: 'First year: may report sustainability disclosures after financial statements (up to 6 months after year-end in Nigeria)',
  },
  {
    id: 'relief_comparative',
    label: 'Comparative Information',
    description: 'No comparative information required in first year; limited comparative if using climate-first relief in year two',
  },
  {
    id: 'relief_ghg_method',
    label: 'GHG Measurement Method',
    description: 'May continue using non-GHG Protocol method in first year; may extend if aligned significantly with GHG Protocol (Nigeria FRC)',
  },
];
