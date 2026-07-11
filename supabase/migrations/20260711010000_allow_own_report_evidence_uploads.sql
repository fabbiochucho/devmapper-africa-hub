-- CRITICAL FIX: citizen report photo uploads to the project-files bucket
-- have never actually worked. SubmitReport.tsx uploads to
-- `${user.id}/${report.id}/${filename}`, but all 4 existing storage
-- policies on project-files (SELECT/INSERT/UPDATE/DELETE) require the
-- path's first folder segment to be an organization_id the caller belongs
-- to (organization_members) - a model built for org-shared project files,
-- which doesn't fit citizen reporters (who typically have no organization
-- at all). Every upload attempt failed with "new row violates row-level
-- security policy", silently, since the original code never checked the
-- upload error.
--
-- Additive fix: allow a user to manage files under their own
-- user-id-prefixed path regardless of org membership, alongside the
-- existing org-scoped policies (which remain unchanged for genuinely
-- shared org files).
CREATE POLICY "Users can upload their own report evidence"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-files'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

CREATE POLICY "Users can read their own report evidence"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-files'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

CREATE POLICY "Users can update their own report evidence"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'project-files'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
)
WITH CHECK (
  bucket_id = 'project-files'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

CREATE POLICY "Users can delete their own report evidence"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'project-files'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
);
