
-- 1. campaign_donations: restrict authenticated inserts to donor_id = auth.uid()
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='campaign_donations' AND cmd='INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.campaign_donations', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "Donors can insert their own donations"
ON public.campaign_donations
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) = donor_id);

-- (Anonymous donations are inserted by the create-payment edge function using service_role, which bypasses RLS.)

-- 2. verification_ledger: restrict inserts to report owner + actor_id = auth.uid()
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='verification_ledger' AND cmd='INSERT'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.verification_ledger', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "Report owners can append ledger entries"
ON public.verification_ledger
FOR INSERT
TO authenticated
WITH CHECK (
  actor_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = verification_ledger.report_id
      AND r.user_id = (SELECT auth.uid())
  )
);

-- 3. ai_agent_outputs: remove broad WITH CHECK (true) policies
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname, qual, with_check FROM pg_policies WHERE schemaname='public' AND tablename='ai_agent_outputs' AND cmd='INSERT'
  LOOP
    IF p.with_check IS NULL OR p.with_check = 'true' THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.ai_agent_outputs', p.policyname);
    END IF;
  END LOOP;
END $$;

-- Ensure scoped policy exists
DROP POLICY IF EXISTS "Users can insert outputs for own sessions" ON public.ai_agent_outputs;
CREATE POLICY "Users can insert outputs for own sessions"
ON public.ai_agent_outputs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ai_agent_sessions s
    WHERE s.id = ai_agent_outputs.session_id
      AND s.user_id = (SELECT auth.uid())
  )
);

-- 4. ai_audit_log: remove broad WITH CHECK (true) policies
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname, with_check FROM pg_policies WHERE schemaname='public' AND tablename='ai_audit_log' AND cmd='INSERT'
  LOOP
    IF p.with_check IS NULL OR p.with_check = 'true' THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.ai_audit_log', p.policyname);
    END IF;
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Users can insert their own audit logs" ON public.ai_audit_log;
CREATE POLICY "Users can insert their own audit logs"
ON public.ai_audit_log
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND (
    session_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.ai_agent_sessions s
      WHERE s.id = ai_audit_log.session_id
        AND s.user_id = (SELECT auth.uid())
    )
  )
);
