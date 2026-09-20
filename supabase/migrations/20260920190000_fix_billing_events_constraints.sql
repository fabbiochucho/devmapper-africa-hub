-- CRITICAL (found while verifying the create-payment amount-trust fix):
-- billing_events_provider_check only allowed 'stripe'/'paystack', and
-- billing_events_event_type_check only allowed
-- 'upgrade'/'downgrade'/'payment'/'refund' - but create-payment,
-- paystack-webhook, flutterwave-webhook, and organization-management all
-- insert provider:'flutterwave' and event_type:'payment_initiated'/
-- 'payment_success' as part of their real, currently-active code paths.
-- None of these inserts check/throw on the resulting constraint
-- violation (flutterwave-webhook's does log it to console, the rest
-- don't even do that), so every real payment through Flutterwave, and
-- every 'payment_initiated'/'payment_success' event through either
-- provider, has been silently missing from the billing_events audit
-- trail - confirmed live: a real create-payment call returned success
-- with the correct amount, but produced zero billing_events row.
ALTER TABLE public.billing_events DROP CONSTRAINT billing_events_provider_check;
ALTER TABLE public.billing_events ADD CONSTRAINT billing_events_provider_check
  CHECK (provider = ANY (ARRAY['stripe'::text, 'paystack'::text, 'flutterwave'::text, 'system'::text]));

ALTER TABLE public.billing_events DROP CONSTRAINT billing_events_event_type_check;
ALTER TABLE public.billing_events ADD CONSTRAINT billing_events_event_type_check
  CHECK (event_type = ANY (ARRAY['upgrade'::text, 'downgrade'::text, 'payment'::text, 'refund'::text, 'payment_initiated'::text, 'payment_success'::text]));
