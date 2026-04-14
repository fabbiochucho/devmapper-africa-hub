-- Fix overly permissive INSERT policies on AI tables
-- These were set to allow any user to insert; restrict to authenticated users only

DROP POLICY IF EXISTS "Service role inserts outputs" ON public.ai_agent_outputs;
CREATE POLICY "Authenticated users can insert outputs"
  ON public.ai_agent_outputs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role inserts audit" ON public.ai_audit_log;
CREATE POLICY "Authenticated users can insert audit logs"
  ON public.ai_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
