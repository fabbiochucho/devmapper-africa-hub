-- Fix: Allow all authenticated users to read profiles (needed for Forum authors, Message participants, user search)
-- Profile data (name, avatar, country, org) is non-sensitive public info
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Drop the overly restrictive policies that are now redundant
DROP POLICY IF EXISTS "Own profile or admin only" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own complete profile" ON public.profiles;