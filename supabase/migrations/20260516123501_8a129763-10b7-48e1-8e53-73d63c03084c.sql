
-- 1. analytics_events: prevent spoofing user_id on insert
DROP POLICY IF EXISTS "Users can insert their own analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can insert analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "Authenticated users can insert analytics" ON public.analytics_events;

CREATE POLICY "Users can insert their own analytics events"
ON public.analytics_events
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

-- 2. realtime.messages: scope subscriptions to authenticated users only (default deny otherwise)
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read realtime messages" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can write realtime messages" ON realtime.messages;

CREATE POLICY "Authenticated can read realtime messages"
ON realtime.messages
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY "Authenticated can write realtime messages"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- 3. audit_logs: remove end-user INSERT policy; service-role bypasses RLS
DROP POLICY IF EXISTS "Users can insert their own audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users insert audit logs" ON public.audit_logs;

-- 4. project_budgets: restrict SELECT to public reports or owner
DROP POLICY IF EXISTS "Anyone can view budgets of public reports" ON public.project_budgets;

CREATE POLICY "View budgets of public reports or own reports"
ON public.project_budgets
FOR SELECT
USING (
  report_id IN (
    SELECT id FROM public.reports
    WHERE visibility = 'public'
       OR user_id = (SELECT auth.uid())
  )
);

-- 5. project_updates: restrict SELECT similarly
DROP POLICY IF EXISTS "Anyone can view updates on public reports" ON public.project_updates;

CREATE POLICY "View updates on public reports or own reports"
ON public.project_updates
FOR SELECT
USING (
  report_id IN (
    SELECT id FROM public.reports
    WHERE visibility = 'public'
       OR user_id = (SELECT auth.uid())
  )
);

-- 6. verification_ledger: remove end-user INSERT (route through service-role)
DROP POLICY IF EXISTS "Report owners can insert ledger entries" ON public.verification_ledger;
DROP POLICY IF EXISTS "Authenticated users can insert ledger entries" ON public.verification_ledger;
DROP POLICY IF EXISTS "Users can insert ledger entries for their reports" ON public.verification_ledger;
