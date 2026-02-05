-- Fix SECURITY DEFINER view issue - recreate public_profiles with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS SELECT 
  id,
  user_id,
  full_name,
  avatar_url,
  organization,
  country,
  is_verified,
  created_at
FROM public.profiles;

-- Grant necessary permissions
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Fix overly permissive RLS policies
-- Update audit_logs insert policy to be more restrictive
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = actor_id OR actor_type = 'system');

-- Update esg_audit_logs insert policy
DROP POLICY IF EXISTS "System can insert ESG audit logs" ON public.esg_audit_logs;
CREATE POLICY "Authenticated users can insert ESG audit logs" 
ON public.esg_audit_logs 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id OR 
  organization_id IN (
    SELECT id FROM organizations WHERE created_by = auth.uid()
  )
);

-- Update webhook_events insert policy (keep permissive for webhook handlers)
-- This is intentionally permissive as webhooks need to insert without auth
-- The security is handled by webhook signature verification in edge functions

-- Add index for better query performance on user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_active ON public.user_roles(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);