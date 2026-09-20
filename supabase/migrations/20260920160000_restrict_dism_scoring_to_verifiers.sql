-- CRITICAL (RLS audit - likely the most severe finding): DISM/SIS scores
-- (project_dism_scores.total_score) directly gate certification
-- eligibility - SPVFVerificationPanel.tsx's issueCertification() requires
-- totalSIS >= 60. The INSERT policy only required
-- (auth.uid() = scored_by AND is_affiliated_with_report(auth.uid(), report_id)).
-- Every report owner is automatically affiliated with their own report
-- (report-submission.ts inserts a project_affiliations row with
-- relationship_type='owner' at submission time), so any report owner
-- could self-insert a total_score of 100 for their own project and walk
-- straight through the certification gate - completely bypassing the
-- "AI/ML + human auditors verify evidence" process the platform is
-- built around.
--
-- Restricted to the same verifier role set already used for
-- project_verifications and SPVFVerificationPanel's client-side
-- isVerifier gate - a report's own affiliates (owner, collaborators) can
-- no longer score their own project; only an independent verifier can.
-- The matching UPDATE policy ("Score owners can update their scores")
-- is scoped to scored_by = auth.uid() already, and since only a verifier
-- can become scored_by going forward, that policy is now safe too.
DROP POLICY IF EXISTS "Affiliated users can upsert DISM scores" ON public.project_dism_scores;

CREATE POLICY "Verifiers can upsert DISM scores"
ON public.project_dism_scores FOR INSERT
WITH CHECK (
  auth.uid() = scored_by
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'platform_admin'::app_role)
    OR has_role(auth.uid(), 'government_official'::app_role)
    OR has_role(auth.uid(), 'ngo_member'::app_role)
  )
);
