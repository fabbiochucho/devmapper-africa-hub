
-- 1. conversation_participants: prevent self-join to arbitrary conversations
DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants;
CREATE POLICY "Users can join conversations"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  conversation_id IN (
    SELECT id FROM public.conversations WHERE created_by = (SELECT auth.uid())
  )
);

-- 2. esg_suppliers: allow org members read + manage
DROP POLICY IF EXISTS "Organizations can manage their ESG suppliers" ON public.esg_suppliers;
CREATE POLICY "Org members can manage ESG suppliers"
ON public.esg_suppliers
FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
  )
  OR organization_id IN (
    SELECT id FROM public.organizations WHERE created_by = (SELECT auth.uid())
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
  )
  OR organization_id IN (
    SELECT id FROM public.organizations WHERE created_by = (SELECT auth.uid())
  )
);

-- 3. esg_supplier_emissions: same
DROP POLICY IF EXISTS "Organizations can manage their supplier emissions" ON public.esg_supplier_emissions;
CREATE POLICY "Org members can manage supplier emissions"
ON public.esg_supplier_emissions
FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
  )
  OR organization_id IN (
    SELECT id FROM public.organizations WHERE created_by = (SELECT auth.uid())
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
  )
  OR organization_id IN (
    SELECT id FROM public.organizations WHERE created_by = (SELECT auth.uid())
  )
);

-- 4. carbon_compliance: restrict SELECT to org members or report owner
DROP POLICY IF EXISTS "Users can view compliance data" ON public.carbon_compliance;
CREATE POLICY "Org members or report owners can view compliance data"
ON public.carbon_compliance
FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid())
  )
  OR organization_id IN (
    SELECT id FROM public.organizations WHERE created_by = (SELECT auth.uid())
  )
  OR EXISTS (
    SELECT 1 FROM public.reports
    WHERE reports.id = carbon_compliance.report_id AND reports.user_id = (SELECT auth.uid())
  )
  OR public.has_role((SELECT auth.uid()), 'admin'::app_role)
  OR public.has_role((SELECT auth.uid()), 'platform_admin'::app_role)
);

-- 5. project_procurement: require authentication for public-project view
DROP POLICY IF EXISTS "Affiliated users can view procurement" ON public.project_procurement;
CREATE POLICY "Authenticated users can view procurement"
ON public.project_procurement
FOR SELECT
TO authenticated
USING (
  (SELECT auth.uid()) = created_by
  OR public.is_affiliated_with_report((SELECT auth.uid()), report_id)
  OR EXISTS (
    SELECT 1 FROM public.reports
    WHERE reports.id = project_procurement.report_id AND reports.visibility = 'public'
  )
);
