import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyHmacSignature } from "../_shared/webhookSignature.ts";
import { downgradeOrganizationForRefund } from "../_shared/planDowngrade.ts";
import { computePlanExpiry, getPlanQuotas } from "../_shared/planQuotas.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const signature = req.headers.get('x-paystack-signature');
    const body = await req.text();

    // Verify HMAC signature - MANDATORY
    const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!PAYSTACK_SECRET) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    if (!signature) {
      return new Response('Missing signature', { status: 401, headers: corsHeaders });
    }

    const isValidSignature = await verifyHmacSignature(PAYSTACK_SECRET, body, signature, 'SHA-512');
    if (!isValidSignature) {
      console.error('Invalid Paystack signature');
      return new Response('Invalid signature', { status: 401, headers: corsHeaders });
    }

    const event = JSON.parse(body);
    console.log('Paystack webhook event:', event.event, event.data?.reference);

    // Idempotency check
    const eventId = event.data?.reference || event.data?.id?.toString() || '';
    const { data: alreadyProcessed } = await supabase.rpc('check_webhook_processed', {
      p_event_id: eventId,
      p_provider: 'paystack'
    });

    if (alreadyProcessed) {
      console.log('Event already processed:', eventId);
      return new Response(JSON.stringify({ message: 'Already processed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (event.event === 'charge.success') {
      const { metadata, amount, currency, reference } = event.data;

      if (metadata?.payment_type === 'subscription' && metadata?.organization_id) {
        // Whitelist plan types to prevent arbitrary values from webhook payload
        const VALID_PLANS = ['lite', 'pro', 'advanced', 'enterprise'];
        const requestedPlan = metadata.plan_type;
        if (!requestedPlan || !VALID_PLANS.includes(requestedPlan)) {
          console.error('Invalid plan type in Paystack webhook:', requestedPlan);
          return new Response(JSON.stringify({ error: 'Invalid plan type' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        // Update organization plan
        await supabase
          .from('organizations')
          .update({
            plan_type: requestedPlan,
            plan_started_at: new Date().toISOString(),
            plan_expires_at: computePlanExpiry(metadata.interval),
            ...getPlanQuotas(requestedPlan),
          })
          .eq('id', metadata.organization_id);

        // Log billing event
        await supabase.from('billing_events').insert([{
          organization_id: metadata.organization_id,
          event_type: 'payment_success',
          new_plan: metadata.plan_type,
          provider: 'paystack',
          amount: amount / 100, // Paystack amounts are in kobo/cents
          currency: currency || 'NGN',
          external_id: reference,
        }]);
      }

      if (metadata?.payment_type === 'donation' && metadata?.donation_id) {
        await supabase
          .from('campaign_donations')
          .update({ status: 'completed', payment_intent_id: reference })
          .eq('id', metadata.donation_id);
      }
    }

    // Paystack's refund payload nests the original transaction (and its
    // metadata) under data.transaction — fall back to top-level fields in
    // case the shape differs; verify against a real test webhook once live.
    if (event.event === 'refund.processed') {
      const refundData = event.data || {};
      const transaction = refundData.transaction || {};
      const metadata = transaction.metadata || refundData.metadata || {};
      const organizationId = metadata.organization_id || metadata.organizationId;

      if (!organizationId) {
        console.warn('Refund event received without organization_id in metadata:', eventId);
      } else {
        const result = await downgradeOrganizationForRefund(supabase, {
          organizationId,
          provider: 'paystack',
          amount: refundData.amount != null ? refundData.amount / 100 : undefined,
          currency: refundData.currency,
          externalId: transaction.reference || refundData.transaction_reference,
        });

        if (!result.success) {
          console.error('Refund downgrade failed:', result.reason);
        }
      }
    }

    // Record webhook event
    await supabase.rpc('record_webhook_event', {
      p_event_id: eventId,
      p_provider: 'paystack',
      p_event_type: event.event,
      p_payload: event,
      p_status: 'success'
    });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.error('Paystack webhook error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
