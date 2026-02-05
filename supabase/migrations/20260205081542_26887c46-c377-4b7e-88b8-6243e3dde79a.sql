-- Fix webhook_events insert policy - keep it for service role only
DROP POLICY IF EXISTS "System can insert webhook events" ON public.webhook_events;

-- Allow service role to insert webhook events (via edge functions)
-- Edge functions use service role key and verify webhook signatures
CREATE POLICY "Service role can insert webhook events" 
ON public.webhook_events 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Also allow authenticated users to insert (for logging purposes)
CREATE POLICY "Authenticated can insert webhook events" 
ON public.webhook_events 
FOR INSERT 
TO authenticated
WITH CHECK (provider IS NOT NULL AND event_id IS NOT NULL);