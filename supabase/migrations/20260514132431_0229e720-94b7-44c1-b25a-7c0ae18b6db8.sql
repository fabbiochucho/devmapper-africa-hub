
-- Tighten audit_logs INSERT: prevent fabricated 'system' actor entries
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Users can insert their own audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = actor_id
  AND actor_type <> 'system'
);

-- Allow organization members to view their organization
CREATE POLICY "Members can view their organizations"
ON public.organizations
FOR SELECT
USING (
  id IN (
    SELECT organization_id FROM public.organization_members
    WHERE user_id = (SELECT auth.uid())
  )
);
