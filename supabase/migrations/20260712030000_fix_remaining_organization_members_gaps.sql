-- #38: follow-up audit from the compliance_scores fix earlier this session
-- (organization_members has zero rows system-wide - any policy relying on
-- it exclusively is permanently unsatisfiable for everyone). Grepped every
-- policy referencing organization_members across the schema; most already
-- have an organizations.created_by OR an owning-report fallback and are
-- fine. Four spots had no fallback at all and are fixed here the same way:
-- additive, non-destructive, keeping the organization_members path in case
-- that table is ever actually populated.

-- 1. carbon_assets UPDATE had no fallback (its own SELECT/INSERT siblings
-- already OR in a report-owner check).
DROP POLICY IF EXISTS "Users can update carbon assets" ON public.carbon_assets;
CREATE POLICY "Users can update carbon assets"
ON public.carbon_assets FOR UPDATE
USING (
  organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid()))
  OR organization_id IN (SELECT id FROM public.organizations WHERE created_by = (SELECT auth.uid()))
  OR EXISTS (SELECT 1 FROM public.reports WHERE reports.id = carbon_assets.report_id AND reports.user_id = (SELECT auth.uid()))
);

-- 2. carbon_transfer_logs INSERT/SELECT had zero fallback at all (entirely
-- gated on carbon_assets.organization_id via organization_members).
DROP POLICY IF EXISTS "Users can insert transfer logs" ON public.carbon_transfer_logs;
CREATE POLICY "Users can insert transfer logs"
ON public.carbon_transfer_logs FOR INSERT
WITH CHECK (
  carbon_asset_id IN (
    SELECT id FROM public.carbon_assets
    WHERE organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid()))
       OR organization_id IN (SELECT id FROM public.organizations WHERE created_by = (SELECT auth.uid()))
       OR EXISTS (SELECT 1 FROM public.reports WHERE reports.id = carbon_assets.report_id AND reports.user_id = (SELECT auth.uid()))
  )
);

DROP POLICY IF EXISTS "Users can view transfer logs for their assets" ON public.carbon_transfer_logs;
CREATE POLICY "Users can view transfer logs for their assets"
ON public.carbon_transfer_logs FOR SELECT
USING (
  carbon_asset_id IN (
    SELECT id FROM public.carbon_assets
    WHERE organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid()))
       OR organization_id IN (SELECT id FROM public.organizations WHERE created_by = (SELECT auth.uid()))
       OR EXISTS (SELECT 1 FROM public.reports WHERE reports.id = carbon_assets.report_id AND reports.user_id = (SELECT auth.uid()))
  )
);

-- 3. standards_metadata had zero fallback across all four operations.
DROP POLICY IF EXISTS "Org members can view own standards metadata" ON public.standards_metadata;
CREATE POLICY "Org members can view own standards metadata"
ON public.standards_metadata FOR SELECT
USING (
  organization_id IN (SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = (SELECT auth.uid()))
  OR organization_id IN (SELECT id FROM public.organizations WHERE created_by = (SELECT auth.uid()))
);

DROP POLICY IF EXISTS "Org members can insert standards metadata" ON public.standards_metadata;
CREATE POLICY "Org members can insert standards metadata"
ON public.standards_metadata FOR INSERT
WITH CHECK (
  organization_id IN (SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = (SELECT auth.uid()))
  OR organization_id IN (SELECT id FROM public.organizations WHERE created_by = (SELECT auth.uid()))
);

DROP POLICY IF EXISTS "Org members can update own standards metadata" ON public.standards_metadata;
CREATE POLICY "Org members can update own standards metadata"
ON public.standards_metadata FOR UPDATE
USING (
  organization_id IN (SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = (SELECT auth.uid()))
  OR organization_id IN (SELECT id FROM public.organizations WHERE created_by = (SELECT auth.uid()))
);

DROP POLICY IF EXISTS "Org members can delete own standards metadata" ON public.standards_metadata;
CREATE POLICY "Org members can delete own standards metadata"
ON public.standards_metadata FOR DELETE
USING (
  organization_id IN (SELECT om.organization_id FROM public.organization_members om WHERE om.user_id = (SELECT auth.uid()))
  OR organization_id IN (SELECT id FROM public.organizations WHERE created_by = (SELECT auth.uid()))
);

-- 4. storage.objects 'project-files' org-prefixed policies had zero
-- fallback (the #9 fix earlier this session added a *separate* additive
-- policy for user-id-prefixed paths - this fixes the original org-id-prefixed
-- path for an org's actual owner). organizations.id is a uuid and the path's
-- first folder segment is validated as a uuid by the existing policy shape
-- (organization_members.organization_id is also uuid), so casting here is safe.
DROP POLICY IF EXISTS "Org members can read project files" ON storage.objects;
CREATE POLICY "Org members can read project files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-files'
  AND (
    EXISTS (SELECT 1 FROM public.organization_members om WHERE om.user_id = (SELECT auth.uid()) AND om.organization_id::text = (storage.foldername(objects.name))[1])
    OR EXISTS (SELECT 1 FROM public.organizations o WHERE o.created_by = (SELECT auth.uid()) AND o.id::text = (storage.foldername(objects.name))[1])
  )
);

DROP POLICY IF EXISTS "Organization members can upload project files" ON storage.objects;
CREATE POLICY "Organization members can upload project files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-files'
  AND (
    EXISTS (SELECT 1 FROM public.organization_members om WHERE om.user_id = (SELECT auth.uid()) AND om.organization_id::text = (storage.foldername(objects.name))[1])
    OR EXISTS (SELECT 1 FROM public.organizations o WHERE o.created_by = (SELECT auth.uid()) AND o.id::text = (storage.foldername(objects.name))[1])
  )
);

DROP POLICY IF EXISTS "Org members can update project files" ON storage.objects;
CREATE POLICY "Org members can update project files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'project-files'
  AND (
    EXISTS (SELECT 1 FROM public.organization_members om WHERE om.user_id = (SELECT auth.uid()) AND om.organization_id::text = (storage.foldername(objects.name))[1])
    OR EXISTS (SELECT 1 FROM public.organizations o WHERE o.created_by = (SELECT auth.uid()) AND o.id::text = (storage.foldername(objects.name))[1])
  )
);

DROP POLICY IF EXISTS "Org members can delete project files" ON storage.objects;
CREATE POLICY "Org members can delete project files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-files'
  AND (
    EXISTS (SELECT 1 FROM public.organization_members om WHERE om.user_id = (SELECT auth.uid()) AND om.organization_id::text = (storage.foldername(objects.name))[1])
    OR EXISTS (SELECT 1 FROM public.organizations o WHERE o.created_by = (SELECT auth.uid()) AND o.id::text = (storage.foldername(objects.name))[1])
  )
);
