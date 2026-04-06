INSERT INTO reporting_frameworks (code, name, version, category, is_mandatory, applicable_regions) VALUES
  ('GRI', 'GRI Universal Standards', '2021', 'sustainability', false, ARRAY['global']),
  ('GRI-200', 'GRI Economic Standards', '2016', 'economic', false, ARRAY['global']),
  ('GRI-300', 'GRI Environmental Standards', '2016', 'environmental', false, ARRAY['global']),
  ('GRI-400', 'GRI Social Standards', '2016', 'social', false, ARRAY['global']),
  ('CDP', 'CDP Climate Change', '2023', 'climate', false, ARRAY['global']),
  ('IFRS-S1', 'IFRS S1 General Sustainability', '2023', 'sustainability', true, ARRAY['global', 'NG']),
  ('IFRS-S2', 'IFRS S2 Climate-related Disclosures', '2023', 'climate', true, ARRAY['global', 'NG']),
  ('CSRD', 'Corporate Sustainability Reporting Directive', '2024', 'sustainability', true, ARRAY['EU']),
  ('SRG1', 'Nigeria FRC Sustainability Reporting Guideline', '2026', 'sustainability', true, ARRAY['NG'])
ON CONFLICT DO NOTHING;

INSERT INTO framework_indicators (framework_id, indicator_code, indicator_name, description, unit_of_measure, sdg_alignment, metric_key)
SELECT rf.id, v.code, v.name, v.description, v.unit, v.sdgs, v.metric
FROM reporting_frameworks rf
JOIN (VALUES
  ('GRI', '302-1', 'Energy consumption within the organization', 'Total energy consumption', 'kWh', ARRAY[7,13], 'energy_consumption_kwh'),
  ('GRI', '303-3', 'Water withdrawal', 'Total water withdrawal by source', 'm³', ARRAY[6], 'water_consumption_m3'),
  ('GRI', '305-1', 'Direct GHG emissions (Scope 1)', 'Gross direct GHG emissions', 'tCO2e', ARRAY[13], 'carbon_scope1_tonnes'),
  ('GRI', '305-2', 'Energy indirect GHG emissions (Scope 2)', 'Gross energy indirect GHG emissions', 'tCO2e', ARRAY[13], 'carbon_scope2_tonnes'),
  ('GRI', '305-3', 'Other indirect GHG emissions (Scope 3)', 'Gross other indirect GHG emissions', 'tCO2e', ARRAY[13], 'carbon_scope3_tonnes'),
  ('GRI', '306-3', 'Waste generated', 'Total weight of waste generated', 'tonnes', ARRAY[12], 'waste_generated_tonnes'),
  ('GRI', '413-1', 'Community engagement', 'Operations with community engagement programs', 'USD', ARRAY[11], 'community_investment'),
  ('IFRS-S2', 'E1-1', 'Gross Scope 1 GHG emissions', 'Total Scope 1 greenhouse gas emissions', 'tCO2e', ARRAY[13], 'carbon_scope1_tonnes'),
  ('IFRS-S2', 'E1-2', 'Gross Scope 2 GHG emissions', 'Total Scope 2 greenhouse gas emissions', 'tCO2e', ARRAY[13], 'carbon_scope2_tonnes'),
  ('IFRS-S2', 'E1-3', 'Gross Scope 3 GHG emissions', 'Total Scope 3 greenhouse gas emissions', 'tCO2e', ARRAY[13], 'carbon_scope3_tonnes'),
  ('CDP', 'C6.1', 'Scope 1 emissions', 'Gross global Scope 1 emissions', 'tCO2e', ARRAY[13], 'carbon_scope1_tonnes'),
  ('CDP', 'C6.3', 'Scope 2 emissions', 'Gross global Scope 2 emissions', 'tCO2e', ARRAY[13], 'carbon_scope2_tonnes'),
  ('CDP', 'C6.5', 'Scope 3 emissions', 'Gross global Scope 3 emissions', 'tCO2e', ARRAY[13], 'carbon_scope3_tonnes'),
  ('SRG1', 'SRG-E1', 'Energy consumption', 'Total energy consumed within reporting boundary', 'kWh', ARRAY[7], 'energy_consumption_kwh'),
  ('SRG1', 'SRG-E2', 'GHG emissions', 'Total GHG emissions (Scope 1, 2, 3)', 'tCO2e', ARRAY[13], 'carbon_scope1_tonnes'),
  ('SRG1', 'SRG-W1', 'Water usage', 'Total water consumed', 'm³', ARRAY[6], 'water_consumption_m3')
) AS v(fw_code, code, name, description, unit, sdgs, metric) ON rf.code = v.fw_code;