-- Create test account roles function (for development/testing only)
-- This function allows admins to assign roles to test accounts

-- First, create a function to assign multiple roles to a user
CREATE OR REPLACE FUNCTION public.assign_test_role(
  p_user_id UUID,
  p_role app_role,
  p_organization TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_id UUID;
BEGIN
  -- Check if role already exists for user
  SELECT id INTO v_role_id
  FROM public.user_roles
  WHERE user_id = p_user_id AND role = p_role;
  
  IF v_role_id IS NOT NULL THEN
    -- Update existing role
    UPDATE public.user_roles
    SET is_active = true,
        organization = COALESCE(p_organization, organization),
        country = COALESCE(p_country, country)
    WHERE id = v_role_id;
    RETURN v_role_id;
  ELSE
    -- Insert new role
    INSERT INTO public.user_roles (user_id, role, organization, country, is_active)
    VALUES (p_user_id, p_role, p_organization, p_country, true)
    RETURNING id INTO v_role_id;
    RETURN v_role_id;
  END IF;
END;
$$;

-- Create a view for test accounts (for admin visibility)
CREATE OR REPLACE VIEW public.test_accounts_view AS
SELECT 
  p.user_id,
  p.email,
  p.full_name,
  array_agg(DISTINCT ur.role) as roles,
  array_agg(DISTINCT ur.organization) FILTER (WHERE ur.organization IS NOT NULL) as organizations,
  array_agg(DISTINCT ur.country) FILTER (WHERE ur.country IS NOT NULL) as countries
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id AND ur.is_active = true
WHERE p.email LIKE '%@test.devmapper.%' OR p.email LIKE '%+test%'
GROUP BY p.user_id, p.email, p.full_name;

-- Grant access to the function for authenticated users (admins will use this)
GRANT EXECUTE ON FUNCTION public.assign_test_role TO authenticated;

-- Add RLS policy for the view
-- Only admins can see test accounts
CREATE POLICY "Admins can view test accounts"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'platform_admin') OR
  user_id = auth.uid()
);