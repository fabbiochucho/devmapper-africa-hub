-- ============================================
-- FIX RLS POLICY PERFORMANCE: Part 2 - Core tables
-- ============================================

-- ============================================
-- SCHOLARSHIPS TABLE (if exists)
-- ============================================
DROP POLICY IF EXISTS "Admins can update scholarships" ON scholarships;
CREATE POLICY "Admins can update scholarships" ON scholarships
FOR UPDATE USING (
  has_role((SELECT auth.uid()), 'admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'platform_admin'::app_role)
);

DROP POLICY IF EXISTS "Admins can view scholarships" ON scholarships;
CREATE POLICY "Admins can view scholarships" ON scholarships
FOR SELECT USING (
  has_role((SELECT auth.uid()), 'admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'platform_admin'::app_role)
);

-- ============================================
-- ANALYTICS_EVENTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can view all analytics events" ON analytics_events;
CREATE POLICY "Admins can view all analytics events" ON analytics_events
FOR SELECT USING (
  has_role((SELECT auth.uid()), 'admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'platform_admin'::app_role)
);

DROP POLICY IF EXISTS "Users can view their own analytics" ON analytics_events;
CREATE POLICY "Users can view their own analytics" ON analytics_events
FOR SELECT USING (user_id = (SELECT auth.uid()));

-- ============================================
-- AUDIT_LOGS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
CREATE POLICY "Admins can view all audit logs" ON audit_logs
FOR SELECT USING (
  has_role((SELECT auth.uid()), 'platform_admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'admin'::app_role)
);

DROP POLICY IF EXISTS "Users can view their organization audit logs" ON audit_logs;
CREATE POLICY "Users can view their organization audit logs" ON audit_logs
FOR SELECT USING (
  org_id IN (
    SELECT id FROM organizations WHERE created_by = (SELECT auth.uid())
  )
);

-- ============================================
-- ENTITY_LOCATIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can view all locations" ON entity_locations;
CREATE POLICY "Admins can view all locations" ON entity_locations
FOR SELECT USING (
  has_role((SELECT auth.uid()), 'admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'platform_admin'::app_role)
);

DROP POLICY IF EXISTS "Users can manage their locations" ON entity_locations;
CREATE POLICY "Users can manage their locations" ON entity_locations
FOR ALL USING (user_id = (SELECT auth.uid()));

-- ============================================
-- VERIFICATION_LOGS TABLE (if exists)
-- ============================================
DROP POLICY IF EXISTS "Users can create verifications" ON verification_logs;
CREATE POLICY "Users can create verifications" ON verification_logs
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view their verifications" ON verification_logs;
CREATE POLICY "Users can view their verifications" ON verification_logs
FOR SELECT USING (user_id = (SELECT auth.uid()));

-- ============================================
-- ORGANIZATIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can create organizations" ON organizations;
CREATE POLICY "Users can create organizations" ON organizations
FOR INSERT WITH CHECK (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their organizations" ON organizations;
CREATE POLICY "Users can update their organizations" ON organizations
FOR UPDATE USING (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
CREATE POLICY "Users can view organizations they belong to" ON organizations
FOR SELECT USING (created_by = (SELECT auth.uid()));

-- ============================================
-- REPORTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Only admins can delete reports" ON reports;
CREATE POLICY "Only admins can delete reports" ON reports
FOR DELETE USING (has_role((SELECT auth.uid()), 'platform_admin'::app_role));

DROP POLICY IF EXISTS "Users can create their own reports" ON reports;
CREATE POLICY "Users can create their own reports" ON reports
FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own reports" ON reports;
CREATE POLICY "Users can update their own reports" ON reports
FOR UPDATE USING ((SELECT auth.uid()) = user_id);

-- ============================================
-- FUNDRAISING_CAMPAIGNS TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can create campaigns" ON fundraising_campaigns;
CREATE POLICY "Users can create campaigns" ON fundraising_campaigns
FOR INSERT WITH CHECK ((SELECT auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can update their own campaigns" ON fundraising_campaigns;
CREATE POLICY "Users can update their own campaigns" ON fundraising_campaigns
FOR UPDATE USING ((SELECT auth.uid()) = created_by);

-- ============================================
-- GOVERNMENT_PROJECTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Government officials can create their own projects" ON government_projects;
CREATE POLICY "Government officials can create their own projects" ON government_projects
FOR INSERT WITH CHECK ((SELECT auth.uid()) = government_id);

DROP POLICY IF EXISTS "Government officials can delete their own projects" ON government_projects;
CREATE POLICY "Government officials can delete their own projects" ON government_projects
FOR DELETE USING ((SELECT auth.uid()) = government_id);

DROP POLICY IF EXISTS "Government officials can update their own projects" ON government_projects;
CREATE POLICY "Government officials can update their own projects" ON government_projects
FOR UPDATE USING ((SELECT auth.uid()) = government_id);

DROP POLICY IF EXISTS "Government users can view their own projects" ON government_projects;
CREATE POLICY "Government users can view their own projects" ON government_projects
FOR SELECT USING ((SELECT auth.uid()) = government_id);

-- ============================================
-- CORPORATE_TARGETS TABLE
-- ============================================
DROP POLICY IF EXISTS "Companies can create targets" ON corporate_targets;
CREATE POLICY "Companies can create targets" ON corporate_targets
FOR INSERT WITH CHECK ((SELECT auth.uid()) = company_id);

DROP POLICY IF EXISTS "Companies can update their own targets" ON corporate_targets;
CREATE POLICY "Companies can update their own targets" ON corporate_targets
FOR UPDATE USING ((SELECT auth.uid()) = company_id);

DROP POLICY IF EXISTS "Companies can view their own targets" ON corporate_targets;
CREATE POLICY "Companies can view their own targets" ON corporate_targets
FOR SELECT USING ((SELECT auth.uid()) = company_id);

-- ============================================
-- NOTIFICATION_PREFERENCES TABLE
-- ============================================
DROP POLICY IF EXISTS "Users can manage their own notification preferences" ON notification_preferences;
CREATE POLICY "Users can manage their own notification preferences" ON notification_preferences
FOR ALL USING ((SELECT auth.uid()) = user_id) 
WITH CHECK ((SELECT auth.uid()) = user_id);

COMMENT ON POLICY "Admins can view all analytics events" ON analytics_events IS 'Optimized: auth.uid() in SELECT subquery';
COMMENT ON POLICY "Users can create their own reports" ON reports IS 'Optimized: auth.uid() in SELECT subquery';