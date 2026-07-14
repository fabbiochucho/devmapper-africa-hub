import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyHmacSignature } from "../_shared/webhookSignature.ts";
import { downgradeOrganizationForRefund } from "../_shared/planDowngrade.ts";
import { computePlanExpiry, getPlanQuotas } from "../_shared/planQuotas.ts";
import { confirmOrderPaid } from "../_shared/marketplaceOrders.ts";

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

        // Validate organization exists before updating - matches
        // flutterwave-webhook's parity check (previously missing here,
        // meaning a bad/stale organization_id in the webhook metadata
        // would silently no-op the update instead of being caught).
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select('id, plan_type')
          .eq('id', metadata.organization_id)
          .single();

        if (orgError || !org) {
          console.error('Organization not found:', metadata.organization_id);
          await supabase.rpc('record_webhook_event', {
            p_event_id: eventId,
            p_provider: 'paystack',
            p_event_type: event.event,
            p_payload: event,
            p_status: 'failed',
            p_error_message: `Organization not found: ${metadata.organization_id}`
          });
          return new Response(JSON.stringify({ error: 'Organization not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const oldPlan = org.plan_type;

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

        // Log audit event - matches flutterwave-webhook's parity step,
        // previously missing here.
        await supabase.rpc('log_audit_event', {
          p_actor_id: null,
          p_actor_type: 'webhook',
          p_org_id: metadata.organization_id,
          p_action: 'plan_upgraded',
          p_target_table: 'organizations',
          p_target_id: metadata.organization_id,
          p_payload: {
            old_plan: oldPlan,
            new_plan: requestedPlan,
            amount: amount / 100,
            currency: currency || 'NGN',
            transaction_id: reference,
            provider: 'paystack'
          }
        });

        // Log billing event
        await supabase.from('billing_events').insert([{
          organization_id: metadata.organization_id,
          event_type: 'payment_success',
          old_plan: oldPlan,
          new_plan: metadata.plan_type,
          provider: 'paystack',
          amount: amount / 100, // Paystack amounts are in kobo/cents
          currency: currency || 'NGN',
          external_id: reference,
        }]);
      }

      if (metadata?.payment_type === 'donation' && metadata?.donation_id) {
        // Guard on status != 'completed' so a duplicate webhook delivery
        // (on top of the idempotency check already done above) can't
        // double-increment the campaign total. Use the donation's own
        // stored amount (not the gateway's amount field) since it's
        // already in the campaign's currency/unit.
        const { data: donation } = await supabase
          .from('campaign_donations')
          .update({ status: 'completed', payment_intent_id: reference })
          .eq('id', metadata.donation_id)
          .neq('status', 'completed')
          .select('campaign_id, amount')
          .maybeSingle();

        if (donation) {
          const { error: incrementError } = await supabase.rpc('increment_campaign_raised_amount', {
            p_campaign_id: donation.campaign_id,
            p_amount: donation.amount,
          });
          if (incrementError) {
            console.error('Failed to increment campaign raised_amount:', incrementError);
          }
        }
      }

      if (metadata?.payment_type === 'marketplace_purchase' && metadata?.order_id) {
        const result = await confirmOrderPaid(supabase, metadata.order_id, reference);
        if (!result.success) {
          console.error('Marketplace purchase confirmation failed:', result.reason);
        }
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
