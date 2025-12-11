-- Fix security definer view issue by dropping the view and using a secure function instead
DROP VIEW IF EXISTS public.test_accounts_view;

-- Drop the redundant policy that was added
DROP POLICY IF EXISTS "Admins can view test accounts" ON public.profiles;

-- Create a secure function to get test accounts (admin only)
CREATE OR REPLACE FUNCTION public.get_test_accounts()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  roles app_role[],
  organizations TEXT[],
  countries TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow admins to call this function
  IF NOT (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'platform_admin')) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.user_id,
    p.email,
    p.full_name,
    array_agg(DISTINCT ur.role)::app_role[] as roles,
    array_agg(DISTINCT ur.organization) FILTER (WHERE ur.organization IS NOT NULL) as organizations,
    array_agg(DISTINCT ur.country) FILTER (WHERE ur.country IS NOT NULL) as countries
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id AND ur.is_active = true
  WHERE p.email LIKE '%@test.devmapper.%' OR p.email LIKE '%+test%'
  GROUP BY p.user_id, p.email, p.full_name;
END;
$$;