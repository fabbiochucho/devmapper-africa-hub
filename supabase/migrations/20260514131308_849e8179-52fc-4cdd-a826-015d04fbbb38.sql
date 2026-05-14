
-- 1. Idempotent unique constraints for seed upserts
DO $$ BEGIN
  ALTER TABLE public.reporting_frameworks ADD CONSTRAINT reporting_frameworks_code_key UNIQUE (code);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.framework_indicators ADD CONSTRAINT framework_indicators_fw_code_key UNIQUE (framework_id, indicator_code);
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL; END $$;

-- 2. Emission factors reference library
CREATE TABLE IF NOT EXISTS public.emission_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope SMALLINT NOT NULL CHECK (scope IN (1,2,3)),
  category TEXT NOT NULL,
  activity TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'GLOBAL',
  unit TEXT NOT NULL,
  factor_kgco2e NUMERIC NOT NULL,
  source TEXT NOT NULL,
  source_year INT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT emission_factors_unique UNIQUE (scope, category, activity, region, source)
);

ALTER TABLE public.emission_factors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read emission factors"
  ON public.emission_factors FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage emission factors"
  ON public.emission_factors FOR ALL TO authenticated
  USING (has_role((SELECT auth.uid()),'admin') OR has_role((SELECT auth.uid()),'platform_admin'))
  WITH CHECK (has_role((SELECT auth.uid()),'admin') OR has_role((SELECT auth.uid()),'platform_admin'));

CREATE INDEX IF NOT EXISTS idx_emission_factors_lookup
  ON public.emission_factors(scope, category, region);

-- 3. Contact form submissions
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  user_agent TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact"
  ON public.contact_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Admins read contact submissions"
  ON public.contact_submissions FOR SELECT TO authenticated
  USING (has_role((SELECT auth.uid()),'admin') OR has_role((SELECT auth.uid()),'platform_admin'));

CREATE POLICY "Admins update contact submissions"
  ON public.contact_submissions FOR UPDATE TO authenticated
  USING (has_role((SELECT auth.uid()),'admin') OR has_role((SELECT auth.uid()),'platform_admin'));

-- 4. Seed reporting frameworks
INSERT INTO public.reporting_frameworks (code, name, version, category, is_mandatory, applicable_regions) VALUES
  ('GRI',     'Global Reporting Initiative Standards', '2021', 'Sustainability', false, ARRAY['GLOBAL']),
  ('CDP',     'Carbon Disclosure Project',             '2024', 'Climate',        false, ARRAY['GLOBAL']),
  ('CSRD',    'Corporate Sustainability Reporting Directive (ESRS)', '2024', 'Sustainability', true, ARRAY['EU']),
  ('SBTi',    'Science Based Targets initiative',      '2024', 'Climate Targets',false, ARRAY['GLOBAL']),
  ('TCFD',    'Task Force on Climate-related Financial Disclosures', '2017', 'Climate Risk', false, ARRAY['GLOBAL']),
  ('IFRS-S1', 'IFRS S1 General Sustainability Disclosures', '2023', 'Financial', true, ARRAY['GLOBAL']),
  ('IFRS-S2', 'IFRS S2 Climate-related Disclosures',   '2023', 'Climate',        true, ARRAY['GLOBAL']),
  ('NG-FRC-SRG1','Nigeria FRC Sustainability Reporting Guideline 1', '2023','Sustainability', true, ARRAY['NG'])
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name, version = EXCLUDED.version, category = EXCLUDED.category;

-- 5. Seed framework indicators (core subset)
WITH fw AS (SELECT id, code FROM public.reporting_frameworks)
INSERT INTO public.framework_indicators (framework_id, indicator_code, indicator_name, description, unit_of_measure, sdg_alignment, metric_key)
SELECT fw.id, i.indicator_code, i.indicator_name, i.description, i.unit_of_measure, i.sdg_alignment, i.metric_key
FROM (VALUES
  ('GRI', 'GRI 305-1', 'Direct (Scope 1) GHG emissions',                    'Gross direct GHG emissions in metric tons of CO2 equivalent', 'tCO2e', ARRAY[13],     'carbon_scope1_tonnes'),
  ('GRI', 'GRI 305-2', 'Energy indirect (Scope 2) GHG emissions',           'Gross location/market-based Scope 2 emissions',               'tCO2e', ARRAY[13,7],   'carbon_scope2_tonnes'),
  ('GRI', 'GRI 305-3', 'Other indirect (Scope 3) GHG emissions',            'Gross other indirect emissions across value chain',           'tCO2e', ARRAY[13,12],  'carbon_scope3_tonnes'),
  ('GRI', 'GRI 303-3', 'Water withdrawal',                                  'Total water withdrawal by source',                            'megaliters', ARRAY[6], 'water_withdrawal_ml'),
  ('GRI', 'GRI 306-3', 'Waste generated',                                   'Total weight of waste generated',                             'tonnes', ARRAY[12],   'waste_generated_tonnes'),
  ('GRI', 'GRI 302-1', 'Energy consumption within the organization',        'Total fuel + electricity consumption',                        'GJ',    ARRAY[7],     'energy_consumption_gj'),
  ('GRI', 'GRI 401-1', 'New employee hires and employee turnover',          'Workforce composition and turnover',                          'count', ARRAY[8],     'employee_turnover'),
  ('CDP', 'CDP-C6.1',  'Scope 1 emissions data',                            'Reported Scope 1 emissions',                                  'tCO2e', ARRAY[13],     'carbon_scope1_tonnes'),
  ('CDP', 'CDP-C6.3',  'Scope 2 emissions (location-based)',                'Location-based Scope 2 emissions',                            'tCO2e', ARRAY[13],     'carbon_scope2_tonnes'),
  ('CDP', 'CDP-C6.5',  'Scope 3 emissions by category',                     '15 Scope 3 categories',                                       'tCO2e', ARRAY[13,12],  'carbon_scope3_tonnes'),
  ('CDP', 'CDP-C8.2',  'Energy consumption',                                'Energy mix and intensity',                                    'MWh',   ARRAY[7],     'energy_consumption_mwh'),
  ('CDP', 'CDP-W1.2',  'Water withdrawals & discharges',                    'Operational water data',                                      'megaliters', ARRAY[6], 'water_withdrawal_ml'),
  ('CSRD','ESRS-E1-6', 'Gross Scopes 1, 2, 3 and Total GHG emissions',     'CSRD-mandated GHG disclosure',                                'tCO2e', ARRAY[13],     'carbon_total_tonnes'),
  ('CSRD','ESRS-E1-5', 'Energy consumption and mix',                        'Renewable vs non-renewable mix',                              'MWh',   ARRAY[7],     'renewable_energy_percentage'),
  ('CSRD','ESRS-E3-4', 'Water consumption',                                 'Total water consumption in net areas',                        'megaliters', ARRAY[6], 'water_consumption_ml'),
  ('CSRD','ESRS-E5-5', 'Resource outflows / waste',                         'Waste streams and circularity',                               'tonnes', ARRAY[12],   'waste_generated_tonnes'),
  ('CSRD','ESRS-S1-6', 'Characteristics of the undertaking employees',      'Workforce headcount and diversity',                           'count', ARRAY[5,8],   'workforce_total'),
  ('SBTi','SBTi-NZ-1', 'Near-term Scope 1+2 reduction target',              'Min 4.2% linear annual reduction (1.5C aligned)',             '% reduction', ARRAY[13], 'sbti_near_term_target'),
  ('SBTi','SBTi-NZ-2', 'Long-term net-zero target',                         '90% absolute reduction by 2050 (FLAG: 72%)',                  '% reduction', ARRAY[13], 'sbti_long_term_target'),
  ('SBTi','SBTi-S3',   'Scope 3 ambition',                                  'Required if Scope 3 > 40% of total',                          'tCO2e', ARRAY[13,12],  'carbon_scope3_tonnes'),
  ('TCFD','TCFD-G',    'Governance disclosures',                            'Board oversight + management role',                           'narrative', NULL,      'tcfd_governance'),
  ('TCFD','TCFD-S',    'Strategy: climate scenario analysis',               '1.5C / 2C / 4C scenarios',                                    'narrative', ARRAY[13], 'tcfd_strategy'),
  ('TCFD','TCFD-RM',   'Risk management',                                   'Identify, assess, manage climate risks',                      'narrative', ARRAY[13], 'tcfd_risk_mgmt'),
  ('TCFD','TCFD-MT',   'Metrics & targets',                                 'Cross-industry metrics, Scope 1/2/3, internal carbon price',  'mixed',     ARRAY[13], 'tcfd_metrics_targets'),
  ('IFRS-S1','S1-G',   'Governance of sustainability risks',                'Body responsible for oversight',                              'narrative', NULL,      'ifrs_governance'),
  ('IFRS-S1','S1-S',   'Strategy & business model impact',                  'Material sustainability matters',                             'narrative', NULL,      'ifrs_strategy'),
  ('IFRS-S1','S1-RM',  'Risk management process',                           'Process for identifying sustainability risks',                'narrative', NULL,      'ifrs_risk_mgmt'),
  ('IFRS-S1','S1-M',   'Metrics & targets',                                 'Industry & cross-industry metrics',                           'mixed',     NULL,      'ifrs_metrics'),
  ('IFRS-S2','S2-1',   'Scope 1 GHG emissions (gross)',                     'GHG Protocol-aligned',                                        'tCO2e', ARRAY[13],     'carbon_scope1_tonnes'),
  ('IFRS-S2','S2-2',   'Scope 2 GHG emissions (gross)',                     'Location-based + market-based',                               'tCO2e', ARRAY[13],     'carbon_scope2_tonnes'),
  ('IFRS-S2','S2-3',   'Scope 3 GHG emissions',                             '15 categories where material',                                'tCO2e', ARRAY[13,12],  'carbon_scope3_tonnes'),
  ('IFRS-S2','S2-4',   'Climate-related transition risks',                  'Quantified financial impact',                                 'currency',ARRAY[13],   'transition_risk_value'),
  ('IFRS-S2','S2-5',   'Climate-related physical risks',                    'Acute + chronic physical exposure',                           'currency',ARRAY[13],   'physical_risk_value'),
  ('NG-FRC-SRG1','SRG1-1','Sustainability governance',                       'Board oversight of ESG',                                      'narrative', NULL,      'ng_governance'),
  ('NG-FRC-SRG1','SRG1-2','Climate-related financial disclosures',           'IFRS S2-aligned',                                             'mixed',     ARRAY[13], 'carbon_total_tonnes'),
  ('NG-FRC-SRG1','SRG1-3','Local content & community impact',                'Nigerian local content reporting',                            'narrative', ARRAY[8],  'ng_local_content')
) AS i(fw_code, indicator_code, indicator_name, description, unit_of_measure, sdg_alignment, metric_key)
JOIN fw ON fw.code = i.fw_code
ON CONFLICT (framework_id, indicator_code) DO UPDATE SET
  indicator_name = EXCLUDED.indicator_name,
  description    = EXCLUDED.description,
  unit_of_measure= EXCLUDED.unit_of_measure,
  sdg_alignment  = EXCLUDED.sdg_alignment,
  metric_key     = EXCLUDED.metric_key;

-- 6. Seed emission factors (starter library — DEFRA 2024 / IEA 2024 / IPCC AR6)
INSERT INTO public.emission_factors (scope, category, activity, region, unit, factor_kgco2e, source, source_year, notes) VALUES
  (1,'stationary_combustion','natural_gas',          'GLOBAL','kWh',     0.18316, 'DEFRA',         2024, NULL),
  (1,'stationary_combustion','diesel',               'GLOBAL','litre',   2.68779, 'DEFRA',         2024, NULL),
  (1,'stationary_combustion','lpg',                  'GLOBAL','litre',   1.55713, 'DEFRA',         2024, NULL),
  (1,'stationary_combustion','coal_industrial',      'GLOBAL','tonne',   2433.0,  'IPCC AR6',      2023, NULL),
  (1,'mobile_combustion','petrol_car_avg',           'GLOBAL','km',      0.17034, 'DEFRA',         2024, NULL),
  (1,'mobile_combustion','diesel_car_avg',           'GLOBAL','km',      0.16844, 'DEFRA',         2024, NULL),
  (1,'mobile_combustion','diesel_van',               'GLOBAL','km',      0.25316, 'DEFRA',         2024, NULL),
  (1,'mobile_combustion','heavy_truck',              'GLOBAL','km',      0.94300, 'DEFRA',         2024, NULL),
  (1,'fugitive','refrigerant_r410a',                 'GLOBAL','kg',      2088.0,  'IPCC AR6',      2023, 'GWP100'),
  (1,'fugitive','refrigerant_r134a',                 'GLOBAL','kg',      1430.0,  'IPCC AR6',      2023, 'GWP100'),
  (2,'electricity','grid_consumption',               'NG',    'kWh',     0.439,   'IEA',           2024, 'Nigeria grid mix'),
  (2,'electricity','grid_consumption',               'KE',    'kWh',     0.108,   'IEA',           2024, 'Kenya grid (high renewables)'),
  (2,'electricity','grid_consumption',               'ZA',    'kWh',     0.928,   'IEA',           2024, 'South Africa coal-heavy'),
  (2,'electricity','grid_consumption',               'EG',    'kWh',     0.470,   'IEA',           2024, NULL),
  (2,'electricity','grid_consumption',               'GH',    'kWh',     0.408,   'IEA',           2024, NULL),
  (2,'electricity','grid_consumption',               'MA',    'kWh',     0.708,   'IEA',           2024, NULL),
  (2,'electricity','grid_consumption',               'ET',    'kWh',     0.025,   'IEA',           2024, 'Hydropower-dominant'),
  (2,'electricity','grid_consumption',               'GLOBAL','kWh',     0.475,   'IEA',           2024, 'Global average fallback'),
  (2,'electricity','grid_consumption',               'EU',    'kWh',     0.249,   'EEA',           2024, NULL),
  (2,'electricity','grid_consumption',               'US',    'kWh',     0.371,   'EPA eGRID',     2024, NULL),
  (2,'heat_steam','district_heat',                   'GLOBAL','kWh',     0.170,   'DEFRA',         2024, NULL),
  (3,'cat1_purchased_goods','generic_goods_spend',   'GLOBAL','USD',     0.450,   'EXIOBASE',      2023, 'Spend-based avg'),
  (3,'cat3_fuel_energy','well_to_tank_diesel',       'GLOBAL','litre',   0.61130, 'DEFRA',         2024, NULL),
  (3,'cat4_upstream_transport','road_freight_avg',   'GLOBAL','tonne_km',0.10570, 'DEFRA',         2024, NULL),
  (3,'cat4_upstream_transport','sea_freight_container','GLOBAL','tonne_km',0.01614,'DEFRA',        2024, NULL),
  (3,'cat4_upstream_transport','air_freight_long',   'GLOBAL','tonne_km',0.55400, 'DEFRA',         2024, NULL),
  (3,'cat5_waste','landfill_mixed',                  'GLOBAL','tonne',   458.0,   'DEFRA',         2024, NULL),
  (3,'cat5_waste','recycling_mixed',                 'GLOBAL','tonne',   21.3,    'DEFRA',         2024, NULL),
  (3,'cat6_business_travel','flight_short_haul_eco', 'GLOBAL','passenger_km',0.15102,'DEFRA',      2024, NULL),
  (3,'cat6_business_travel','flight_long_haul_eco',  'GLOBAL','passenger_km',0.14795,'DEFRA',      2024, NULL),
  (3,'cat6_business_travel','hotel_stay_avg',        'GLOBAL','room_night', 12.2, 'Cornell HSI',   2024, NULL),
  (3,'cat7_employee_commute','car_avg',              'GLOBAL','km',      0.17046, 'DEFRA',         2024, NULL),
  (3,'cat7_employee_commute','public_bus',           'GLOBAL','passenger_km',0.10312,'DEFRA',      2024, NULL),
  (3,'cat7_employee_commute','rail',                 'GLOBAL','passenger_km',0.03546,'DEFRA',      2024, NULL)
ON CONFLICT (scope, category, activity, region, source) DO UPDATE SET
  factor_kgco2e = EXCLUDED.factor_kgco2e,
  source_year   = EXCLUDED.source_year,
  notes         = EXCLUDED.notes;
