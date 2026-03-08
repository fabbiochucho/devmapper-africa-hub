-- Fix CRITICAL: Privilege escalation via user_roles UPDATE policy
-- Drop the current overly permissive update policy
DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;

-- Create restricted update policy that prevents self-promotion to admin roles
CREATE POLICY "Users can update their own non-admin roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  (auth.uid() = user_id) 
  AND (role <> ALL (ARRAY['admin'::app_role, 'platform_admin'::app_role, 'country_admin'::app_role]))
);

-- Fix: Remove any authenticated INSERT policy on webhook_events
-- (Only service_role should insert webhook events)
DROP POLICY IF EXISTS "Authenticated can insert webhook events" ON public.webhook_events;
DROP POLICY IF EXISTS "Authenticated users can insert webhook events" ON public.webhook_events;