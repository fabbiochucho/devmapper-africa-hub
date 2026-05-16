
-- 1. Tighten ai_agent_outputs INSERT policy
DROP POLICY IF EXISTS "Users can insert agent outputs" ON public.ai_agent_outputs;
DROP POLICY IF EXISTS "Authenticated users can insert agent outputs" ON public.ai_agent_outputs;
DROP POLICY IF EXISTS "agent_outputs_insert" ON public.ai_agent_outputs;

CREATE POLICY "Users insert outputs into own sessions"
ON public.ai_agent_outputs
FOR INSERT
TO authenticated
WITH CHECK (
  session_id IN (
    SELECT id FROM public.ai_agent_sessions
    WHERE user_id = (SELECT auth.uid())
  )
);

-- 2. Tighten ai_audit_log INSERT policy
DROP POLICY IF EXISTS "Users can insert audit log" ON public.ai_audit_log;
DROP POLICY IF EXISTS "Authenticated users can insert audit log" ON public.ai_audit_log;
DROP POLICY IF EXISTS "audit_log_insert" ON public.ai_audit_log;

CREATE POLICY "Users insert own audit entries"
ON public.ai_audit_log
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND (
    session_id IS NULL
    OR session_id IN (
      SELECT id FROM public.ai_agent_sessions
      WHERE user_id = (SELECT auth.uid())
    )
  )
);

-- 3. Revoke API access to the materialized view (still accessible via SECURITY DEFINER get_dashboard_stats())
REVOKE ALL ON public.mv_dashboard_stats FROM anon, authenticated;
