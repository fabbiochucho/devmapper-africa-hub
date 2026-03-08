
-- Fix assign_test_role search_path
DROP FUNCTION IF EXISTS public.assign_test_role(uuid, app_role, text, text);

CREATE FUNCTION public.assign_test_role(
  p_user_id uuid,
  p_role app_role,
  p_country text DEFAULT NULL,
  p_organization text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_roles (user_id, role, country, organization, granted_by)
  VALUES (p_user_id, p_role, p_country, p_organization, auth.uid())
  ON CONFLICT (user_id, role) DO UPDATE SET
    country = EXCLUDED.country,
    organization = EXCLUDED.organization,
    is_active = true;
  RETURN 'ok';
END;
$$;
