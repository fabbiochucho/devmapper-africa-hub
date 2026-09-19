-- CRITICAL: both tables had a blanket "viewable by everyone" SELECT
-- policy (USING (true)) sitting alongside a correctly visibility-aware
-- policy. Postgres OR's multiple permissive policies for the same
-- command together, so the blanket 'true' policy completely overrode the
-- intended scoping - anyone, including unauthenticated users, could read
-- certification/verification data (certificate numbers, certifying
-- bodies, ratings, verifier comments) for private/draft reports.

-- project_certifications: "View certifications by report access" already
-- covers the legitimate cases (report is public, owner, affiliated,
-- admin) - the blanket policy was pure excess exposure, drop it.
DROP POLICY IF EXISTS "Certifications are viewable by everyone" ON public.project_certifications;

-- verification_logs had the same blanket policy, but its narrower policy
-- ("Users can view their verifications") only covered the log's own
-- author - it never let a report's owner/affiliates/admins see
-- verification comments on their own report. Drop both and replace with
-- one policy matching the exact visibility rule already used by
-- project_verifications/project_certifications.
DROP POLICY IF EXISTS "Verifications are viewable by everyone" ON public.verification_logs;
DROP POLICY IF EXISTS "Users can view their verifications" ON public.verification_logs;

CREATE POLICY "View verification logs by report access"
ON public.verification_logs FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = verification_logs.report_id
      AND (
        r.visibility = 'public'
        OR r.user_id = auth.uid()
        OR is_affiliated_with_report(auth.uid(), r.id)
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'platform_admin'::app_role)
      )
  )
);
