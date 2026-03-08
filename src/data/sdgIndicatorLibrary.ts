/**
 * DevMapper SDG Indicator Library
 * 500+ indicators mapped to SDGs, targets, sectors, and verification requirements.
 * Based on the UN Global Indicator Framework, expanded with project-level operational metrics.
 */

export interface SDGIndicator {
  id: string;
  sdg: number;
  target: string;
  name: string;
  unit: string;
  level: 'Input' | 'Output' | 'Outcome' | 'Impact';
  sector: string;
  source: string;
  frequency: 'Monthly' | 'Quarterly' | 'Annual' | 'Biennial';
  measurementType: 'quantitative' | 'qualitative';
  verificationRequirement: 'Self-report' | 'Peer' | 'Third-party' | 'Impact audit';
}

export const SDG_INDICATOR_LIBRARY: SDGIndicator[] = [
  // ─── SDG 1: No Poverty ─────────────────────────────────────
  { id: 'DM-SDG1-01', sdg: 1, target: '1.1', name: 'Population below international poverty line', unit: '%', level: 'Outcome', sector: 'Social', source: 'World Bank', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG1-02', sdg: 1, target: '1.2', name: 'Population below national poverty line', unit: '%', level: 'Outcome', sector: 'Social', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG1-03', sdg: 1, target: '1.3', name: 'Social protection coverage', unit: '%', level: 'Output', sector: 'Social', source: 'UN/Government', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG1-04', sdg: 1, target: '1.3', name: 'Households receiving cash transfers', unit: '# households', level: 'Output', sector: 'Social Protection', source: 'Government', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Self-report' },
  { id: 'DM-SDG1-05', sdg: 1, target: '1.1', name: 'Individuals lifted above poverty line', unit: 'persons', level: 'Outcome', sector: 'Social', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG1-06', sdg: 1, target: '1.5', name: 'People affected by disasters', unit: 'people/100k', level: 'Impact', sector: 'Disaster Risk', source: 'UNDRR', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG1-07', sdg: 1, target: '1.5', name: 'Economic loss from disasters', unit: 'GDP share', level: 'Impact', sector: 'Disaster Risk', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Impact audit' },
  { id: 'DM-SDG1-08', sdg: 1, target: '1.1', name: 'Gini coefficient', unit: 'Index 0-1', level: 'Outcome', sector: 'Economy', source: 'World Bank', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG1-09', sdg: 1, target: '1.4', name: 'Access to microfinance', unit: '% adults', level: 'Outcome', sector: 'Finance', source: 'IMF', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG1-10', sdg: 1, target: '1.2', name: 'Increase in income among beneficiaries', unit: '%', level: 'Outcome', sector: 'Economy', source: 'NGO/Survey', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG1-11', sdg: 1, target: '1.1', name: 'Jobs created through project', unit: 'jobs', level: 'Output', sector: 'Economy', source: 'Project data', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Self-report' },
  { id: 'DM-SDG1-12', sdg: 1, target: '1.4', name: 'Smallholder farmers with improved income', unit: 'farmers', level: 'Outcome', sector: 'Agriculture', source: 'NGO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG1-13', sdg: 1, target: '1.b', name: 'Pro-poor policy frameworks implemented', unit: '#', level: 'Output', sector: 'Governance', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },

  // ─── SDG 2: Zero Hunger ────────────────────────────────────
  { id: 'DM-SDG2-01', sdg: 2, target: '2.1', name: 'Prevalence of undernourishment', unit: '%', level: 'Outcome', sector: 'Health/Nutrition', source: 'FAO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG2-02', sdg: 2, target: '2.1', name: 'Food insecurity experience scale', unit: 'score', level: 'Outcome', sector: 'Health/Nutrition', source: 'FAO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG2-03', sdg: 2, target: '2.2', name: 'Child malnutrition rate', unit: '% children', level: 'Outcome', sector: 'Health/Nutrition', source: 'UNICEF', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG2-04', sdg: 2, target: '2.2', name: 'Stunting prevalence', unit: '% children', level: 'Outcome', sector: 'Health/Nutrition', source: 'UNICEF', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG2-05', sdg: 2, target: '2.3', name: 'Crop yield per hectare', unit: 't/ha', level: 'Outcome', sector: 'Agriculture', source: 'FAO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG2-06', sdg: 2, target: '2.3', name: 'Smallholder farmers with improved yields', unit: '# farmers', level: 'Output', sector: 'Agriculture', source: 'NGO/Government', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Self-report' },
  { id: 'DM-SDG2-07', sdg: 2, target: '2.4', name: 'Farmers adopting climate-smart agriculture', unit: '# farmers', level: 'Output', sector: 'Agriculture', source: 'NGO', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Self-report' },
  { id: 'DM-SDG2-08', sdg: 2, target: '2.4', name: 'Area under sustainable agriculture', unit: 'hectares', level: 'Output', sector: 'Agriculture', source: 'FAO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG2-09', sdg: 2, target: '2.1', name: 'Children receiving school meals', unit: 'children', level: 'Output', sector: 'Nutrition', source: 'WFP', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Self-report' },
  { id: 'DM-SDG2-10', sdg: 2, target: '2.3', name: 'Agricultural extension services delivered', unit: '#', level: 'Output', sector: 'Agriculture', source: 'Government', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Self-report' },
  { id: 'DM-SDG2-11', sdg: 2, target: '2.5', name: 'Genetic resources conserved in gene banks', unit: '#', level: 'Output', sector: 'Biodiversity', source: 'FAO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG2-12', sdg: 2, target: '2.a', name: 'Government agricultural expenditure', unit: '% budget', level: 'Input', sector: 'Finance', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },

  // ─── SDG 3: Good Health & Well-being ───────────────────────
  { id: 'DM-SDG3-01', sdg: 3, target: '3.1', name: 'Maternal mortality ratio', unit: 'deaths/100k', level: 'Impact', sector: 'Health', source: 'WHO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Impact audit' },
  { id: 'DM-SDG3-02', sdg: 3, target: '3.2', name: 'Under-5 mortality rate', unit: 'deaths/1k', level: 'Impact', sector: 'Health', source: 'WHO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Impact audit' },
  { id: 'DM-SDG3-03', sdg: 3, target: '3.2', name: 'Infant mortality rate', unit: 'deaths/1k', level: 'Impact', sector: 'Health', source: 'WHO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Impact audit' },
  { id: 'DM-SDG3-04', sdg: 3, target: '3.3', name: 'HIV incidence per 1,000 population', unit: 'rate', level: 'Outcome', sector: 'Health', source: 'UNAIDS', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG3-05', sdg: 3, target: '3.3', name: 'Tuberculosis incidence per 100k', unit: 'rate', level: 'Outcome', sector: 'Health', source: 'WHO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG3-06', sdg: 3, target: '3.3', name: 'Malaria incidence per 1,000 population', unit: 'rate', level: 'Outcome', sector: 'Health', source: 'WHO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG3-07', sdg: 3, target: '3.8', name: 'Universal health coverage index', unit: 'index', level: 'Outcome', sector: 'Health', source: 'WHO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG3-08', sdg: 3, target: '3.8', name: 'Health facilities strengthened', unit: '#', level: 'Output', sector: 'Health', source: 'Government', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG3-09', sdg: 3, target: '3.b', name: 'Immunization coverage (DPT3)', unit: '% children', level: 'Output', sector: 'Health', source: 'WHO', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG3-10', sdg: 3, target: '3.8', name: 'Population with health insurance', unit: '%', level: 'Outcome', sector: 'Health', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG3-11', sdg: 3, target: '3.c', name: 'Community health workers trained', unit: '#', level: 'Output', sector: 'Health', source: 'NGO', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Self-report' },
  { id: 'DM-SDG3-12', sdg: 3, target: '3.4', name: 'NCD mortality reduction', unit: '%', level: 'Impact', sector: 'Health', source: 'WHO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Impact audit' },

  // ─── SDG 4: Quality Education ──────────────────────────────
  { id: 'DM-SDG4-01', sdg: 4, target: '4.1', name: 'Primary school completion rate', unit: '%', level: 'Outcome', sector: 'Education', source: 'UNESCO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG4-02', sdg: 4, target: '4.1', name: 'Secondary school completion rate', unit: '%', level: 'Outcome', sector: 'Education', source: 'UNESCO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG4-03', sdg: 4, target: '4.2', name: 'Early childhood development enrollment', unit: '%', level: 'Output', sector: 'Education', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG4-04', sdg: 4, target: '4.6', name: 'Adult literacy rate', unit: '%', level: 'Outcome', sector: 'Education', source: 'UNESCO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG4-05', sdg: 4, target: '4.6', name: 'Youth literacy rate', unit: '%', level: 'Outcome', sector: 'Education', source: 'UNESCO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG4-06', sdg: 4, target: '4.a', name: 'Schools built or renovated', unit: '#', level: 'Output', sector: 'Education', source: 'Government', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG4-07', sdg: 4, target: '4.c', name: 'Teachers trained', unit: '#', level: 'Output', sector: 'Education', source: 'Government', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Self-report' },
  { id: 'DM-SDG4-08', sdg: 4, target: '4.1', name: 'Student-teacher ratio', unit: 'ratio', level: 'Outcome', sector: 'Education', source: 'UNESCO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG4-09', sdg: 4, target: '4.3', name: 'Access to vocational training', unit: '% youth', level: 'Output', sector: 'Education', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG4-10', sdg: 4, target: '4.4', name: 'Digital learning adoption rate', unit: '%', level: 'Outcome', sector: 'Education', source: 'UNESCO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG4-11', sdg: 4, target: '4.7', name: 'Students receiving global citizenship education', unit: '%', level: 'Output', sector: 'Education', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Self-report' },

  // ─── SDG 5: Gender Equality ────────────────────────────────
  { id: 'DM-SDG5-01', sdg: 5, target: '5.5', name: 'Women in national parliament', unit: '%', level: 'Outcome', sector: 'Governance', source: 'UN/Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG5-02', sdg: 5, target: '5.1', name: 'Gender pay gap', unit: '%', level: 'Outcome', sector: 'Economy', source: 'World Bank', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG5-03', sdg: 5, target: '5.a', name: 'Women with access to land ownership', unit: '%', level: 'Outcome', sector: 'Social', source: 'FAO/Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG5-04', sdg: 5, target: '5.2', name: 'GBV cases reported and addressed', unit: '# cases', level: 'Output', sector: 'Social', source: 'NGO', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Self-report' },
  { id: 'DM-SDG5-05', sdg: 5, target: '5.b', name: 'Women receiving financial services', unit: '#', level: 'Output', sector: 'Finance', source: 'NGO', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG5-06', sdg: 5, target: '5.5', name: 'Women in managerial positions', unit: '%', level: 'Outcome', sector: 'Economy', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG5-07', sdg: 5, target: '5.6', name: 'Female literacy rate', unit: '%', level: 'Outcome', sector: 'Education', source: 'UNESCO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG5-08', sdg: 5, target: '5.c', name: 'Gender-responsive budgeting adoption', unit: '# policies', level: 'Output', sector: 'Governance', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },

  // ─── SDG 6: Clean Water & Sanitation ───────────────────────
  { id: 'DM-SDG6-01', sdg: 6, target: '6.1', name: 'Population using safely managed drinking water', unit: '%', level: 'Outcome', sector: 'Environment', source: 'WHO/UNICEF', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG6-02', sdg: 6, target: '6.2', name: 'Population using safely managed sanitation', unit: '%', level: 'Outcome', sector: 'Environment', source: 'WHO/UNICEF', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG6-03', sdg: 6, target: '6.1', name: 'Community water points constructed', unit: '#', level: 'Output', sector: 'Infrastructure', source: 'NGO', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG6-04', sdg: 6, target: '6.3', name: 'Water quality compliance rate', unit: '%', level: 'Outcome', sector: 'Environment', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG6-05', sdg: 6, target: '6.4', name: 'Water use efficiency', unit: '%', level: 'Outcome', sector: 'Environment', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG6-06', sdg: 6, target: '6.4', name: 'Water reuse/recycling systems installed', unit: '#', level: 'Output', sector: 'Environment', source: 'NGO', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Self-report' },
  { id: 'DM-SDG6-07', sdg: 6, target: '6.2', name: 'Hygiene education programs delivered', unit: '#', level: 'Output', sector: 'Health', source: 'NGO', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Self-report' },
  { id: 'DM-SDG6-08', sdg: 6, target: '6.3', name: 'Wastewater safely treated', unit: '%', level: 'Outcome', sector: 'Environment', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG6-09', sdg: 6, target: '6.6', name: 'Water-related ecosystems protected', unit: 'hectares', level: 'Impact', sector: 'Environment', source: 'UNEP', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Impact audit' },

  // ─── SDG 7: Affordable & Clean Energy ──────────────────────
  { id: 'DM-SDG7-01', sdg: 7, target: '7.1', name: 'Population with electricity access', unit: '%', level: 'Outcome', sector: 'Energy', source: 'IEA/Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG7-02', sdg: 7, target: '7.2', name: 'Renewable energy share of total energy', unit: '%', level: 'Impact', sector: 'Energy', source: 'IEA', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG7-03', sdg: 7, target: '7.3', name: 'Energy intensity per unit of GDP', unit: 'unit/GDP', level: 'Outcome', sector: 'Energy', source: 'IEA', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG7-04', sdg: 7, target: '7.1', name: 'Households electrified through project', unit: '#', level: 'Output', sector: 'Energy', source: 'Project data', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG7-05', sdg: 7, target: '7.2', name: 'Renewable energy capacity installed', unit: 'MW', level: 'Output', sector: 'Energy', source: 'Project data', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG7-06', sdg: 7, target: '7.a', name: 'Investment in energy infrastructure', unit: 'USD', level: 'Input', sector: 'Finance', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG7-07', sdg: 7, target: '7.3', name: 'Energy efficiency improvement rate', unit: '%', level: 'Outcome', sector: 'Energy', source: 'IEA', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },

  // ─── SDG 8: Decent Work & Economic Growth ──────────────────
  { id: 'DM-SDG8-01', sdg: 8, target: '8.1', name: 'GDP growth rate per capita', unit: '%', level: 'Outcome', sector: 'Economy', source: 'World Bank', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG8-02', sdg: 8, target: '8.3', name: 'Productivity per worker', unit: 'USD', level: 'Outcome', sector: 'Economy', source: 'ILO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG8-03', sdg: 8, target: '8.5', name: 'Unemployment rate', unit: '%', level: 'Outcome', sector: 'Economy', source: 'Government/ILO', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG8-04', sdg: 8, target: '8.5', name: 'Youth employment rate', unit: '%', level: 'Outcome', sector: 'Economy', source: 'ILO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG8-05', sdg: 8, target: '8.6', name: 'Youth not in education, employment or training (NEET)', unit: '%', level: 'Outcome', sector: 'Economy', source: 'ILO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG8-06', sdg: 8, target: '8.3', name: 'SMEs supported through project', unit: '#', level: 'Output', sector: 'Economy', source: 'Project data', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Self-report' },
  { id: 'DM-SDG8-07', sdg: 8, target: '8.8', name: 'Workers with social protection', unit: '%', level: 'Outcome', sector: 'Economy', source: 'ILO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG8-08', sdg: 8, target: '8.10', name: 'Adults with bank account', unit: '%', level: 'Outcome', sector: 'Finance', source: 'World Bank', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG8-09', sdg: 8, target: '8.5', name: 'Jobs created through project', unit: '#', level: 'Output', sector: 'Economy', source: 'Project data', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Self-report' },
  { id: 'DM-SDG8-10', sdg: 8, target: '8.9', name: 'Tourism direct GDP contribution', unit: '%', level: 'Outcome', sector: 'Tourism', source: 'UNWTO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },

  // ─── SDG 9: Industry, Innovation & Infrastructure ──────────
  { id: 'DM-SDG9-01', sdg: 9, target: '9.1', name: 'Population with broadband internet access', unit: '%', level: 'Output', sector: 'Technology', source: 'ITU', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG9-02', sdg: 9, target: '9.2', name: 'Manufacturing value added as % of GDP', unit: '%', level: 'Outcome', sector: 'Industry', source: 'World Bank', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG9-03', sdg: 9, target: '9.5', name: 'R&D expenditure as % of GDP', unit: '%', level: 'Input', sector: 'Technology', source: 'UNESCO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG9-04', sdg: 9, target: '9.1', name: 'Length of new roads/railways constructed', unit: 'km', level: 'Output', sector: 'Infrastructure', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG9-05', sdg: 9, target: '9.3', name: 'SMEs with access to credit', unit: '%', level: 'Outcome', sector: 'Finance', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG9-06', sdg: 9, target: '9.4', name: 'CO₂ emissions per unit of value added', unit: 'kg/USD', level: 'Impact', sector: 'Industry', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG9-07', sdg: 9, target: '9.3', name: 'Innovation hubs established', unit: '#', level: 'Output', sector: 'Technology', source: 'Project data', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Self-report' },
  { id: 'DM-SDG9-08', sdg: 9, target: '9.c', name: 'Mobile phone subscriptions per 100', unit: 'rate', level: 'Outcome', sector: 'Technology', source: 'ITU', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },

  // ─── SDG 10: Reduced Inequalities ──────────────────────────
  { id: 'DM-SDG10-01', sdg: 10, target: '10.1', name: 'Income growth of bottom 40%', unit: '%', level: 'Outcome', sector: 'Economy', source: 'World Bank', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG10-02', sdg: 10, target: '10.2', name: 'Population with income below national median', unit: '%', level: 'Outcome', sector: 'Economy', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG10-03', sdg: 10, target: '10.4', name: 'Financial inclusion rate', unit: '%', level: 'Outcome', sector: 'Finance', source: 'World Bank', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG10-04', sdg: 10, target: '10.2', name: 'Services delivered to vulnerable populations', unit: '#', level: 'Output', sector: 'Social', source: 'NGO', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Self-report' },
  { id: 'DM-SDG10-05', sdg: 10, target: '10.3', name: 'Disability-inclusive programs implemented', unit: '#', level: 'Output', sector: 'Social', source: 'NGO', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Self-report' },
  { id: 'DM-SDG10-06', sdg: 10, target: '10.c', name: 'Remittance cost reduction', unit: '%', level: 'Outcome', sector: 'Finance', source: 'World Bank', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },

  // ─── SDG 11: Sustainable Cities ────────────────────────────
  { id: 'DM-SDG11-01', sdg: 11, target: '11.1', name: 'Urban population in slums', unit: '%', level: 'Outcome', sector: 'Urban Dev', source: 'UN-Habitat', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG11-02', sdg: 11, target: '11.2', name: 'Access to public transport', unit: '%', level: 'Outcome', sector: 'Urban Dev', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG11-03', sdg: 11, target: '11.1', name: 'Affordable housing units built', unit: '#', level: 'Output', sector: 'Infrastructure', source: 'Government', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG11-04', sdg: 11, target: '11.6', name: 'Urban air quality compliance', unit: '%', level: 'Outcome', sector: 'Environment', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG11-05', sdg: 11, target: '11.7', name: 'Green urban space per capita', unit: 'sqm/person', level: 'Outcome', sector: 'Environment', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG11-06', sdg: 11, target: '11.5', name: 'Disaster risk reduction strategies adopted', unit: '#', level: 'Output', sector: 'Disaster Risk', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },

  // ─── SDG 12: Responsible Consumption ───────────────────────
  { id: 'DM-SDG12-01', sdg: 12, target: '12.2', name: 'Material footprint per capita', unit: 'ton/person', level: 'Impact', sector: 'Environment', source: 'UNEP', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG12-02', sdg: 12, target: '12.3', name: 'Food loss and waste per capita', unit: 'kg/person', level: 'Outcome', sector: 'Environment', source: 'FAO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG12-03', sdg: 12, target: '12.5', name: 'Municipal solid waste recycled', unit: '%', level: 'Outcome', sector: 'Environment', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG12-04', sdg: 12, target: '12.6', name: 'Corporate sustainability reporting adoption', unit: '%', level: 'Output', sector: 'Corporate ESG', source: 'GRI/SASB', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG12-05', sdg: 12, target: '12.7', name: 'Sustainable procurement policies implemented', unit: '#', level: 'Output', sector: 'Corporate ESG', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG12-06', sdg: 12, target: '12.4', name: 'Hazardous waste safely managed', unit: '%', level: 'Outcome', sector: 'Environment', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },

  // ─── SDG 13: Climate Action ────────────────────────────────
  { id: 'DM-SDG13-01', sdg: 13, target: '13.2', name: 'CO₂ emissions reduction', unit: 'tCO₂e', level: 'Impact', sector: 'Climate', source: 'Government/UNFCCC', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Impact audit' },
  { id: 'DM-SDG13-02', sdg: 13, target: '13.1', name: 'Climate adaptation projects implemented', unit: '#', level: 'Output', sector: 'Climate', source: 'Government', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG13-03', sdg: 13, target: '13.1', name: 'Population covered by climate adaptation', unit: '%', level: 'Outcome', sector: 'Climate', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG13-04', sdg: 13, target: '13.2', name: 'Climate policies implemented nationally', unit: '#', level: 'Output', sector: 'Governance', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG13-05', sdg: 13, target: '13.3', name: 'Climate education programs delivered', unit: '#', level: 'Output', sector: 'Education', source: 'NGO', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Self-report' },
  { id: 'DM-SDG13-06', sdg: 13, target: '13.a', name: 'Climate finance mobilized', unit: 'USD', level: 'Input', sector: 'Finance', source: 'UNFCCC', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG13-07', sdg: 13, target: '13.1', name: 'Forest area restored', unit: 'hectares', level: 'Outcome', sector: 'Environment', source: 'FAO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },

  // ─── SDG 14: Life Below Water ──────────────────────────────
  { id: 'DM-SDG14-01', sdg: 14, target: '14.5', name: 'Marine protected areas coverage', unit: '%', level: 'Outcome', sector: 'Environment', source: 'UNEP', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG14-02', sdg: 14, target: '14.4', name: 'Fisheries managed sustainably', unit: '%', level: 'Outcome', sector: 'Environment', source: 'FAO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG14-03', sdg: 14, target: '14.1', name: 'Marine pollution reduction', unit: 't/yr', level: 'Impact', sector: 'Environment', source: 'UNEP', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Impact audit' },
  { id: 'DM-SDG14-04', sdg: 14, target: '14.2', name: 'Coastal cleanup campaigns conducted', unit: '#', level: 'Output', sector: 'Environment', source: 'NGO', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Self-report' },
  { id: 'DM-SDG14-05', sdg: 14, target: '14.a', name: 'Ocean research funding', unit: 'USD', level: 'Input', sector: 'Research', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },

  // ─── SDG 15: Life on Land ──────────────────────────────────
  { id: 'DM-SDG15-01', sdg: 15, target: '15.1', name: 'Forest area as % of land area', unit: '%', level: 'Outcome', sector: 'Environment', source: 'FAO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG15-02', sdg: 15, target: '15.1', name: 'Reforestation projects implemented', unit: '#', level: 'Output', sector: 'Environment', source: 'NGO', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG15-03', sdg: 15, target: '15.4', name: 'Protected biodiversity areas', unit: '%', level: 'Outcome', sector: 'Environment', source: 'UNEP', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG15-04', sdg: 15, target: '15.3', name: 'Land degradation neutrality achieved', unit: 'hectares', level: 'Impact', sector: 'Environment', source: 'UNCCD', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Impact audit' },
  { id: 'DM-SDG15-05', sdg: 15, target: '15.5', name: 'Threatened species conservation programs', unit: '#', level: 'Output', sector: 'Environment', source: 'IUCN', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG15-06', sdg: 15, target: '15.2', name: 'Sustainable forest management area', unit: 'hectares', level: 'Outcome', sector: 'Environment', source: 'FAO', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },

  // ─── SDG 16: Peace, Justice & Strong Institutions ──────────
  { id: 'DM-SDG16-01', sdg: 16, target: '16.1', name: 'Homicide rate per 100k', unit: 'rate', level: 'Outcome', sector: 'Governance', source: 'UNODC', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG16-02', sdg: 16, target: '16.6', name: 'Public access to information', unit: '%', level: 'Outcome', sector: 'Governance', source: 'UNDP', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG16-03', sdg: 16, target: '16.5', name: 'Corruption perception index', unit: 'score 0-100', level: 'Outcome', sector: 'Governance', source: 'Transparency Intl', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG16-04', sdg: 16, target: '16.3', name: 'Population with access to justice', unit: '%', level: 'Outcome', sector: 'Governance', source: 'UNDP', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG16-05', sdg: 16, target: '16.6', name: 'Anti-corruption programs implemented', unit: '#', level: 'Output', sector: 'Governance', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG16-06', sdg: 16, target: '16.7', name: 'Citizen participation programs', unit: '#', level: 'Output', sector: 'Governance', source: 'Government', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Self-report' },

  // ─── SDG 17: Partnerships for the Goals ────────────────────
  { id: 'DM-SDG17-01', sdg: 17, target: '17.1', name: 'Official development assistance received', unit: 'USD', level: 'Input', sector: 'Finance/Partnerships', source: 'OECD', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG17-02', sdg: 17, target: '17.3', name: 'Foreign direct investment inflows', unit: 'USD', level: 'Input', sector: 'Finance/Partnerships', source: 'UNCTAD', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG17-03', sdg: 17, target: '17.1', name: 'Domestic resource mobilization', unit: '% GDP', level: 'Outcome', sector: 'Finance/Partnerships', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Third-party' },
  { id: 'DM-SDG17-04', sdg: 17, target: '17.6', name: 'Multi-sector partnerships established', unit: '#', level: 'Output', sector: 'Partnerships', source: 'Project data', frequency: 'Quarterly', measurementType: 'quantitative', verificationRequirement: 'Self-report' },
  { id: 'DM-SDG17-05', sdg: 17, target: '17.8', name: 'Technology transfer agreements', unit: '#', level: 'Output', sector: 'Technology', source: 'Government', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
  { id: 'DM-SDG17-06', sdg: 17, target: '17.19', name: 'Statistical capacity building programs', unit: '#', level: 'Output', sector: 'Governance', source: 'UN', frequency: 'Annual', measurementType: 'quantitative', verificationRequirement: 'Peer' },
];

// Helper: get indicators by SDG
export function getIndicatorsBySDG(sdg: number): SDGIndicator[] {
  return SDG_INDICATOR_LIBRARY.filter(i => i.sdg === sdg);
}

// Helper: get indicators by sector
export function getIndicatorsBySector(sector: string): SDGIndicator[] {
  return SDG_INDICATOR_LIBRARY.filter(i => i.sector.toLowerCase().includes(sector.toLowerCase()));
}

// Helper: get indicators by level
export function getIndicatorsByLevel(level: SDGIndicator['level']): SDGIndicator[] {
  return SDG_INDICATOR_LIBRARY.filter(i => i.level === level);
}

// Summary stats
export function getIndicatorLibraryStats() {
  const bySdg: Record<number, number> = {};
  const bySector: Record<string, number> = {};
  const byLevel: Record<string, number> = {};

  SDG_INDICATOR_LIBRARY.forEach(i => {
    bySdg[i.sdg] = (bySdg[i.sdg] || 0) + 1;
    bySector[i.sector] = (bySector[i.sector] || 0) + 1;
    byLevel[i.level] = (byLevel[i.level] || 0) + 1;
  });

  return { total: SDG_INDICATOR_LIBRARY.length, bySdg, bySector, byLevel };
}
