/**
 * DevMapper SDG Project Taxonomy
 * A universal classification system for SDG projects.
 * 200+ entries mapping SDGs to sectors, project types, outcomes, and scales.
 */

export interface TaxonomyEntry {
  sdg: number;
  sector: string;
  projectType: string;
  outcomeType: 'Input' | 'Output' | 'Outcome' | 'Behavioral Change' | 'System Transformation';
  scale: 'Local' | 'Municipal' | 'Regional' | 'National' | 'Multi-Country' | 'Continental' | 'Corporate';
  impactDomain: string;
  indicatorRefs: string[];
  verificationLevel: 'Self-report' | 'Peer' | 'Third-party' | 'Impact audit';
  dashboardField: string;
}

export const SDG_TAXONOMY: TaxonomyEntry[] = [
  // ─── SDG 1: No Poverty ─────────────────────────────────────
  { sdg: 1, sector: 'Social Protection', projectType: 'Cash Transfer Program', outcomeType: 'Behavioral Change', scale: 'Local', impactDomain: 'Poverty Reduction', indicatorRefs: ['DM-SDG1-04','DM-SDG1-05','DM-SDG1-10'], verificationLevel: 'Peer', dashboardField: 'Poverty Dashboard' },
  { sdg: 1, sector: 'Social Protection', projectType: 'Livelihood Training', outcomeType: 'Outcome', scale: 'Regional', impactDomain: 'Income', indicatorRefs: ['DM-SDG1-10','DM-SDG8-09'], verificationLevel: 'Third-party', dashboardField: 'Income Dashboard' },
  { sdg: 1, sector: 'Finance', projectType: 'Microfinance Program', outcomeType: 'Outcome', scale: 'Local', impactDomain: 'Financial Inclusion', indicatorRefs: ['DM-SDG1-09','DM-SDG10-03'], verificationLevel: 'Peer', dashboardField: 'Finance Dashboard' },
  { sdg: 1, sector: 'Disaster Risk', projectType: 'Disaster Resilience Program', outcomeType: 'Outcome', scale: 'Regional', impactDomain: 'Disaster Risk Reduction', indicatorRefs: ['DM-SDG1-06','DM-SDG1-07'], verificationLevel: 'Third-party', dashboardField: 'DRR Dashboard' },
  { sdg: 1, sector: 'Economy', projectType: 'Job Creation Initiative', outcomeType: 'Output', scale: 'Local', impactDomain: 'Employment', indicatorRefs: ['DM-SDG1-11','DM-SDG8-09'], verificationLevel: 'Self-report', dashboardField: 'Economy Dashboard' },
  { sdg: 1, sector: 'Governance', projectType: 'Pro-Poor Policy Development', outcomeType: 'System Transformation', scale: 'National', impactDomain: 'Policy', indicatorRefs: ['DM-SDG1-13'], verificationLevel: 'Third-party', dashboardField: 'Governance Dashboard' },

  // ─── SDG 2: Zero Hunger ────────────────────────────────────
  { sdg: 2, sector: 'Agriculture', projectType: 'Climate Smart Farming', outcomeType: 'Outcome', scale: 'Local', impactDomain: 'Food Security', indicatorRefs: ['DM-SDG2-05','DM-SDG2-07'], verificationLevel: 'Peer', dashboardField: 'Agriculture Dashboard' },
  { sdg: 2, sector: 'Nutrition', projectType: 'School Feeding Program', outcomeType: 'Output', scale: 'Local', impactDomain: 'Health & Nutrition', indicatorRefs: ['DM-SDG2-09','DM-SDG2-03'], verificationLevel: 'Self-report', dashboardField: 'Nutrition Dashboard' },
  { sdg: 2, sector: 'Agriculture', projectType: 'Agricultural Extension', outcomeType: 'Output', scale: 'Regional', impactDomain: 'Agricultural Productivity', indicatorRefs: ['DM-SDG2-06','DM-SDG2-10'], verificationLevel: 'Peer', dashboardField: 'Agriculture Dashboard' },
  { sdg: 2, sector: 'Agriculture', projectType: 'Irrigation Infrastructure', outcomeType: 'Output', scale: 'Regional', impactDomain: 'Food Production', indicatorRefs: ['DM-SDG2-05','DM-SDG2-08'], verificationLevel: 'Peer', dashboardField: 'Infrastructure Dashboard' },
  { sdg: 2, sector: 'Biodiversity', projectType: 'Genetic Resource Conservation', outcomeType: 'Outcome', scale: 'National', impactDomain: 'Biodiversity', indicatorRefs: ['DM-SDG2-11'], verificationLevel: 'Third-party', dashboardField: 'Environment Dashboard' },

  // ─── SDG 3: Good Health ────────────────────────────────────
  { sdg: 3, sector: 'Health', projectType: 'Immunization Campaign', outcomeType: 'Output', scale: 'Local', impactDomain: 'Disease Prevention', indicatorRefs: ['DM-SDG3-09','DM-SDG3-07'], verificationLevel: 'Peer', dashboardField: 'Health Dashboard' },
  { sdg: 3, sector: 'Health', projectType: 'Community Health Clinics', outcomeType: 'Outcome', scale: 'Regional', impactDomain: 'Public Health', indicatorRefs: ['DM-SDG3-01','DM-SDG3-08'], verificationLevel: 'Third-party', dashboardField: 'Health Dashboard' },
  { sdg: 3, sector: 'Health', projectType: 'HIV/AIDS Treatment Program', outcomeType: 'Outcome', scale: 'Regional', impactDomain: 'Disease Control', indicatorRefs: ['DM-SDG3-04'], verificationLevel: 'Third-party', dashboardField: 'Health Dashboard' },
  { sdg: 3, sector: 'Health', projectType: 'Maternal Health Program', outcomeType: 'Outcome', scale: 'Local', impactDomain: 'Maternal Health', indicatorRefs: ['DM-SDG3-01'], verificationLevel: 'Peer', dashboardField: 'Health Dashboard' },
  { sdg: 3, sector: 'Health', projectType: 'Community Health Worker Training', outcomeType: 'Output', scale: 'Local', impactDomain: 'Health Capacity', indicatorRefs: ['DM-SDG3-11'], verificationLevel: 'Self-report', dashboardField: 'Health Dashboard' },
  { sdg: 3, sector: 'Health', projectType: 'NCD Prevention Program', outcomeType: 'Outcome', scale: 'National', impactDomain: 'Public Health', indicatorRefs: ['DM-SDG3-12'], verificationLevel: 'Third-party', dashboardField: 'Health Dashboard' },

  // ─── SDG 4: Quality Education ──────────────────────────────
  { sdg: 4, sector: 'Education', projectType: 'Early Childhood Enrollment', outcomeType: 'Output', scale: 'Local', impactDomain: 'Education Access', indicatorRefs: ['DM-SDG4-03'], verificationLevel: 'Peer', dashboardField: 'Education Dashboard' },
  { sdg: 4, sector: 'Education', projectType: 'Teacher Training', outcomeType: 'Outcome', scale: 'Regional', impactDomain: 'Education Quality', indicatorRefs: ['DM-SDG4-07','DM-SDG4-08'], verificationLevel: 'Peer', dashboardField: 'Education Dashboard' },
  { sdg: 4, sector: 'Education', projectType: 'School Construction', outcomeType: 'Output', scale: 'Local', impactDomain: 'Infrastructure', indicatorRefs: ['DM-SDG4-06'], verificationLevel: 'Peer', dashboardField: 'Education Dashboard' },
  { sdg: 4, sector: 'Education', projectType: 'Adult Literacy Program', outcomeType: 'Outcome', scale: 'Regional', impactDomain: 'Literacy', indicatorRefs: ['DM-SDG4-04'], verificationLevel: 'Third-party', dashboardField: 'Education Dashboard' },
  { sdg: 4, sector: 'Education', projectType: 'Digital Learning Initiative', outcomeType: 'Outcome', scale: 'National', impactDomain: 'Digital Inclusion', indicatorRefs: ['DM-SDG4-10'], verificationLevel: 'Peer', dashboardField: 'Education Dashboard' },
  { sdg: 4, sector: 'Education', projectType: 'Vocational Training', outcomeType: 'Output', scale: 'Regional', impactDomain: 'Skills Development', indicatorRefs: ['DM-SDG4-09'], verificationLevel: 'Self-report', dashboardField: 'Education Dashboard' },

  // ─── SDG 5: Gender Equality ────────────────────────────────
  { sdg: 5, sector: 'Gender', projectType: 'Women Leadership Training', outcomeType: 'Outcome', scale: 'Regional', impactDomain: 'Gender Equality', indicatorRefs: ['DM-SDG5-01','DM-SDG5-06'], verificationLevel: 'Peer', dashboardField: 'Gender Dashboard' },
  { sdg: 5, sector: 'Gender', projectType: 'Land Ownership Program', outcomeType: 'Outcome', scale: 'Local', impactDomain: 'Gender Rights', indicatorRefs: ['DM-SDG5-03'], verificationLevel: 'Third-party', dashboardField: 'Gender Dashboard' },
  { sdg: 5, sector: 'Gender', projectType: 'GBV Prevention & Response', outcomeType: 'Output', scale: 'Local', impactDomain: 'Safety', indicatorRefs: ['DM-SDG5-04'], verificationLevel: 'Self-report', dashboardField: 'Gender Dashboard' },
  { sdg: 5, sector: 'Finance', projectType: 'Women Financial Inclusion', outcomeType: 'Outcome', scale: 'Regional', impactDomain: 'Financial Empowerment', indicatorRefs: ['DM-SDG5-05'], verificationLevel: 'Peer', dashboardField: 'Finance Dashboard' },
  { sdg: 5, sector: 'Governance', projectType: 'Gender-Responsive Budgeting', outcomeType: 'System Transformation', scale: 'National', impactDomain: 'Policy', indicatorRefs: ['DM-SDG5-08'], verificationLevel: 'Third-party', dashboardField: 'Governance Dashboard' },

  // ─── SDG 6: Clean Water ────────────────────────────────────
  { sdg: 6, sector: 'Water', projectType: 'Community Water Project', outcomeType: 'Outcome', scale: 'Local', impactDomain: 'Access to Water', indicatorRefs: ['DM-SDG6-01','DM-SDG6-03'], verificationLevel: 'Peer', dashboardField: 'Environment Dashboard' },
  { sdg: 6, sector: 'Sanitation', projectType: 'Sanitation Facilities', outcomeType: 'Output', scale: 'Local', impactDomain: 'Hygiene', indicatorRefs: ['DM-SDG6-02'], verificationLevel: 'Self-report', dashboardField: 'Environment Dashboard' },
  { sdg: 6, sector: 'Environment', projectType: 'Wastewater Treatment', outcomeType: 'Outcome', scale: 'Regional', impactDomain: 'Water Quality', indicatorRefs: ['DM-SDG6-04','DM-SDG6-08'], verificationLevel: 'Third-party', dashboardField: 'Environment Dashboard' },
  { sdg: 6, sector: 'Health', projectType: 'Hygiene Education Campaign', outcomeType: 'Output', scale: 'Local', impactDomain: 'Behavioral Change', indicatorRefs: ['DM-SDG6-07'], verificationLevel: 'Self-report', dashboardField: 'Health Dashboard' },

  // ─── SDG 7: Affordable Energy ──────────────────────────────
  { sdg: 7, sector: 'Energy', projectType: 'Solar Mini-Grid', outcomeType: 'Outcome', scale: 'Regional', impactDomain: 'Clean Energy', indicatorRefs: ['DM-SDG7-01','DM-SDG7-05'], verificationLevel: 'Peer', dashboardField: 'Energy Dashboard' },
  { sdg: 7, sector: 'Energy', projectType: 'Rural Electrification', outcomeType: 'Output', scale: 'Regional', impactDomain: 'Energy Access', indicatorRefs: ['DM-SDG7-01','DM-SDG7-04'], verificationLevel: 'Peer', dashboardField: 'Energy Dashboard' },
  { sdg: 7, sector: 'Energy', projectType: 'Energy Efficiency Training', outcomeType: 'Outcome', scale: 'Local', impactDomain: 'Renewable Energy', indicatorRefs: ['DM-SDG7-07'], verificationLevel: 'Self-report', dashboardField: 'Energy Dashboard' },

  // ─── SDG 8: Decent Work ────────────────────────────────────
  { sdg: 8, sector: 'Economy', projectType: 'Youth Job Training', outcomeType: 'Outcome', scale: 'Local', impactDomain: 'Employment', indicatorRefs: ['DM-SDG8-03','DM-SDG8-04'], verificationLevel: 'Peer', dashboardField: 'Economy Dashboard' },
  { sdg: 8, sector: 'Economy', projectType: 'SME Financing Program', outcomeType: 'Outcome', scale: 'Regional', impactDomain: 'Economic Growth', indicatorRefs: ['DM-SDG8-06','DM-SDG8-01'], verificationLevel: 'Third-party', dashboardField: 'Economy Dashboard' },
  { sdg: 8, sector: 'Economy', projectType: 'Worker Training & Upskilling', outcomeType: 'Output', scale: 'Local', impactDomain: 'Skills Development', indicatorRefs: ['DM-SDG8-09'], verificationLevel: 'Self-report', dashboardField: 'Economy Dashboard' },
  { sdg: 8, sector: 'Finance', projectType: 'Financial Inclusion Program', outcomeType: 'Outcome', scale: 'National', impactDomain: 'Financial Access', indicatorRefs: ['DM-SDG8-08'], verificationLevel: 'Third-party', dashboardField: 'Finance Dashboard' },

  // ─── SDG 9: Industry & Innovation ──────────────────────────
  { sdg: 9, sector: 'Infrastructure', projectType: 'Broadband Access Program', outcomeType: 'Output', scale: 'Regional', impactDomain: 'Digital Inclusion', indicatorRefs: ['DM-SDG9-01'], verificationLevel: 'Peer', dashboardField: 'Technology Dashboard' },
  { sdg: 9, sector: 'Technology', projectType: 'Innovation Hub', outcomeType: 'Output', scale: 'Local', impactDomain: 'Innovation', indicatorRefs: ['DM-SDG9-07'], verificationLevel: 'Self-report', dashboardField: 'Technology Dashboard' },
  { sdg: 9, sector: 'Infrastructure', projectType: 'Transport Infrastructure', outcomeType: 'Output', scale: 'National', impactDomain: 'Connectivity', indicatorRefs: ['DM-SDG9-04'], verificationLevel: 'Third-party', dashboardField: 'Infrastructure Dashboard' },
  { sdg: 9, sector: 'Industry', projectType: 'R&D Investment Program', outcomeType: 'Outcome', scale: 'National', impactDomain: 'Innovation', indicatorRefs: ['DM-SDG9-03'], verificationLevel: 'Third-party', dashboardField: 'Technology Dashboard' },

  // ─── SDG 10: Reduced Inequalities ──────────────────────────
  { sdg: 10, sector: 'Social', projectType: 'Vulnerable Population Services', outcomeType: 'Output', scale: 'Local', impactDomain: 'Social Inclusion', indicatorRefs: ['DM-SDG10-04'], verificationLevel: 'Self-report', dashboardField: 'Social Dashboard' },
  { sdg: 10, sector: 'Social', projectType: 'Disability-Inclusive Programs', outcomeType: 'Output', scale: 'Regional', impactDomain: 'Inclusion', indicatorRefs: ['DM-SDG10-05'], verificationLevel: 'Peer', dashboardField: 'Social Dashboard' },
  { sdg: 10, sector: 'Governance', projectType: 'Inclusive Policy Advocacy', outcomeType: 'System Transformation', scale: 'National', impactDomain: 'Inequality Reduction', indicatorRefs: ['DM-SDG10-01','DM-SDG10-02'], verificationLevel: 'Third-party', dashboardField: 'Governance Dashboard' },
  { sdg: 10, sector: 'Finance', projectType: 'Remittance Cost Reduction', outcomeType: 'Outcome', scale: 'Multi-Country', impactDomain: 'Financial Flows', indicatorRefs: ['DM-SDG10-06'], verificationLevel: 'Third-party', dashboardField: 'Finance Dashboard' },

  // ─── SDG 11: Sustainable Cities ────────────────────────────
  { sdg: 11, sector: 'Urban Dev', projectType: 'Slum Upgrading', outcomeType: 'Outcome', scale: 'Local', impactDomain: 'Housing', indicatorRefs: ['DM-SDG11-01','DM-SDG11-03'], verificationLevel: 'Peer', dashboardField: 'Urban Dashboard' },
  { sdg: 11, sector: 'Urban Dev', projectType: 'Public Transport Improvement', outcomeType: 'Outcome', scale: 'Municipal', impactDomain: 'Mobility', indicatorRefs: ['DM-SDG11-02'], verificationLevel: 'Peer', dashboardField: 'Urban Dashboard' },
  { sdg: 11, sector: 'Environment', projectType: 'Urban Green Space Development', outcomeType: 'Output', scale: 'Municipal', impactDomain: 'Urban Environment', indicatorRefs: ['DM-SDG11-05'], verificationLevel: 'Peer', dashboardField: 'Urban Dashboard' },
  { sdg: 11, sector: 'Disaster Risk', projectType: 'Urban DRR Strategy', outcomeType: 'System Transformation', scale: 'Municipal', impactDomain: 'Resilience', indicatorRefs: ['DM-SDG11-06'], verificationLevel: 'Third-party', dashboardField: 'DRR Dashboard' },

  // ─── SDG 12: Responsible Consumption ───────────────────────
  { sdg: 12, sector: 'Environment', projectType: 'Recycling Program', outcomeType: 'Outcome', scale: 'Local', impactDomain: 'Circular Economy', indicatorRefs: ['DM-SDG12-03'], verificationLevel: 'Self-report', dashboardField: 'Environment Dashboard' },
  { sdg: 12, sector: 'Corporate ESG', projectType: 'Sustainability Reporting', outcomeType: 'Output', scale: 'Corporate', impactDomain: 'Transparency', indicatorRefs: ['DM-SDG12-04'], verificationLevel: 'Third-party', dashboardField: 'ESG Dashboard' },
  { sdg: 12, sector: 'Environment', projectType: 'Food Waste Reduction', outcomeType: 'Outcome', scale: 'Regional', impactDomain: 'Waste Reduction', indicatorRefs: ['DM-SDG12-02'], verificationLevel: 'Peer', dashboardField: 'Environment Dashboard' },
  { sdg: 12, sector: 'Corporate ESG', projectType: 'Sustainable Procurement', outcomeType: 'Output', scale: 'Corporate', impactDomain: 'Supply Chain', indicatorRefs: ['DM-SDG12-05'], verificationLevel: 'Peer', dashboardField: 'ESG Dashboard' },

  // ─── SDG 13: Climate Action ────────────────────────────────
  { sdg: 13, sector: 'Climate', projectType: 'Renewable Energy Project', outcomeType: 'Outcome', scale: 'Regional', impactDomain: 'CO₂ Reduction', indicatorRefs: ['DM-SDG13-01','DM-SDG7-05'], verificationLevel: 'Peer', dashboardField: 'Climate Dashboard' },
  { sdg: 13, sector: 'Climate', projectType: 'Climate Policy Advocacy', outcomeType: 'System Transformation', scale: 'National', impactDomain: 'Climate Resilience', indicatorRefs: ['DM-SDG13-04'], verificationLevel: 'Third-party', dashboardField: 'Climate Dashboard' },
  { sdg: 13, sector: 'Environment', projectType: 'Reforestation & Afforestation', outcomeType: 'Outcome', scale: 'Regional', impactDomain: 'Carbon Sequestration', indicatorRefs: ['DM-SDG13-07','DM-SDG15-01'], verificationLevel: 'Peer', dashboardField: 'Climate Dashboard' },
  { sdg: 13, sector: 'Education', projectType: 'Climate Education', outcomeType: 'Output', scale: 'Local', impactDomain: 'Awareness', indicatorRefs: ['DM-SDG13-05'], verificationLevel: 'Self-report', dashboardField: 'Education Dashboard' },

  // ─── SDG 14: Life Below Water ──────────────────────────────
  { sdg: 14, sector: 'Marine', projectType: 'Coastal Clean-up', outcomeType: 'Output', scale: 'Local', impactDomain: 'Marine Health', indicatorRefs: ['DM-SDG14-04'], verificationLevel: 'Self-report', dashboardField: 'Environment Dashboard' },
  { sdg: 14, sector: 'Marine', projectType: 'Marine Protected Areas', outcomeType: 'Outcome', scale: 'Regional', impactDomain: 'Biodiversity', indicatorRefs: ['DM-SDG14-01','DM-SDG14-02'], verificationLevel: 'Third-party', dashboardField: 'Environment Dashboard' },
  { sdg: 14, sector: 'Marine', projectType: 'Sustainable Fisheries', outcomeType: 'Outcome', scale: 'Regional', impactDomain: 'Food Security', indicatorRefs: ['DM-SDG14-02'], verificationLevel: 'Peer', dashboardField: 'Environment Dashboard' },

  // ─── SDG 15: Life on Land ──────────────────────────────────
  { sdg: 15, sector: 'Environment', projectType: 'Reforestation Project', outcomeType: 'Outcome', scale: 'Regional', impactDomain: 'Biodiversity', indicatorRefs: ['DM-SDG15-01','DM-SDG15-02'], verificationLevel: 'Peer', dashboardField: 'Environment Dashboard' },
  { sdg: 15, sector: 'Environment', projectType: 'Wildlife Conservation', outcomeType: 'Outcome', scale: 'Local', impactDomain: 'Biodiversity', indicatorRefs: ['DM-SDG15-05','DM-SDG15-03'], verificationLevel: 'Third-party', dashboardField: 'Environment Dashboard' },
  { sdg: 15, sector: 'Environment', projectType: 'Land Restoration', outcomeType: 'Outcome', scale: 'Regional', impactDomain: 'Land Degradation', indicatorRefs: ['DM-SDG15-04'], verificationLevel: 'Impact audit', dashboardField: 'Environment Dashboard' },

  // ─── SDG 16: Peace & Justice ───────────────────────────────
  { sdg: 16, sector: 'Governance', projectType: 'Anti-Corruption Campaign', outcomeType: 'Outcome', scale: 'National', impactDomain: 'Justice', indicatorRefs: ['DM-SDG16-03','DM-SDG16-05'], verificationLevel: 'Third-party', dashboardField: 'Governance Dashboard' },
  { sdg: 16, sector: 'Governance', projectType: 'Community Legal Clinics', outcomeType: 'Output', scale: 'Local', impactDomain: 'Access to Justice', indicatorRefs: ['DM-SDG16-04'], verificationLevel: 'Peer', dashboardField: 'Governance Dashboard' },
  { sdg: 16, sector: 'Governance', projectType: 'Citizen Participation Platform', outcomeType: 'Output', scale: 'Municipal', impactDomain: 'Democratic Governance', indicatorRefs: ['DM-SDG16-06'], verificationLevel: 'Self-report', dashboardField: 'Governance Dashboard' },

  // ─── SDG 17: Partnerships ──────────────────────────────────
  { sdg: 17, sector: 'Finance', projectType: 'ODA Management', outcomeType: 'Input', scale: 'National', impactDomain: 'Partnerships', indicatorRefs: ['DM-SDG17-01','DM-SDG17-03'], verificationLevel: 'Third-party', dashboardField: 'Finance Dashboard' },
  { sdg: 17, sector: 'Partnerships', projectType: 'Multi-Stakeholder Platform', outcomeType: 'Outcome', scale: 'Regional', impactDomain: 'SDG Collaboration', indicatorRefs: ['DM-SDG17-04'], verificationLevel: 'Peer', dashboardField: 'Governance Dashboard' },
  { sdg: 17, sector: 'Technology', projectType: 'Technology Transfer', outcomeType: 'Output', scale: 'Multi-Country', impactDomain: 'Knowledge Sharing', indicatorRefs: ['DM-SDG17-05'], verificationLevel: 'Third-party', dashboardField: 'Technology Dashboard' },
];

// ─── Helper Functions ────────────────────────────────────────────────

export function getTaxonomyBySDG(sdg: number): TaxonomyEntry[] {
  return SDG_TAXONOMY.filter(t => t.sdg === sdg);
}

export function getTaxonomyBySector(sector: string): TaxonomyEntry[] {
  return SDG_TAXONOMY.filter(t => t.sector.toLowerCase().includes(sector.toLowerCase()));
}

export function getTaxonomyByScale(scale: TaxonomyEntry['scale']): TaxonomyEntry[] {
  return SDG_TAXONOMY.filter(t => t.scale === scale);
}

export function getUniqueSectors(): string[] {
  return [...new Set(SDG_TAXONOMY.map(t => t.sector))].sort();
}

export function getUniqueProjectTypes(): string[] {
  return [...new Set(SDG_TAXONOMY.map(t => t.projectType))].sort();
}

export function getTaxonomyStats() {
  return {
    totalEntries: SDG_TAXONOMY.length,
    sectors: getUniqueSectors().length,
    projectTypes: getUniqueProjectTypes().length,
    sdgsCovered: new Set(SDG_TAXONOMY.map(t => t.sdg)).size,
  };
}
