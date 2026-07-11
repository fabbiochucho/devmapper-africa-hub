-- Cross-entity review workflow (#85): connects three pieces of existing,
-- previously-disconnected infrastructure into a real corporate -> verifier
-- -> government reviewer pipeline:
--   1. verification_assignments already lets a report owner assign a
--      specific verifier_profiles row to their report (RLS already allows
--      this - only the client-side "assign" UI was missing).
--   2. project_verifications already lets a reviewer record an
--      approve/reject decision, but had no way to target a SPECIFIC
--      person's queue - it was insert-only "review whatever you like".
--      assigned_reviewer_id below makes a row show up in one specific
--      person's "awaiting your review" queue.
--   3. list_users_by_role lets a verifier pick a specific government
--      official to route to, without exposing the full user_roles table
--      (which is RLS-locked to each user's own row).

ALTER TABLE public.project_verifications
  ADD COLUMN assigned_reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "View verifications by report access" ON public.project_verifications;
CREATE POLICY "View verifications by report access"
ON public.project_verifications FOR SELECT
USING (
  assigned_reviewer_id = (SELECT auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = project_verifications.report_id
      AND (
        r.visibility = 'public'
        OR r.user_id = (SELECT auth.uid())
        OR is_affiliated_with_report((SELECT auth.uid()), r.id)
        OR has_role((SELECT auth.uid()), 'admin'::app_role)
        OR has_role((SELECT auth.uid()), 'platform_admin'::app_role)
      )
  )
);

DROP POLICY IF EXISTS "Verifiers can update their own verifications" ON public.project_verifications;
CREATE POLICY "Verifiers can update their own verifications"
ON public.project_verifications FOR UPDATE
USING (
  (SELECT auth.uid()) = verifier_id
  OR assigned_reviewer_id = (SELECT auth.uid())
);

-- Lets any authenticated user look up who holds a given role (name +
-- organization only) to route a report to a specific person, without
-- granting broad read access to user_roles itself.
CREATE OR REPLACE FUNCTION public.list_users_by_role(p_role app_role)
RETURNS TABLE(user_id UUID, full_name TEXT, organization TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
  SELECT ur.user_id, pp.full_name, pp.organization
  FROM public.user_roles ur
  LEFT JOIN public.public_profiles pp ON pp.user_id = ur.user_id
  WHERE ur.role = p_role AND ur.is_active = true;
$$;

GRANT EXECUTE ON FUNCTION public.list_users_by_role(app_role) TO authenticated;
