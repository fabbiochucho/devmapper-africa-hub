-- Fix: Restrict profiles SELECT to own profile + admins only
-- Other users should use the public_profiles view for non-sensitive data

DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Own profile or admin only" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own complete profile" ON public.profiles;

-- Users can view their own profile (all fields)
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

-- Admins can view all profiles for management
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role((SELECT auth.uid()), 'platform_admin'::app_role)
  OR public.has_role((SELECT auth.uid()), 'admin'::app_role)
);