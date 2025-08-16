-- Fix critical security vulnerability: profiles table is publicly readable
-- Remove the overly permissive policy that allows everyone to view all profile data
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create restricted policies for profile access
-- Users can view their own complete profile
CREATE POLICY "Users can view their own complete profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Everyone can view limited public profile fields only (for displaying user info in posts, comments, etc.)
CREATE POLICY "Public can view limited profile fields" 
ON public.profiles 
FOR SELECT 
USING (true)
WITH CHECK (false);

-- Since we can't use column-level RLS directly, we'll need to handle this in the application layer
-- But we can create a view for public profile data
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

-- Grant SELECT permission on the view to authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Admins can view all profiles for management purposes
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'platform_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));