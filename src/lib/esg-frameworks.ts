/**
 * ESG Reporting Frameworks Registry
 * Comprehensive framework definitions for gap analysis and compliance tracking
 */

export interface Framework {
  id: string;
  name: string;
  shortName: string;
  description: string;
  jurisdiction: string;
  mandatory: boolean;
  website: string;
  categories: FrameworkCategory[];
}

export interface FrameworkCategory {
  name: string;
  requirements: string[];
}

export const ESG_FRAMEWORKS: Framework[] = [
  {
    id: 'gri',
    name: 'Global Reporting Initiative',
    shortName: 'GRI',
    description: 'Universal sustainability reporting standard used worldwide. GRI Standards help organizations report their impacts on the economy, environment and society.',
    jurisdiction: 'Global',
    mandatory: false,
    website: 'https://www.globalreporting.org',
    categories: [
      { name: 'Universal Standards', requirements: ['Foundation (GRI 1)', 'General Disclosures (GRI 2)', 'Material Topics (GRI 3)'] },
      { name: 'Economic', requirements: ['Economic Performance (201)', 'Market Presence (202)', 'Indirect Economic Impacts (203)', 'Procurement Practices (204)', 'Anti-corruption (205)', 'Anti-competitive Behavior (206)'] },
      { name: 'Environmental', requirements: ['Materials (301)', 'Energy (302)', 'Water and Effluents (303)', 'Biodiversity (304)', 'Emissions (305)', 'Waste (306)'] },
      { name: 'Social', requirements: ['Employment (401)', 'Labor/Management Relations (402)', 'Occupational Health and Safety (403)', 'Training and Education (404)', 'Diversity and Equal Opportunity (405)', 'Non-discrimination (406)', 'Child Labor (408)', 'Forced Labor (409)', 'Local Communities (413)', 'Customer Privacy (418)'] },
    ],
  },
  {
    id: 'cdp',
    name: 'Carbon Disclosure Project',
    shortName: 'CDP',
    description: 'Global environmental disclosure system. Companies disclose climate change, water security, and deforestation data through CDP questionnaires.',
    jurisdiction: 'Global',
    mandatory: false,
    website: 'https://www.cdp.net',
    categories: [
      { name: 'Governance', requirements: ['Board oversight of climate issues', 'Management responsibility', 'Incentives for climate targets'] },
      { name: 'Risks & Opportunities', requirements: ['Physical climate risks', 'Transition risks', 'Climate-related opportunities', 'Financial impact assessment'] },
      { name: 'Emissions', requirements: ['Scope 1 emissions', 'Scope 2 emissions', 'Scope 3 emissions (all 15 categories)', 'Emissions methodology', 'Verification/assurance'] },
      { name: 'Targets', requirements: ['Emissions reduction targets', 'Net-zero commitment', 'Science-based target status', 'Progress against targets'] },
    ],
  },
  {
    id: 'ifrs-s1',
    name: 'IFRS Sustainability Disclosure Standard S1',
    shortName: 'IFRS S1',
    description: 'General requirements for disclosure of sustainability-related financial information, issued by the ISSB.',
    jurisdiction: 'Global',
    mandatory: true,
    website: 'https://www.ifrs.org/issued-standards/ifrs-sustainability-standards-navigator/ifrs-s1-general-requirements/',
    categories: [
      { name: 'Governance', requirements: ['Governance body oversight', 'Management role in sustainability', 'Skills and competencies'] },
      { name: 'Strategy', requirements: ['Sustainability risks and opportunities', 'Business model impacts', 'Strategy resilience', 'Financial position effects'] },
      { name: 'Risk Management', requirements: ['Risk identification process', 'Risk assessment process', 'Risk management process', 'Integration with overall risk management'] },
      { name: 'Metrics & Targets', requirements: ['Industry-based metrics', 'Sustainability-related targets', 'Performance against targets'] },
    ],
  },
  {
    id: 'ifrs-s2',
    name: 'IFRS Climate-related Disclosures S2',
    shortName: 'IFRS S2',
    description: 'Climate-specific disclosure requirements building on TCFD recommendations, issued by the ISSB.',
    jurisdiction: 'Global',
    mandatory: true,
    website: 'https://www.ifrs.org/issued-standards/ifrs-sustainability-standards-navigator/ifrs-s2-climate-related-disclosures/',
    categories: [
      { name: 'Governance', requirements: ['Climate governance processes', 'Board competencies on climate'] },
      { name: 'Strategy', requirements: ['Climate-related risks and opportunities', 'Transition plan', 'Climate resilience assessment', 'Scenario analysis'] },
      { name: 'GHG Emissions', requirements: ['Scope 1 GHG emissions', 'Scope 2 GHG emissions', 'Scope 3 GHG emissions', 'GHG Protocol methodology'] },
      { name: 'Targets', requirements: ['Climate-related targets', 'Net-zero targets', 'Carbon offset usage disclosure'] },
    ],
  },
  {
    id: 'csrd',
    name: 'Corporate Sustainability Reporting Directive',
    shortName: 'EU CSRD',
    description: 'EU directive requiring comprehensive sustainability reporting aligned with European Sustainability Reporting Standards (ESRS).',
    jurisdiction: 'European Union',
    mandatory: true,
    website: 'https://finance.ec.europa.eu/capital-markets-union-and-financial-markets/company-reporting-and-auditing/company-reporting/corporate-sustainability-reporting_en',
    categories: [
      { name: 'Cross-cutting (ESRS 1 & 2)', requirements: ['Double materiality assessment', 'Value chain boundaries', 'Governance disclosures', 'Strategy and business model'] },
      { name: 'Environment (ESRS E1-E5)', requirements: ['Climate change (E1)', 'Pollution (E2)', 'Water and marine resources (E3)', 'Biodiversity and ecosystems (E4)', 'Resource use and circular economy (E5)'] },
      { name: 'Social (ESRS S1-S4)', requirements: ['Own workforce (S1)', 'Workers in value chain (S2)', 'Affected communities (S3)', 'Consumers and end-users (S4)'] },
      { name: 'Governance (ESRS G1)', requirements: ['Business conduct', 'Anti-corruption and bribery', 'Political engagement', 'Supplier payment practices'] },
    ],
  },
  {
    id: 'tcfd',
    name: 'Task Force on Climate-related Financial Disclosures',
    shortName: 'TCFD',
    description: 'Framework for climate-related financial risk disclosure. Now incorporated into IFRS S2 but still widely referenced.',
    jurisdiction: 'Global',
    mandatory: false,
    website: 'https://www.fsb-tcfd.org',
    categories: [
      { name: 'Governance', requirements: ['Board oversight of climate risks', 'Management role in climate assessment'] },
      { name: 'Strategy', requirements: ['Climate risks and opportunities identified', 'Impact on business strategy', 'Scenario analysis (2°C or lower)'] },
      { name: 'Risk Management', requirements: ['Processes for identifying climate risks', 'Processes for managing climate risks', 'Integration with overall risk management'] },
      { name: 'Metrics & Targets', requirements: ['GHG emissions (Scope 1, 2, 3)', 'Climate-related targets', 'Performance metrics'] },
    ],
  },
  {
    id: 'sasb',
    name: 'Sustainability Accounting Standards Board',
    shortName: 'SASB',
    description: 'Industry-specific sustainability disclosure standards focused on financially material ESG factors. Now part of IFRS Foundation.',
    jurisdiction: 'Global',
    mandatory: false,
    website: 'https://sasb.org',
    categories: [
      { name: 'Environment', requirements: ['GHG emissions', 'Energy management', 'Water management', 'Waste management', 'Ecological impacts'] },
      { name: 'Social Capital', requirements: ['Human rights', 'Community relations', 'Customer welfare', 'Data security', 'Access and affordability'] },
      { name: 'Human Capital', requirements: ['Labor practices', 'Employee health and safety', 'Employee engagement', 'Diversity and inclusion'] },
      { name: 'Business Model', requirements: ['Product design and lifecycle', 'Business model resilience', 'Supply chain management', 'Materials sourcing'] },
      { name: 'Leadership & Governance', requirements: ['Business ethics', 'Competitive behavior', 'Regulatory capture', 'Critical incident management', 'Systemic risk management'] },
    ],
  },
  {
    id: 'sbti',
    name: 'Science Based Targets initiative',
    shortName: 'SBTi',
    description: 'Defines and promotes best practice in emissions reductions and net-zero targets in line with climate science.',
    jurisdiction: 'Global',
    mandatory: false,
    website: 'https://sciencebasedtargets.org',
    categories: [
      { name: 'Near-term Targets', requirements: ['Scope 1+2 target (1.5°C aligned)', 'Scope 3 target (well-below 2°C)', 'Target boundary (≥95% Scope 1+2)', 'Target timeframe (5-10 years)'] },
      { name: 'Long-term/Net-zero', requirements: ['Net-zero target year', 'Residual emissions ≤10%', 'Neutralization strategy', 'Value chain decarbonization'] },
      { name: 'Validation', requirements: ['Target submission to SBTi', 'Third-party validation', 'Annual progress reporting', 'Recalculation policy'] },
    ],
  },
  {
    id: 'tnfd',
    name: 'Taskforce on Nature-related Financial Disclosures',
    shortName: 'TNFD',
    description: 'Framework for organizations to report and act on evolving nature-related dependencies, impacts, risks, and opportunities.',
    jurisdiction: 'Global',
    mandatory: false,
    website: 'https://tnfd.global',
    categories: [
      { name: 'Governance', requirements: ['Board oversight of nature-related issues', 'Management processes for nature risks'] },
      { name: 'Strategy', requirements: ['Nature-related dependencies and impacts', 'Business strategy implications', 'Scenario analysis for nature loss'] },
      { name: 'Risk & Impact Management', requirements: ['LEAP approach (Locate, Evaluate, Assess, Prepare)', 'Nature-related risk identification', 'Biodiversity impact assessment'] },
      { name: 'Metrics & Targets', requirements: ['Nature-related metrics', 'Priority location disclosures', 'Nature-positive targets', 'Dependency metrics'] },
    ],
  },
  {
    id: 'eu-taxonomy',
    name: 'EU Taxonomy for Sustainable Activities',
    shortName: 'EU Taxonomy',
    description: 'Classification system establishing a list of environmentally sustainable economic activities for the EU.',
    jurisdiction: 'European Union',
    mandatory: true,
    website: 'https://finance.ec.europa.eu/sustainable-finance/tools-and-standards/eu-taxonomy-sustainable-activities_en',
    categories: [
      { name: 'Climate Mitigation', requirements: ['Substantial contribution criteria', 'DNSH assessment', 'Minimum safeguards compliance', 'Revenue alignment %'] },
      { name: 'Climate Adaptation', requirements: ['Physical climate risk assessment', 'Adaptation solutions', 'Do No Significant Harm'] },
      { name: 'Water & Marine', requirements: ['Water use efficiency', 'Marine ecosystem protection'] },
      { name: 'Circular Economy', requirements: ['Resource efficiency', 'Waste reduction', 'Product durability'] },
      { name: 'Pollution Prevention', requirements: ['Air, water, soil pollution controls', 'Chemical management'] },
      { name: 'Biodiversity', requirements: ['Ecosystem conservation', 'Land use practices', 'Deforestation-free supply chains'] },
    ],
  },
  {
    id: 'nigeria-srg1',
    name: 'Nigeria Sustainability Reporting Guidelines (SRG1)',
    shortName: 'Nigeria SRG1',
    description: 'Sustainability reporting guidelines issued by the Financial Reporting Council of Nigeria (FRCN), tailored for Nigerian entities.',
    jurisdiction: 'Nigeria',
    mandatory: true,
    website: 'https://frcnigeria.gov.ng',
    categories: [
      { name: 'Environmental', requirements: ['GHG emissions disclosure', 'Energy consumption', 'Water usage', 'Waste management', 'Environmental compliance'] },
      { name: 'Social', requirements: ['Employee welfare', 'Community investment', 'Human rights', 'Health and safety', 'Diversity metrics'] },
      { name: 'Governance', requirements: ['Board composition', 'Ethics and anti-corruption', 'Risk management', 'Stakeholder engagement'] },
      { name: 'Economic', requirements: ['Economic value generated', 'Tax transparency', 'Local procurement', 'Job creation'] },
    ],
  },
];

// Gap analysis helpers
export interface FrameworkGapResult {
  framework: Framework;
  totalRequirements: number;
  metRequirements: number;
  gapPercentage: number;
  gaps: { category: string; missing: string[] }[];
}

export function analyzeFrameworkGaps(
  frameworkId: string,
  availableData: {
    hasEmissions: boolean;
    hasScope1: boolean;
    hasScope2: boolean;
    hasScope3: boolean;
    hasGovernance: boolean;
    hasTargets: boolean;
    hasBiodiversity: boolean;
    hasWater: boolean;
    hasWaste: boolean;
    hasSuppliers: boolean;
    hasSocialMetrics: boolean;
  }
): FrameworkGapResult | null {
  const framework = ESG_FRAMEWORKS.find(f => f.id === frameworkId);
  if (!framework) return null;

  const gaps: FrameworkGapResult['gaps'] = [];
  let totalReqs = 0;
  let metReqs = 0;

  for (const cat of framework.categories) {
    const missing: string[] = [];
    for (const req of cat.requirements) {
      totalReqs++;
      const reqLower = req.toLowerCase();
      const isMet =
        (reqLower.includes('emission') && availableData.hasEmissions) ||
        (reqLower.includes('scope 1') && availableData.hasScope1) ||
        (reqLower.includes('scope 2') && availableData.hasScope2) ||
        (reqLower.includes('scope 3') && availableData.hasScope3) ||
        (reqLower.includes('governance') && availableData.hasGovernance) ||
        (reqLower.includes('target') && availableData.hasTargets) ||
        (reqLower.includes('biodiversity') && availableData.hasBiodiversity) ||
        (reqLower.includes('water') && availableData.hasWater) ||
        (reqLower.includes('waste') && availableData.hasWaste) ||
        (reqLower.includes('supplier') && availableData.hasSuppliers) ||
        (reqLower.includes('supply chain') && availableData.hasSuppliers) ||
        (reqLower.includes('workforce') && availableData.hasSocialMetrics) ||
        (reqLower.includes('employee') && availableData.hasSocialMetrics) ||
        (reqLower.includes('energy') && availableData.hasEmissions);

      if (isMet) metReqs++;
      else missing.push(req);
    }
    if (missing.length > 0) gaps.push({ category: cat.name, missing });
  }

  return {
    framework,
    totalRequirements: totalReqs,
    metRequirements: metReqs,
    gapPercentage: totalReqs > 0 ? ((totalReqs - metReqs) / totalReqs) * 100 : 100,
    gaps,
  };
}

export function getFrameworksByJurisdiction(jurisdiction: string): Framework[] {
  if (jurisdiction === 'all') return ESG_FRAMEWORKS;
  return ESG_FRAMEWORKS.filter(f => f.jurisdiction === jurisdiction || f.jurisdiction === 'Global');
}
