-- Findings from this session's security review (multi-agent verified,
-- confidence 7/10 and 8/10) of the resumed-session diff.

-- 1. record_provider_health was granted to anon on the stated justification
-- that "some connectors don't require a signed-in caller upstream" -
-- verified false for all 13 connectors now wired to it; every one requires
-- and checks a real auth session before ever reaching this RPC. The anon
-- grant therefore serves no legitimate code path and only opens a direct,
-- unauthenticated PostgREST attack surface (anyone with the public anon
-- key can POST /rest/v1/rpc/record_provider_health for any known
-- provider_key and reset or fabricate its health history).
-- Postgres grants EXECUTE on new functions to PUBLIC by default (unlike
-- tables) - the original migration never revoked that, so REVOKE ... FROM
-- anon alone leaves the function callable by anon anyway via the implicit
-- PUBLIC grant every role inherits. Caught by live verification after the
-- first version of this fix: revoking only from anon still returned 204
-- or an anonymous call. Both revokes are required.
REVOKE EXECUTE ON FUNCTION public.record_provider_health(text, boolean, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_provider_health(text, boolean, text) FROM PUBLIC;

-- 2. project_tasks.created_by can still be forged via UPDATE even after
-- the prior migration closed the INSERT path - both non-admin UPDATE
-- policies ("Project owners can update tasks", "Task assignees and
-- owners can update") have USING but no WITH CHECK, and Postgres reuses
-- USING (which only checks row/report ownership, not whether created_by's
-- *value* changed) as the implicit WITH CHECK. No app code path ever
-- legitimately updates created_by post-creation (confirmed: only ever
-- set on INSERT), so guard it the same way as the other trust-signal
-- columns fixed earlier this session.
CREATE OR REPLACE FUNCTION public.guard_task_authorship()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.created_by IS DISTINCT FROM OLD.created_by
     AND NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role))
  THEN
    RAISE EXCEPTION 'created_by cannot be changed after a task is created';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_task_authorship_trigger ON public.project_tasks;
CREATE TRIGGER guard_task_authorship_trigger
BEFORE UPDATE ON public.project_tasks
FOR EACH ROW EXECUTE FUNCTION public.guard_task_authorship();
