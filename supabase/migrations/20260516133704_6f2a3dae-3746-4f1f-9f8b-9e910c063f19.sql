
-- Helper: visibility check (inline to avoid extra function)

-- verification_workflow_stages
DROP POLICY IF EXISTS "Workflow stages are viewable by everyone" ON public.verification_workflow_stages;
CREATE POLICY "View workflow stages by report access"
ON public.verification_workflow_stages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = verification_workflow_stages.report_id
    AND (
      r.visibility = 'public'
      OR r.user_id = (SELECT auth.uid())
      OR public.is_affiliated_with_report((SELECT auth.uid()), r.id)
      OR public.has_role((SELECT auth.uid()), 'admin')
      OR public.has_role((SELECT auth.uid()), 'platform_admin')
    )
  )
);

-- verification_ledger
DROP POLICY IF EXISTS "Verification ledger is viewable by everyone" ON public.verification_ledger;
CREATE POLICY "View verification ledger by report access"
ON public.verification_ledger FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = verification_ledger.report_id
    AND (
      r.visibility = 'public'
      OR r.user_id = (SELECT auth.uid())
      OR public.is_affiliated_with_report((SELECT auth.uid()), r.id)
      OR public.has_role((SELECT auth.uid()), 'admin')
      OR public.has_role((SELECT auth.uid()), 'platform_admin')
    )
  )
);

-- citizen_project_feedback
DROP POLICY IF EXISTS "Anyone can view feedback" ON public.citizen_project_feedback;
CREATE POLICY "View feedback by report access"
ON public.citizen_project_feedback FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = citizen_project_feedback.report_id
    AND (
      r.visibility = 'public'
      OR r.user_id = (SELECT auth.uid())
      OR public.is_affiliated_with_report((SELECT auth.uid()), r.id)
      OR public.has_role((SELECT auth.uid()), 'admin')
      OR public.has_role((SELECT auth.uid()), 'platform_admin')
    )
  )
  OR user_id = (SELECT auth.uid())
);

-- project_verifications
DROP POLICY IF EXISTS "Anyone can view verifications" ON public.project_verifications;
CREATE POLICY "View verifications by report access"
ON public.project_verifications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = project_verifications.report_id
    AND (
      r.visibility = 'public'
      OR r.user_id = (SELECT auth.uid())
      OR public.is_affiliated_with_report((SELECT auth.uid()), r.id)
      OR public.has_role((SELECT auth.uid()), 'admin')
      OR public.has_role((SELECT auth.uid()), 'platform_admin')
    )
  )
);

-- evidence_items
DROP POLICY IF EXISTS "Evidence items are viewable by everyone" ON public.evidence_items;
CREATE POLICY "View evidence by report access"
ON public.evidence_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = evidence_items.report_id
    AND (
      r.visibility = 'public'
      OR r.user_id = (SELECT auth.uid())
      OR public.is_affiliated_with_report((SELECT auth.uid()), r.id)
      OR public.has_role((SELECT auth.uid()), 'admin')
      OR public.has_role((SELECT auth.uid()), 'platform_admin')
    )
  )
);

-- project_milestones
DROP POLICY IF EXISTS "Anyone can view milestones of public reports" ON public.project_milestones;
CREATE POLICY "View milestones by report access"
ON public.project_milestones FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = project_milestones.report_id
    AND (
      r.visibility = 'public'
      OR r.user_id = (SELECT auth.uid())
      OR public.is_affiliated_with_report((SELECT auth.uid()), r.id)
      OR public.has_role((SELECT auth.uid()), 'admin')
      OR public.has_role((SELECT auth.uid()), 'platform_admin')
    )
  )
);

-- project_indicators
DROP POLICY IF EXISTS "Anyone can view indicators" ON public.project_indicators;
CREATE POLICY "View indicators by report access"
ON public.project_indicators FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = project_indicators.report_id
    AND (
      r.visibility = 'public'
      OR r.user_id = (SELECT auth.uid())
      OR public.is_affiliated_with_report((SELECT auth.uid()), r.id)
      OR public.has_role((SELECT auth.uid()), 'admin')
      OR public.has_role((SELECT auth.uid()), 'platform_admin')
    )
  )
);

-- Fix storage project-files INSERT policy bug
DROP POLICY IF EXISTS "Organization members can upload project files" ON storage.objects;
CREATE POLICY "Organization members can upload project files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-files'
  AND EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid())
    AND (om.organization_id)::text = (storage.foldername(objects.name))[1]
  )
);
