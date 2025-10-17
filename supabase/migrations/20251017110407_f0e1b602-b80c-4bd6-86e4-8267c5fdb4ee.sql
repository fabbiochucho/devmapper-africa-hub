-- Step 1: Add constraint and fix security issues
ALTER TABLE feature_flags DROP CONSTRAINT IF EXISTS feature_flags_plan_feature_key;
ALTER TABLE feature_flags ADD CONSTRAINT feature_flags_plan_feature_key UNIQUE (plan, feature);

-- Fix security definer function
DROP FUNCTION IF EXISTS public.can_access_feature(uuid, text);
CREATE OR REPLACE FUNCTION public.can_access_feature(p_user_id uuid, p_feature text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_org_plan plan_type;
BEGIN
  SELECT o.plan_type INTO v_org_plan
  FROM organizations o
  INNER JOIN organization_members om ON o.id = om.organization_id
  WHERE om.user_id = p_user_id
  LIMIT 1;
  
  IF v_org_plan IS NULL THEN v_org_plan := 'free'; END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM feature_flags
    WHERE plan = v_org_plan AND feature = p_feature AND enabled = TRUE
  );
END;
$$;

-- Fix profiles RLS
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Limited profile data viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Limited profile data viewable by self and admins" ON profiles;
DROP POLICY IF EXISTS "Users view own profile admins view all" ON profiles;
CREATE POLICY "Own profile or admin only"
ON profiles FOR SELECT
USING (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'platform_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Recreate public_profiles view
DROP VIEW IF EXISTS public_profiles CASCADE;
CREATE VIEW public_profiles AS
SELECT id, user_id, full_name, avatar_url, organization, country, is_verified, created_at
FROM profiles;

-- Fix analytics
DROP POLICY IF EXISTS "Users can create their own analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Authenticated users can create analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Authenticated users create analytics" ON analytics_events;
DROP POLICY IF EXISTS "Auth users create analytics" ON analytics_events;
CREATE POLICY "Authenticated only analytics"
ON analytics_events FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_org ON analytics_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_cache_key ON alphaearth_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_org ON alphaearth_cache(organization_id);
CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_changemakers_user ON change_makers(user_id);