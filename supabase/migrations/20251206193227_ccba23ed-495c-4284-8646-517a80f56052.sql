-- Fix public_profiles view with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS SELECT 
  id,
  user_id,
  full_name,
  avatar_url,
  organization,
  country,
  is_verified,
  created_at
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Enable RLS on the view (defense in depth)
ALTER VIEW public.public_profiles SET (security_barrier = true);