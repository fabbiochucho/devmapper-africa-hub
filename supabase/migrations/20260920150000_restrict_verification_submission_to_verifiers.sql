-- CRITICAL (RLS audit): "Authenticated users can submit verifications"
-- only checked (auth.uid() = verifier_id) - literally any signed-in
-- user, including a report's own owner or a total stranger, could
-- INSERT a project_verifications row for ANY report with
-- verification_level/status set to whatever they liked (e.g.
-- status='verified'), self-appointing as a verifier with no role check
-- at all. The matching UPDATE policy then let them freely keep editing
-- their own fabricated verification afterward.
--
-- Restricted to the same verifier role set SPVFVerificationPanel.tsx
-- already uses client-side (isVerifier = admin/platform_admin/
-- government_official/ngo_member) and that VerificationReviewDialog.tsx
-- (NGO review flow) already relies on - this makes that client-side
-- gate an actual enforced boundary instead of a UI suggestion.
DROP POLICY IF EXISTS "Authenticated users can submit verifications" ON public.project_verifications;

CREATE POLICY "Verifiers can submit verifications"
ON public.project_verifications FOR INSERT
WITH CHECK (
  (SELECT auth.uid()) = verifier_id
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'platform_admin'::app_role)
    OR has_role(auth.uid(), 'government_official'::app_role)
    OR has_role(auth.uid(), 'ngo_member'::app_role)
  )
);
