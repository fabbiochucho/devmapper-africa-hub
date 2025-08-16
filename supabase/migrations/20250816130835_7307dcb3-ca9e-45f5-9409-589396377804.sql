-- Fix critical security vulnerability: profiles table is publicly readable
-- Remove the overly permissive policy that allows everyone to view all profile data
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Users can view their own complete profile
CREATE POLICY "Users can view their own complete profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can view all profiles for management purposes
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'platform_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Create a secure view for public profile data that only exposes non-sensitive fields
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  user_id,
  full_name,
  avatar_url,
  organization,
  country,
  is_verified,
  created_at
FROM public.profiles;

-- Grant SELECT permission on the public view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;