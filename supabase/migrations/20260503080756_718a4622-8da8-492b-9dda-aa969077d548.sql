
-- Fix verification_assignments: drop public read, restrict to verifier/owner/assigner/admin
DROP POLICY IF EXISTS "Authenticated users can view verification assignments" ON public.verification_assignments;
CREATE POLICY "Restricted view of verification assignments"
ON public.verification_assignments FOR SELECT
TO authenticated
USING (
  (assigned_by = (SELECT auth.uid()))
  OR (verifier_id IN (SELECT id FROM public.verifier_profiles WHERE user_id = (SELECT auth.uid())))
  OR (report_id IN (SELECT id FROM public.reports WHERE user_id = (SELECT auth.uid())))
  OR public.has_role((SELECT auth.uid()), 'admin'::app_role)
);

-- project_circularity: replace permissive true policy
DROP POLICY IF EXISTS "Users can view circularity data" ON public.project_circularity;
CREATE POLICY "Users can view own or affiliated circularity data"
ON public.project_circularity FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = project_circularity.report_id
      AND (r.user_id = (SELECT auth.uid()) OR public.is_affiliated_with_report((SELECT auth.uid()), r.id))
  )
  OR public.has_role((SELECT auth.uid()), 'admin'::app_role)
);

-- project_carbon_data
DROP POLICY IF EXISTS "Users can view carbon data for accessible reports" ON public.project_carbon_data;
CREATE POLICY "Users can view own or affiliated carbon data"
ON public.project_carbon_data FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = project_carbon_data.report_id
      AND (r.user_id = (SELECT auth.uid()) OR public.is_affiliated_with_report((SELECT auth.uid()), r.id))
  )
  OR public.has_role((SELECT auth.uid()), 'admin'::app_role)
);

-- project_financial_impact
DROP POLICY IF EXISTS "Users can view financial impact data" ON public.project_financial_impact;
CREATE POLICY "Users can view own or affiliated financial impact"
ON public.project_financial_impact FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = project_financial_impact.report_id
      AND (r.user_id = (SELECT auth.uid()) OR public.is_affiliated_with_report((SELECT auth.uid()), r.id))
  )
  OR public.has_role((SELECT auth.uid()), 'admin'::app_role)
);

-- project_decarbonisation: drop the broad true policy (restrictive one already exists)
DROP POLICY IF EXISTS "Users can view decarbonisation data" ON public.project_decarbonisation;

-- alphaearth_cache: restrict to authenticated and remove unauth access to null org rows
DROP POLICY IF EXISTS "Organizations can access their cache and public data" ON public.alphaearth_cache;
CREATE POLICY "Authenticated users can read cache"
ON public.alphaearth_cache FOR SELECT
TO authenticated
USING (
  organization_id IS NULL
  OR organization_id IN (SELECT id FROM public.organizations WHERE created_by = (SELECT auth.uid()))
  OR organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid()))
);

-- esg_audit_logs: extend to org members (read + write)
DROP POLICY IF EXISTS "Organizations can view their ESG audit logs" ON public.esg_audit_logs;
CREATE POLICY "Org members can view ESG audit logs"
ON public.esg_audit_logs FOR SELECT
TO authenticated
USING (
  organization_id IN (SELECT id FROM public.organizations WHERE created_by = (SELECT auth.uid()))
  OR organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid()))
);

DROP POLICY IF EXISTS "Authenticated users can insert ESG audit logs" ON public.esg_audit_logs;
CREATE POLICY "Org members can insert ESG audit logs"
ON public.esg_audit_logs FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (SELECT id FROM public.organizations WHERE created_by = (SELECT auth.uid()))
  OR organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid()))
);

-- Remove sensitive tables from realtime publication to avoid broadcast leaks
ALTER PUBLICATION supabase_realtime DROP TABLE public.organizations;
ALTER PUBLICATION supabase_realtime DROP TABLE public.billing_events;
