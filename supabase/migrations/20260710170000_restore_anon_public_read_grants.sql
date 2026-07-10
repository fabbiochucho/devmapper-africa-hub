-- 20260710025359's mass "REVOKE ALL ... FROM anon" hardening pass correctly
-- locked down anon access to org/user-private tables, but it also swept up
-- two tables that have an explicit, unconditional public-read RLS policy
-- and are actually queried by unauthenticated visitors on public routes:
--
-- - retirement_certificates: policy "Anyone can verify a retirement
--   certificate" (qual = true), read by the public certificate
--   verification page (/certificates/:certificateNumber).
-- - feedback_votes: policy "Anyone can view votes" (qual = true), read
--   unconditionally (vote counts, not just the viewer's own vote) by
--   CitizenFeedbackPanel on the public project detail page (/project/:id).
--
-- Restoring anon SELECT only - INSERT/UPDATE/DELETE remain correctly
-- blocked for anon on both tables, matching the existing RLS policies'
-- intent (view without an account, but sign in to vote or verify-write).
GRANT SELECT ON public.retirement_certificates TO anon;
GRANT SELECT ON public.feedback_votes TO anon;
