-- Create assign_test_role function for admin test account management
CREATE OR REPLACE FUNCTION public.assign_test_role(
  p_user_id uuid,
  p_role app_role,
  p_organization text DEFAULT NULL,
  p_country text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_id uuid;
  v_admin_id uuid;
BEGIN
  -- Get the calling user's ID
  v_admin_id := auth.uid();
  
  -- Check if caller has admin or platform_admin role
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = v_admin_id 
    AND role IN ('admin', 'platform_admin')
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can assign roles';
  END IF;
  
  -- Check if user already has this role
  SELECT id INTO v_role_id
  FROM user_roles
  WHERE user_id = p_user_id AND role = p_role;
  
  IF v_role_id IS NOT NULL THEN
    -- Update existing role
    UPDATE user_roles
    SET is_active = true,
        organization = COALESCE(p_organization, organization),
        country = COALESCE(p_country, country),
        granted_by = v_admin_id,
        granted_at = now()
    WHERE id = v_role_id;
    
    RETURN v_role_id;
  END IF;
  
  -- Insert new role
  INSERT INTO user_roles (user_id, role, organization, country, granted_by, is_active)
  VALUES (p_user_id, p_role, p_organization, p_country, v_admin_id, true)
  RETURNING id INTO v_role_id;
  
  RETURN v_role_id;
END;
$$;

-- Create get_test_accounts function for admin to view test accounts
CREATE OR REPLACE FUNCTION public.get_test_accounts()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  roles app_role[],
  organizations text[],
  countries text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller has admin or platform_admin role
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'platform_admin')
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can view test accounts';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.user_id,
    p.email,
    p.full_name,
    array_agg(DISTINCT ur.role) as roles,
    array_agg(DISTINCT ur.organization) FILTER (WHERE ur.organization IS NOT NULL) as organizations,
    array_agg(DISTINCT ur.country) FILTER (WHERE ur.country IS NOT NULL) as countries
  FROM profiles p
  LEFT JOIN user_roles ur ON p.user_id = ur.user_id AND ur.is_active = true
  WHERE p.email LIKE '%@test.devmapper.africa'
     OR p.email IN (
       'abiola.oshunniyi@gmail.com',
       'fabbiochucho@gmail.com'
     )
  GROUP BY p.user_id, p.email, p.full_name;
END;
$$;

-- Create can_access_feature function for plan-based feature gating
CREATE OR REPLACE FUNCTION public.can_access_feature(p_user_id uuid, p_feature text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_type text;
  v_has_access boolean;
BEGIN
  -- Get user's plan type through organization membership
  SELECT o.plan_type INTO v_plan_type
  FROM organization_members om
  JOIN organizations o ON om.organization_id = o.id
  WHERE om.user_id = p_user_id
  LIMIT 1;
  
  -- Default to 'free' if no organization found
  v_plan_type := COALESCE(v_plan_type, 'free');
  
  -- Check if feature is enabled for the plan
  SELECT enabled INTO v_has_access
  FROM feature_flags
  WHERE plan = v_plan_type::plan_type
  AND feature = p_feature
  AND enabled = true;
  
  RETURN COALESCE(v_has_access, false);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.assign_test_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_test_accounts TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_feature TO authenticated;