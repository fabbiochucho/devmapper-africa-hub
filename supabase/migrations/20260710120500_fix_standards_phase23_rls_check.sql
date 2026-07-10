-- 20260707091900_standards_phase23_stubs.sql intended org owner-or-member
-- read/write access on the phase 2/3 standards tables (per its own comment:
-- "owner or member can read/write"), but the WITH CHECK clause only allowed
-- the owner, so member INSERT/UPDATE silently failed despite USING allowing
-- their reads. Recreate the policies with WITH CHECK matching USING.

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['sbti_pathways', 'cdp_questionnaire_responses', 'glec_transport_factors', 'lca_assessments', 'gpc_city_inventories']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Org members can manage %1$s" ON public.%1$I', t);
    EXECUTE format(
      'CREATE POLICY "Org members can manage %1$s" ON public.%1$I FOR ALL TO authenticated
       USING (
         organization_id IN (SELECT id FROM public.organizations WHERE created_by = (SELECT auth.uid()))
         OR organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid()))
       )
       WITH CHECK (
         organization_id IN (SELECT id FROM public.organizations WHERE created_by = (SELECT auth.uid()))
         OR organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid()))
       )', t
    );
  END LOOP;
END $$;
