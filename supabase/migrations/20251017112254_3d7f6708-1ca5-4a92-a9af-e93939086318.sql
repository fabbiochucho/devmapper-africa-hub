-- Step 2b: Add only feature flags (SDG data already exists)
DO $$
BEGIN
  INSERT INTO feature_flags (plan, feature, enabled)
  SELECT * FROM (VALUES
    ('free'::plan_type, 'view_public_projects', true),
    ('free'::plan_type, 'submit_basic_report', true),
    ('free'::plan_type, 'view_sdg_map', true),
    ('lite'::plan_type, 'view_earth_intelligence', true),
    ('lite'::plan_type, 'submit_verified_report', true),
    ('lite'::plan_type, 'access_esg_lite', true),
    ('lite'::plan_type, 'view_agenda2063', true),
    ('pro'::plan_type, 'access_esg_pro', true),
    ('pro'::plan_type, 'benchmark_data', true),
    ('pro'::plan_type, 'export_analytics', true),
    ('pro'::plan_type, 'api_access', true),
    ('pro'::plan_type, 'advanced_earth_intel', true)
  ) AS v(plan, feature, enabled)
  WHERE NOT EXISTS (
    SELECT 1 FROM feature_flags f 
    WHERE f.plan = v.plan AND f.feature = v.feature
  );
END $$;