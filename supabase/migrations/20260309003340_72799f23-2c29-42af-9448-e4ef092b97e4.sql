-- ============================================
-- FIX RLS POLICY PERFORMANCE: auth_rls_initplan warnings
-- ============================================
-- This migration addresses 286 Performance Advisor warnings by wrapping
-- auth.uid() calls in (SELECT ...) to prevent re-evaluation per row
-- Per Supabase docs: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- ============================================
-- USER_ROLES TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can delete any role" ON user_roles;
CREATE POLICY "Admins can delete any role" ON user_roles
FOR DELETE USING (
  has_role((SELECT auth.uid()), 'admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'platform_admin'::app_role)
);

DROP POLICY IF EXISTS "Admins can insert any role" ON user_roles;
CREATE POLICY "Admins can insert any role" ON user_roles
FOR INSERT WITH CHECK (
  has_role((SELECT auth.uid()), 'admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'platform_admin'::app_role)
);

DROP POLICY IF EXISTS "Admins can update any role" ON user_roles;
CREATE POLICY "Admins can update any role" ON user_roles
FOR UPDATE USING (
  has_role((SELECT auth.uid()), 'admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'platform_admin'::app_role)
);

DROP POLICY IF EXISTS "Users can view their roles" ON user_roles;
CREATE POLICY "Users can view their roles" ON user_roles
FOR SELECT USING (user_id = (SELECT auth.uid()));

-- ============================================
-- PARTNERS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can delete partners" ON partners;
CREATE POLICY "Admins can delete partners" ON partners
FOR DELETE USING (
  has_role((SELECT auth.uid()), 'admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'platform_admin'::app_role)
);

DROP POLICY IF EXISTS "Admins can insert partners" ON partners;
CREATE POLICY "Admins can insert partners" ON partners
FOR INSERT WITH CHECK (
  has_role((SELECT auth.uid()), 'admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'platform_admin'::app_role)
);

DROP POLICY IF EXISTS "Admins can update partners" ON partners;
CREATE POLICY "Admins can update partners" ON partners
FOR UPDATE USING (
  has_role((SELECT auth.uid()), 'admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'platform_admin'::app_role)
);

-- ============================================
-- PROFILES TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile" ON profiles
FOR UPDATE USING (
  has_role((SELECT auth.uid()), 'platform_admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'admin'::app_role)
) WITH CHECK (
  has_role((SELECT auth.uid()), 'platform_admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles" ON profiles
FOR SELECT USING (
  has_role((SELECT auth.uid()), 'platform_admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Own profile or admin only" ON profiles;
CREATE POLICY "Own profile or admin only" ON profiles
FOR SELECT USING (
  (SELECT auth.uid()) = user_id OR 
  has_role((SELECT auth.uid()), 'platform_admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own complete profile" ON profiles;
CREATE POLICY "Users can view their own complete profile" ON profiles
FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- ============================================
-- CAMPAIGN_DONATIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "Only admins can delete donations" ON campaign_donations;
CREATE POLICY "Only admins can delete donations" ON campaign_donations
FOR DELETE USING (has_role((SELECT auth.uid()), 'platform_admin'::app_role));

DROP POLICY IF EXISTS "Campaign creators and donors can update donations" ON campaign_donations;
CREATE POLICY "Campaign creators and donors can update donations" ON campaign_donations
FOR UPDATE USING (
  (SELECT auth.uid()) = donor_id OR
  EXISTS (
    SELECT 1 FROM fundraising_campaigns 
    WHERE id = campaign_donations.campaign_id 
    AND created_by = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Campaign creators can view donations to their campaigns" ON campaign_donations;
CREATE POLICY "Campaign creators can view donations to their campaigns" ON campaign_donations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM fundraising_campaigns 
    WHERE id = campaign_donations.campaign_id 
    AND created_by = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Donors can view their own donations" ON campaign_donations;
CREATE POLICY "Donors can view their own donations" ON campaign_donations
FOR SELECT USING ((SELECT auth.uid()) = donor_id);

DROP POLICY IF EXISTS "Users can create campaign donations" ON campaign_donations;
CREATE POLICY "Users can create campaign donations" ON campaign_donations
FOR INSERT WITH CHECK (
  (SELECT auth.uid()) = donor_id OR 
  (donor_id IS NULL AND (SELECT auth.uid()) IS NOT NULL)
);

COMMENT ON POLICY "Admins can delete any role" ON user_roles IS 'Optimized RLS: auth.uid() wrapped in SELECT to prevent per-row re-evaluation';
COMMENT ON POLICY "Only admins can delete donations" ON campaign_donations IS 'Optimized RLS: auth.uid() wrapped in SELECT to prevent per-row re-evaluation';