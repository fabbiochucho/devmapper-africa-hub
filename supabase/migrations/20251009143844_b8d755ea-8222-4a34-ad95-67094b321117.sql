-- ============================================================
-- PHASE 1: SECURITY BASELINE MIGRATION
-- Implements audit logging, webhook security, and view fixes
-- ============================================================

-- 1. Create audit_logs table for security event tracking
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'system', 'webhook', 'admin')),
  org_id UUID REFERENCES public.organizations(id),
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_audit_logs_actor_id ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_org_id ON public.audit_logs(org_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);

-- RLS for audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
ON public.audit_logs
FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Org owners can view their org audit logs
CREATE POLICY "Org owners can view their audit logs"
ON public.audit_logs
FOR SELECT
USING (
  org_id IN (
    SELECT id FROM public.organizations WHERE created_by = auth.uid()
  )
);

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.audit_logs
FOR INSERT
WITH CHECK (true);

-- 2. Create webhook_events table for idempotency
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'paystack', 'flutterwave')),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processing_status TEXT NOT NULL CHECK (processing_status IN ('success', 'failed', 'duplicate')) DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for webhook events
CREATE INDEX idx_webhook_events_event_id ON public.webhook_events(event_id);
CREATE INDEX idx_webhook_events_provider ON public.webhook_events(provider);
CREATE INDEX idx_webhook_events_created_at ON public.webhook_events(created_at DESC);

-- RLS for webhook_events
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view webhook events
CREATE POLICY "Admins can view webhook events"
ON public.webhook_events
FOR SELECT
USING (has_role(auth.uid(), 'platform_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- System can insert webhook events
CREATE POLICY "System can insert webhook events"
ON public.webhook_events
FOR INSERT
WITH CHECK (true);

-- 3. Fix public_profiles view to be SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  full_name,
  avatar_url,
  organization,
  country,
  is_verified,
  created_at
FROM public.profiles;

-- Add RLS to the view
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Grant access to authenticated and anonymous users
GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- Add explicit RLS policy for the view
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);

-- 4. Add helper function to log audit events
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_actor_id UUID,
  p_actor_type TEXT,
  p_org_id UUID,
  p_action TEXT,
  p_target_table TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_payload JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    actor_id,
    actor_type,
    org_id,
    action,
    target_table,
    target_id,
    payload
  ) VALUES (
    p_actor_id,
    p_actor_type,
    p_org_id,
    p_action,
    p_target_table,
    p_target_id,
    p_payload
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$;

-- 5. Add helper function to check webhook idempotency
CREATE OR REPLACE FUNCTION public.check_webhook_processed(
  p_event_id TEXT,
  p_provider TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.webhook_events 
    WHERE event_id = p_event_id 
    AND provider = p_provider
  );
END;
$$;

-- 6. Add helper function to record webhook event
CREATE OR REPLACE FUNCTION public.record_webhook_event(
  p_event_id TEXT,
  p_provider TEXT,
  p_event_type TEXT,
  p_payload JSONB,
  p_status TEXT DEFAULT 'success',
  p_error_message TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_webhook_id UUID;
BEGIN
  INSERT INTO public.webhook_events (
    event_id,
    provider,
    event_type,
    payload,
    processing_status,
    error_message
  ) VALUES (
    p_event_id,
    p_provider,
    p_event_type,
    p_payload,
    p_status,
    p_error_message
  ) RETURNING id INTO v_webhook_id;
  
  RETURN v_webhook_id;
END;
$$;

COMMENT ON TABLE public.audit_logs IS 'Security audit log for tracking critical operations';
COMMENT ON TABLE public.webhook_events IS 'Webhook event tracking for idempotency and debugging';
COMMENT ON FUNCTION public.log_audit_event IS 'Helper function to log security audit events';
COMMENT ON FUNCTION public.check_webhook_processed IS 'Check if a webhook event has already been processed';
COMMENT ON FUNCTION public.record_webhook_event IS 'Record a webhook event for idempotency tracking';