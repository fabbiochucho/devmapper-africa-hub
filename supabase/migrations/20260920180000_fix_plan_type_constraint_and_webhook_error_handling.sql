-- CRITICAL (edge function audit): organizations_plan_type_check only
-- allowed 'lite'/'pro', but BillingUpgrade.tsx genuinely offers
-- 'advanced' and 'enterprise' as purchasable plans, and
-- paystack-webhook/flutterwave-webhook/create-payment all reference
-- those values. Every customer who purchased 'advanced' or 'enterprise'
-- had their payment succeed while the plan_type UPDATE silently failed
-- the CHECK constraint - paystack-webhook didn't check the update error
-- (fixed separately in this same migration set), so it went on to log
-- plan_upgraded/payment_success as if the plan actually changed.
ALTER TABLE public.organizations DROP CONSTRAINT organizations_plan_type_check;
ALTER TABLE public.organizations ADD CONSTRAINT organizations_plan_type_check
  CHECK (plan_type = ANY (ARRAY['lite'::text, 'pro'::text, 'advanced'::text, 'enterprise'::text]));
