-- ================================
-- Enhanced Roles, Plans & Agenda 2063 Integration
-- ================================

-- Add plan_type enum if not exists (uses existing values)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_type') THEN
    CREATE TYPE plan_type AS ENUM ('free', 'lite', 'pro');
  END IF;
END $$;

-- Enhance organizations table with plan tracking
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan_type plan_type DEFAULT 'free';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS feature_flags JSONB DEFAULT '{}';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMP WITH TIME ZONE;

-- Feature flags table for plan-based access control
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan plan_type NOT NULL,
  feature TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(plan, feature)
);

-- Insert feature flag definitions
INSERT INTO feature_flags (plan, feature, enabled) VALUES
  ('free', 'view_map', TRUE),
  ('free', 'submit_report', TRUE),
  ('free', 'view_sdg_indicators', TRUE),
  ('free', 'comment_on_projects', TRUE),
  ('lite', 'esg_lite_dashboard', TRUE),
  ('lite', 'esg_lite_form', TRUE),
  ('lite', 'limited_earth_intelligence', TRUE),
  ('lite', 'sdg_agenda_linkage', TRUE),
  ('pro', 'esg_pro_dashboard', TRUE),
  ('pro', 'esg_pro_analytics', TRUE),
  ('pro', 'export_reports', TRUE),
  ('pro', 'full_earth_intelligence', TRUE),
  ('pro', 'benchmark_against_peers', TRUE),
  ('pro', 'api_access', TRUE)
ON CONFLICT (plan, feature) DO NOTHING;

-- Agenda 2063 linkage table
CREATE TABLE IF NOT EXISTS agenda2063_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sdg_goal INTEGER NOT NULL CHECK (sdg_goal >= 1 AND sdg_goal <= 17),
  sdg_target TEXT NOT NULL,
  agenda_aspiration INTEGER NOT NULL CHECK (agenda_aspiration >= 1 AND agenda_aspiration <= 7),
  agenda_goal TEXT NOT NULL,
  alignment_description TEXT NOT NULL,
  indicator_code TEXT,
  data_source TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sdg_goal, sdg_target, agenda_aspiration)
);

-- Insert Agenda 2063 × SDG alignment data
INSERT INTO agenda2063_links (sdg_goal, sdg_target, agenda_aspiration, agenda_goal, alignment_description, data_source) VALUES
  (1, '1.1', 1, 'Prosperous Africa', 'Ending poverty aligns with Agenda 2063''s goal of shared prosperity and improved livelihoods', 'World Bank Poverty Data, AfDB'),
  (1, '1.2', 1, 'Prosperous Africa', 'Reducing poverty by half supports Africa''s economic transformation goals', 'World Bank, UNDP'),
  (2, '2.1', 1, 'Agricultural Productivity', 'Zero hunger directly supports agricultural transformation and food security', 'FAO, GEE NDVI'),
  (2, '2.3', 1, 'Agricultural Productivity', 'Doubling agricultural productivity aligns with Agenda 2063 agricultural revolution', 'FAO, AfDB'),
  (3, '3.1', 1, 'Healthy Citizens', 'Reducing maternal mortality supports Africa''s human capital development', 'WHO GHO, DHIS2'),
  (3, '3.2', 1, 'Healthy Citizens', 'Ending preventable child deaths is core to Africa''s demographic dividend goals', 'WHO, UNICEF'),
  (4, '4.1', 1, 'Quality Education', 'Universal primary education underpins skills-driven development', 'UNESCO UIS'),
  (4, '4.3', 1, 'Skills Development', 'Access to technical and vocational education builds Africa''s workforce', 'UNESCO, TVET'),
  (5, '5.1', 6, 'Gender Equality', 'Eliminating discrimination aligns with people-driven development', 'UN Women, AUDA-NEPAD'),
  (5, '5.5', 6, 'Women''s Leadership', 'Women''s full participation in leadership supports inclusive governance', 'AU Gender Observatory'),
  (6, '6.1', 1, 'Water Access', 'Universal safe water access supports prosperous and healthy Africa', 'WHO/UNICEF JMP, GEE'),
  (6, '6.4', 1, 'Water Sustainability', 'Water efficiency aligns with environmental sustainability goals', 'FAO AQUASTAT, Copernicus'),
  (7, '7.1', 1, 'Energy Access', 'Universal energy access drives industrialization and prosperity', 'IEA, World Bank'),
  (7, '7.2', 1, 'Renewable Energy', 'Renewable energy supports Africa''s green growth trajectory', 'IRENA, Climate TRACE'),
  (11, '11.1', 7, 'Sustainable Cities', 'Adequate housing supports Africa''s urbanization goals', 'UN-Habitat'),
  (13, '13.1', 7, 'Climate Resilience', 'Climate resilience is critical for environmentally sustainable Africa', 'Climate TRACE, Copernicus'),
  (13, '13.2', 7, 'Climate Action', 'Climate policies align with Africa''s green economy transformation', 'UNFCCC, AfDB'),
  (16, '16.5', 3, 'Good Governance', 'Reducing corruption supports Africa''s governance transformation', 'Transparency International'),
  (17, '17.9', 3, 'Partnerships', 'Capacity building supports Africa''s global partnership goals', 'OECD DAC')
ON CONFLICT (sdg_goal, sdg_target, agenda_aspiration) DO NOTHING;

-- RLS for feature_flags
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Feature flags are viewable by everyone"
  ON feature_flags FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage feature flags"
  ON feature_flags FOR ALL
  USING (has_role(auth.uid(), 'platform_admin'));

-- RLS for agenda2063_links
ALTER TABLE agenda2063_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agenda 2063 links are viewable by everyone"
  ON agenda2063_links FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage Agenda 2063 links"
  ON agenda2063_links FOR ALL
  USING (has_role(auth.uid(), 'platform_admin'));

-- Function to check if user/org can access a feature
CREATE OR REPLACE FUNCTION public.can_access_feature(
  p_user_id UUID,
  p_feature TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_org_plan plan_type;
BEGIN
  -- Get user's organization plan
  SELECT o.plan_type INTO v_org_plan
  FROM organizations o
  INNER JOIN organization_members om ON o.id = om.organization_id
  WHERE om.user_id = p_user_id
  LIMIT 1;
  
  -- If no org, assume free tier
  IF v_org_plan IS NULL THEN
    v_org_plan := 'free';
  END IF;
  
  -- Check if feature is enabled for this plan
  RETURN EXISTS (
    SELECT 1 FROM feature_flags
    WHERE plan = v_org_plan
    AND feature = p_feature
    AND enabled = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get Agenda 2063 alignment for an SDG
CREATE OR REPLACE FUNCTION public.get_agenda2063_for_sdg(p_sdg_goal INTEGER)
RETURNS TABLE (
  aspiration INTEGER,
  goal TEXT,
  description TEXT,
  data_source TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    a.agenda_aspiration,
    a.agenda_goal,
    a.alignment_description,
    a.data_source
  FROM agenda2063_links a
  WHERE a.sdg_goal = p_sdg_goal
  ORDER BY a.agenda_aspiration;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;