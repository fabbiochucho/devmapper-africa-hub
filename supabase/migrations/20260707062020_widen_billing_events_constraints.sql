-- billing_events.event_type / provider CHECK constraints never matched what
-- the payment edge functions actually insert:
--   - create-payment and paystack-webhook insert event_type
--     'payment_initiated' / 'payment_success', not in the original
--     ('upgrade','downgrade','payment','refund') list.
--   - flutterwave-webhook (and the new refund handling) insert
--     provider 'flutterwave', not in the original ('stripe','paystack') list.
-- Both silently violated the CHECK constraint on insert. Widen rather than
-- narrow the application code, since these are the meaningful distinct
-- states already relied on across multiple functions.

ALTER TABLE public.billing_events DROP CONSTRAINT IF EXISTS billing_events_event_type_check;
ALTER TABLE public.billing_events ADD CONSTRAINT billing_events_event_type_check
  CHECK (event_type IN ('upgrade', 'downgrade', 'payment', 'payment_initiated', 'payment_success', 'refund'));

ALTER TABLE public.billing_events DROP CONSTRAINT IF EXISTS billing_events_provider_check;
ALTER TABLE public.billing_events ADD CONSTRAINT billing_events_provider_check
  CHECK (provider IN ('stripe', 'paystack', 'flutterwave'));
