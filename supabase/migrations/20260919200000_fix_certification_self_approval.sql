-- ============================================================
-- FIX: Applicants could approve their own certification requests
-- ============================================================
-- "Applicants can update own applications" had no WITH CHECK, so
-- Postgres reused USING (auth.uid() = applicant_id) as the check - that
-- only restricts which ROW is updatable, not which VALUES can be
-- written. Any applicant could run
-- `.update({ status: 'approved' }).eq('id', myAppId)` directly. There
-- was also no admin/reviewer UI anywhere that ever sets status, so this
-- self-update was the only way any application's status ever changed.
-- ============================================================

DROP POLICY IF EXISTS "Applicants can update own applications" ON public.certification_applications;

-- Applicants can still edit their own application (e.g. fix a typo)
-- while it's still awaiting review, and can withdraw it at any time -
-- but can never write any other status (in particular, never approve
-- their own application).
CREATE POLICY "Applicants can edit or withdraw their own applications"
ON public.certification_applications
FOR UPDATE
USING (auth.uid() = applicant_id)
WITH CHECK (
  auth.uid() = applicant_id
  AND status IN ('submitted', 'withdrawn')
);

-- A pre-existing "Admins can update certification applications" UPDATE
-- policy already grants admin/platform_admin full status-change rights -
-- no new admin policy needed here, one already covers the review path.
