
-- 1. Add 'advanced' and 'enterprise' to plan_type enum
ALTER TYPE public.plan_type ADD VALUE IF NOT EXISTS 'advanced';
ALTER TYPE public.plan_type ADD VALUE IF NOT EXISTS 'enterprise';

-- 2. Add quota and scholarship columns to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS scholarship_override text,
  ADD COLUMN IF NOT EXISTS project_quota_remaining integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS project_cap integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS monthly_addition integer DEFAULT 3,
  ADD COLUMN IF NOT EXISTS rollover_allowed boolean DEFAULT false;

-- 3. Create scholarships table
CREATE TABLE IF NOT EXISTS public.scholarships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  requested_plan text NOT NULL DEFAULT 'pro',
  justification text NOT NULL,
  organization_name text,
  role text,
  country text,
  use_case text,
  duration_months integer DEFAULT 6,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid,
  approved_at timestamptz,
  expires_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on scholarships
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;

-- Scholarships RLS policies
CREATE POLICY "Users can view their own scholarships"
  ON public.scholarships FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all scholarships"
  ON public.scholarships FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "Users can insert their own scholarship applications"
  ON public.scholarships FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update scholarships"
  ON public.scholarships FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role));

-- 4. Create plan_features table for granular feature matrix
CREATE TABLE IF NOT EXISTS public.plan_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan text NOT NULL,
  feature_key text NOT NULL,
  enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS plan_features_unique ON public.plan_features(plan, feature_key);

ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plan features are viewable by everyone"
  ON public.plan_features FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage plan features"
  ON public.plan_features FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'platform_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'platform_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 5. Create reset_monthly_quotas function for pg_cron
CREATE OR REPLACE FUNCTION public.reset_monthly_quotas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org RECORD;
  effective_plan text;
  quota_add integer;
  cap integer;
BEGIN
  FOR org IN SELECT id, plan_type, scholarship_override, project_quota_remaining, project_cap, rollover_allowed FROM organizations
  LOOP
    effective_plan := COALESCE(org.scholarship_override, org.plan_type);
    
    quota_add := CASE effective_plan
      WHEN 'free' THEN 3
      WHEN 'lite' THEN 3
      WHEN 'pro' THEN 5
      WHEN 'advanced' THEN 15
      WHEN 'enterprise' THEN 9999
      ELSE 3
    END;
    
    cap := CASE effective_plan
      WHEN 'free' THEN 10
      WHEN 'lite' THEN 10
      WHEN 'pro' THEN 40
      WHEN 'advanced' THEN 150
      WHEN 'enterprise' THEN 999999
      ELSE 10
    END;

    IF org.rollover_allowed OR effective_plan IN ('pro', 'advanced', 'enterprise') THEN
      -- Rollover: add to existing, cap at max
      UPDATE organizations SET
        project_quota_remaining = LEAST(org.project_quota_remaining + quota_add, cap),
        project_cap = cap,
        monthly_addition = quota_add
      WHERE id = org.id;
    ELSE
      -- No rollover: reset to monthly addition
      UPDATE organizations SET
        project_quota_remaining = quota_add,
        project_cap = cap,
        monthly_addition = quota_add
      WHERE id = org.id;
    END IF;
  END LOOP;
END;
$$;

-- 6. Function to check and enforce quota before project creation
CREATE OR REPLACE FUNCTION public.check_project_quota(p_org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining integer;
BEGIN
  SELECT project_quota_remaining INTO remaining
  FROM organizations
  WHERE id = p_org_id;
  
  IF remaining IS NULL OR remaining <= 0 THEN
    RETURN false;
  END IF;
  
  -- Decrement quota
  UPDATE organizations
  SET project_quota_remaining = project_quota_remaining - 1
  WHERE id = p_org_id AND project_quota_remaining > 0;
  
  RETURN FOUND;
END;
$$;

-- 7. Function to get effective plan (respects scholarship override + expiry)
CREATE OR REPLACE FUNCTION public.get_effective_plan(p_org_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_record RECORD;
  scholarship_record RECORD;
BEGIN
  SELECT plan_type, scholarship_override INTO org_record
  FROM organizations WHERE id = p_org_id;
  
  IF org_record.scholarship_override IS NOT NULL THEN
    -- Check if there's an active, non-expired scholarship
    SELECT * INTO scholarship_record
    FROM scholarships
    WHERE org_id = p_org_id
      AND status = 'approved'
      AND (expires_at IS NULL OR expires_at >= CURRENT_DATE)
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF scholarship_record IS NOT NULL THEN
      RETURN org_record.scholarship_override;
    ELSE
      -- Scholarship expired, revert
      UPDATE organizations SET scholarship_override = NULL WHERE id = p_org_id;
      RETURN org_record.plan_type;
    END IF;
  END IF;
  
  RETURN COALESCE(org_record.plan_type, 'lite');
END;
$$;
