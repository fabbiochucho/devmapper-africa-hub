
-- Add explicit UPDATE/DELETE policies for documents bucket (owner-scoped)
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Add explicit UPDATE/DELETE policies for project-files bucket (org-member scoped)
CREATE POLICY "Org members can update project files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-files' AND EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid())
      AND om.organization_id::text = (storage.foldername(name))[1]
  )
)
WITH CHECK (
  bucket_id = 'project-files' AND EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid())
      AND om.organization_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Org members can delete project files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-files' AND EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid())
      AND om.organization_id::text = (storage.foldername(name))[1]
  )
);

-- Allow organization members (not just creators) to read ESG data
CREATE POLICY "Org members can read esg_indicators"
ON public.esg_indicators FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = esg_indicators.organization_id
      AND om.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Org members can read esg_scenarios"
ON public.esg_scenarios FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = esg_scenarios.organization_id
      AND om.user_id = (SELECT auth.uid())
  )
);
