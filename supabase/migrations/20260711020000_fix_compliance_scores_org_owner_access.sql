-- CRITICAL FIX: compliance_scores has been completely inaccessible to
-- everyone, always. Its RLS policies gate access exclusively via
-- organization_members, but that table has zero rows in the entire
-- system - nothing anywhere ever inserts into it (organizations are owned
-- via organizations.created_by, the pattern esg_indicators/esg_suppliers/
-- esg_scenarios correctly use instead). Found while wiring the CSRD
-- compliance module (#21), which writes to this table - the org owner
-- couldn't even save their own organization's compliance score.
--
-- Fix: add organizations.created_by as an additional valid access path,
-- matching the working pattern, without removing the organization_members
-- path (harmless to keep for if/when that table starts being populated).
DROP POLICY IF EXISTS "Org members and admins can view compliance scores" ON public.compliance_scores;
CREATE POLICY "Org members and admins can view compliance scores"
ON public.compliance_scores FOR SELECT
USING (
  organization_id IN (SELECT id FROM public.organizations WHERE created_by = (SELECT auth.uid()))
  OR organization_id IN (SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = (SELECT auth.uid()))
  OR has_role((SELECT auth.uid()), 'admin'::app_role)
  OR has_role((SELECT auth.uid()), 'platform_admin'::app_role)
);

DROP POLICY IF EXISTS "Org members can insert compliance scores" ON public.compliance_scores;
CREATE POLICY "Org members can insert compliance scores"
ON public.compliance_scores FOR INSERT
WITH CHECK (
  organization_id IN (SELECT id FROM public.organizations WHERE created_by = (SELECT auth.uid()))
  OR organization_id IN (SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = (SELECT auth.uid()))
);

DROP POLICY IF EXISTS "Org members can update own compliance scores" ON public.compliance_scores;
CREATE POLICY "Org members can update own compliance scores"
ON public.compliance_scores FOR UPDATE
USING (
  organization_id IN (SELECT id FROM public.organizations WHERE created_by = (SELECT auth.uid()))
  OR organization_id IN (SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = (SELECT auth.uid()))
);
