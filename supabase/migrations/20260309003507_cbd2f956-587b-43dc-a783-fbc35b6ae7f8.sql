-- ============================================
-- FIX RLS POLICY PERFORMANCE: Part 4 - ESG, certification, and remaining tables
-- ============================================

-- ============================================
-- PROJECT_MILESTONES TABLE
-- ============================================
DROP POLICY IF EXISTS "Report owners and affiliates can manage milestones" ON project_milestones;
CREATE POLICY "Report owners and affiliates can manage milestones" ON project_milestones
FOR ALL USING (
  report_id IN (SELECT id FROM reports WHERE user_id = (SELECT auth.uid())) OR
  is_affiliated_with_report((SELECT auth.uid()), report_id)
);

DROP POLICY IF EXISTS "Milestone creators can update" ON project_milestones;
CREATE POLICY "Milestone creators can update" ON project_milestones
FOR UPDATE USING (created_by = (SELECT auth.uid()));

-- ============================================
-- PROJECT_AFFILIATIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all affiliations" ON project_affiliations;
CREATE POLICY "Admins can manage all affiliations" ON project_affiliations
FOR ALL USING (
  has_role((SELECT auth.uid()), 'admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'platform_admin'::app_role)
) WITH CHECK (
  has_role((SELECT auth.uid()), 'admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'platform_admin'::app_role)
);

DROP POLICY IF EXISTS "Authenticated users can create affiliations" ON project_affiliations;
CREATE POLICY "Authenticated users can create affiliations" ON project_affiliations
FOR INSERT WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL AND (
    report_id IN (SELECT id FROM reports WHERE user_id = (SELECT auth.uid())) OR
    (SELECT auth.uid()) = user_id
  )
);

DROP POLICY IF EXISTS "Report owners can delete affiliations" ON project_affiliations;
CREATE POLICY "Report owners can delete affiliations" ON project_affiliations
FOR DELETE USING (
  report_id IN (SELECT id FROM reports WHERE user_id = (SELECT auth.uid()))
);

DROP POLICY IF EXISTS "Report owners can update affiliations" ON project_affiliations;
CREATE POLICY "Report owners can update affiliations" ON project_affiliations
FOR UPDATE USING (
  report_id IN (SELECT id FROM reports WHERE user_id = (SELECT auth.uid()))
);

DROP POLICY IF EXISTS "Report owners can view affiliations on their reports" ON project_affiliations;
CREATE POLICY "Report owners can view affiliations on their reports" ON project_affiliations
FOR SELECT USING (
  report_id IN (SELECT id FROM reports WHERE user_id = (SELECT auth.uid()))
);

DROP POLICY IF EXISTS "Users can view their own affiliations" ON project_affiliations;
CREATE POLICY "Users can view their own affiliations" ON project_affiliations
FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- ============================================
-- CERTIFICATION_APPLICATIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can update certification applications" ON certification_applications;
CREATE POLICY "Admins can update certification applications" ON certification_applications
FOR UPDATE USING (
  has_role((SELECT auth.uid()), 'admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'platform_admin'::app_role)
);

DROP POLICY IF EXISTS "Admins can view all certification applications" ON certification_applications;
CREATE POLICY "Admins can view all certification applications" ON certification_applications
FOR SELECT USING (
  has_role((SELECT auth.uid()), 'admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'platform_admin'::app_role)
);

DROP POLICY IF EXISTS "Applicants can update own applications" ON certification_applications;
CREATE POLICY "Applicants can update own applications" ON certification_applications
FOR UPDATE USING ((SELECT auth.uid()) = applicant_id);

DROP POLICY IF EXISTS "Users can submit certification applications" ON certification_applications;
CREATE POLICY "Users can submit certification applications" ON certification_applications
FOR INSERT WITH CHECK (
  (SELECT auth.uid()) = applicant_id AND
  report_id IN (SELECT id FROM reports WHERE user_id = (SELECT auth.uid()))
);

DROP POLICY IF EXISTS "Users can view their own certification applications" ON certification_applications;
CREATE POLICY "Users can view their own certification applications" ON certification_applications
FOR SELECT USING ((SELECT auth.uid()) = applicant_id);

-- ============================================
-- PROJECT_CERTIFICATIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "Verifiers can manage certifications" ON project_certifications;
CREATE POLICY "Verifiers can manage certifications" ON project_certifications
FOR ALL USING (
  has_role((SELECT auth.uid()), 'admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'platform_admin'::app_role) OR
  (SELECT auth.uid()) = certified_by
) WITH CHECK (
  has_role((SELECT auth.uid()), 'admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'platform_admin'::app_role) OR
  (SELECT auth.uid()) = certified_by
);

-- ============================================
-- VERIFICATION_WORKFLOW_STAGES TABLE
-- ============================================
DROP POLICY IF EXISTS "Authorized users can manage workflow stages" ON verification_workflow_stages;
CREATE POLICY "Authorized users can manage workflow stages" ON verification_workflow_stages
FOR ALL USING (
  has_role((SELECT auth.uid()), 'admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'platform_admin'::app_role) OR
  (SELECT auth.uid()) = assigned_verifier OR
  report_id IN (SELECT id FROM reports WHERE user_id = (SELECT auth.uid()))
) WITH CHECK (
  has_role((SELECT auth.uid()), 'admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'platform_admin'::app_role) OR
  (SELECT auth.uid()) = assigned_verifier OR
  report_id IN (SELECT id FROM reports WHERE user_id = (SELECT auth.uid()))
);

-- ============================================
-- VERIFICATION_SCORES TABLE
-- ============================================
DROP POLICY IF EXISTS "Verifiers can manage scores" ON verification_scores;
CREATE POLICY "Verifiers can manage scores" ON verification_scores
FOR ALL USING (
  has_role((SELECT auth.uid()), 'admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'platform_admin'::app_role) OR
  (SELECT auth.uid()) = scored_by
) WITH CHECK (
  has_role((SELECT auth.uid()), 'admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'platform_admin'::app_role) OR
  (SELECT auth.uid()) = scored_by
);

-- ============================================
-- ESG_INDICATORS TABLE
-- ============================================
DROP POLICY IF EXISTS "Organizations can manage their ESG indicators" ON esg_indicators;
CREATE POLICY "Organizations can manage their ESG indicators" ON esg_indicators
FOR ALL USING (
  organization_id IN (
    SELECT id FROM organizations WHERE created_by = (SELECT auth.uid())
  )
) WITH CHECK (
  organization_id IN (
    SELECT id FROM organizations WHERE created_by = (SELECT auth.uid())
  )
);

-- ============================================
-- ESG_SUPPLIERS TABLE
-- ============================================
DROP POLICY IF EXISTS "Organizations can manage their ESG suppliers" ON esg_suppliers;
CREATE POLICY "Organizations can manage their ESG suppliers" ON esg_suppliers
FOR ALL USING (
  organization_id IN (
    SELECT id FROM organizations WHERE created_by = (SELECT auth.uid())
  )
) WITH CHECK (
  organization_id IN (
    SELECT id FROM organizations WHERE created_by = (SELECT auth.uid())
  )
);

-- ============================================
-- ESG_SUPPLIER_EMISSIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "Organizations can manage their supplier emissions" ON esg_supplier_emissions;
CREATE POLICY "Organizations can manage their supplier emissions" ON esg_supplier_emissions
FOR ALL USING (
  organization_id IN (
    SELECT id FROM organizations WHERE created_by = (SELECT auth.uid())
  )
) WITH CHECK (
  organization_id IN (
    SELECT id FROM organizations WHERE created_by = (SELECT auth.uid())
  )
);

-- ============================================
-- ESG_SCENARIOS TABLE
-- ============================================
DROP POLICY IF EXISTS "Organizations can manage their ESG scenarios" ON esg_scenarios;
CREATE POLICY "Organizations can manage their ESG scenarios" ON esg_scenarios
FOR ALL USING (
  organization_id IN (
    SELECT id FROM organizations WHERE created_by = (SELECT auth.uid())
  )
) WITH CHECK (
  organization_id IN (
    SELECT id FROM organizations WHERE created_by = (SELECT auth.uid())
  )
);

-- ============================================
-- ESG_AUDIT_LOGS TABLE
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can insert ESG audit logs" ON esg_audit_logs;
CREATE POLICY "Authenticated users can insert ESG audit logs" ON esg_audit_logs
FOR INSERT WITH CHECK (
  (SELECT auth.uid()) = user_id OR
  organization_id IN (
    SELECT id FROM organizations WHERE created_by = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Organizations can view their ESG audit logs" ON esg_audit_logs;
CREATE POLICY "Organizations can view their ESG audit logs" ON esg_audit_logs
FOR SELECT USING (
  organization_id IN (
    SELECT id FROM organizations WHERE created_by = (SELECT auth.uid())
  )
);

-- ============================================
-- ALPHAEARTH_CACHE TABLE
-- ============================================
DROP POLICY IF EXISTS "Organizations can access their cache and public data" ON alphaearth_cache;
CREATE POLICY "Organizations can access their cache and public data" ON alphaearth_cache
FOR SELECT USING (
  organization_id IS NULL OR
  organization_id IN (
    SELECT id FROM organizations WHERE created_by = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Organizations can insert their cache data" ON alphaearth_cache;
CREATE POLICY "Organizations can insert their cache data" ON alphaearth_cache
FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT id FROM organizations WHERE created_by = (SELECT auth.uid())
  )
);

-- ============================================
-- ADMIN_AREAS TABLE
-- ============================================
DROP POLICY IF EXISTS "Only admins can manage admin areas" ON admin_areas;
CREATE POLICY "Only admins can manage admin areas" ON admin_areas
FOR ALL USING (
  has_role((SELECT auth.uid()), 'platform_admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'admin'::app_role)
) WITH CHECK (
  has_role((SELECT auth.uid()), 'platform_admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'admin'::app_role)
);

-- ============================================
-- FEATURE_FLAGS TABLE
-- ============================================
DROP POLICY IF EXISTS "Only admins can manage feature flags" ON feature_flags;
CREATE POLICY "Only admins can manage feature flags" ON feature_flags
FOR ALL USING (has_role((SELECT auth.uid()), 'platform_admin'::app_role));

-- ============================================
-- ORGANIZATION_MEMBERS TABLE
-- ============================================
DROP POLICY IF EXISTS "Organization owners can manage members" ON organization_members;
CREATE POLICY "Organization owners can manage members" ON organization_members
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM organizations 
    WHERE id = organization_members.organization_id 
    AND created_by = (SELECT auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can view memberships for their organizations" ON organization_members;
CREATE POLICY "Users can view memberships for their organizations" ON organization_members
FOR SELECT USING (
  user_id = (SELECT auth.uid()) OR
  EXISTS (
    SELECT 1 FROM organizations 
    WHERE id = organization_members.organization_id 
    AND created_by = (SELECT auth.uid())
  )
);

-- ============================================
-- WEBHOOK_EVENTS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can view webhook events" ON webhook_events;
CREATE POLICY "Admins can view webhook events" ON webhook_events
FOR SELECT USING (
  has_role((SELECT auth.uid()), 'platform_admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'admin'::app_role)
);

-- ============================================
-- COUNTRY_INTELLIGENCE TABLE
-- ============================================
DROP POLICY IF EXISTS "Only admins can manage country intelligence" ON country_intelligence;
CREATE POLICY "Only admins can manage country intelligence" ON country_intelligence
FOR ALL USING (
  has_role((SELECT auth.uid()), 'platform_admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'admin'::app_role)
) WITH CHECK (
  has_role((SELECT auth.uid()), 'platform_admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'admin'::app_role)
);

COMMENT ON POLICY "Organizations can manage their ESG indicators" ON esg_indicators IS 'Optimized: wrapped auth.uid() in SELECT subquery';
COMMENT ON POLICY "Admins can manage all affiliations" ON project_affiliations IS 'Optimized: wrapped auth.uid() in SELECT subquery';