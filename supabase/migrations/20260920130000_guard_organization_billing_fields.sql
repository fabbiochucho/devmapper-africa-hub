-- CRITICAL (RLS audit): "Users can update their organizations" (USING
-- created_by = auth.uid()) has no WITH CHECK, so any org creator could
-- self-write plan_type directly - bypassing payment entirely. Confirmed
-- plan_type is legitimately written only by paystack-webhook,
-- flutterwave-webhook, and create-payment (all service_role, only after
-- verified payment) - PaymentCallback.tsx only polls/reads it client-side,
-- never writes it. Also guards the other entitlement fields that ride
-- along with a plan (quota, caps, ESG limits, scholarship override).
--
-- Follows the same service_role-exemption pattern as the existing
-- block_carbon_order_price_update trigger, since the legitimate writers
-- here are backend webhooks, not an admin user session. current_setting()
-- returns NULL (not false) when the GUC is unset for a normal
-- authenticated request, and NULL propagates through OR/NOT in SQL -
-- wrapped in coalesce(..., false) so a plain authenticated caller doesn't
-- silently short-circuit the whole guard to a no-op.
CREATE OR REPLACE FUNCTION public.guard_organization_billing_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (NEW.plan_type IS DISTINCT FROM OLD.plan_type
      OR NEW.plan_started_at IS DISTINCT FROM OLD.plan_started_at
      OR NEW.plan_expires_at IS DISTINCT FROM OLD.plan_expires_at
      OR NEW.scholarship_override IS DISTINCT FROM OLD.scholarship_override
      OR NEW.project_quota_remaining IS DISTINCT FROM OLD.project_quota_remaining
      OR NEW.project_cap IS DISTINCT FROM OLD.project_cap
      OR NEW.monthly_addition IS DISTINCT FROM OLD.monthly_addition
      OR NEW.rollover_allowed IS DISTINCT FROM OLD.rollover_allowed
      OR NEW.esg_enabled IS DISTINCT FROM OLD.esg_enabled
      OR NEW.esg_suppliers_limit IS DISTINCT FROM OLD.esg_suppliers_limit
      OR NEW.esg_scenarios_limit IS DISTINCT FROM OLD.esg_scenarios_limit
      OR NEW.alphaearth_api_calls_limit IS DISTINCT FROM OLD.alphaearth_api_calls_limit
      OR NEW.compliance_tier IS DISTINCT FROM OLD.compliance_tier)
     AND NOT (
       has_role(auth.uid(), 'admin'::app_role)
       OR has_role(auth.uid(), 'platform_admin'::app_role)
       OR coalesce(current_setting('request.jwt.claim.role', true) = 'service_role', false)
       OR session_user = 'service_role'
     )
  THEN
    RAISE EXCEPTION 'Only payment processing or admins can change billing/entitlement fields';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_organization_billing_fields_trigger ON public.organizations;
CREATE TRIGGER guard_organization_billing_fields_trigger
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.guard_organization_billing_fields();
