-- Fix search_path for new functions
DROP FUNCTION IF EXISTS public.can_access_feature(UUID, TEXT);
DROP FUNCTION IF EXISTS public.get_agenda2063_for_sdg(INTEGER);

-- Recreate with proper search_path
CREATE OR REPLACE FUNCTION public.can_access_feature(
  p_user_id UUID,
  p_feature TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.get_agenda2063_for_sdg(p_sdg_goal INTEGER)
RETURNS TABLE (
  aspiration INTEGER,
  goal TEXT,
  description TEXT,
  data_source TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
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
$$;