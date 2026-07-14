import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { constantTimeEqual } from "../_shared/webhookSignature.ts";
import { downgradeOrganizationForRefund } from "../_shared/planDowngrade.ts";
import { computePlanExpiry, getPlanQuotas } from "../_shared/planQuotas.ts";
import { confirmOrderPaid } from "../_shared/marketplaceOrders.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, verif-hash',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const secretHash = Deno.env.get("FLUTTERWAVE_SECRET_HASH");

    if (!supabaseUrl || !supabaseServiceKey || !secretHash) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the raw body for signature verification
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);

    // 1. VERIFY WEBHOOK SIGNATURE
    // Flutterwave's verif-hash is the static secret_hash configured in the
    // dashboard, sent verbatim on every webhook — not an HMAC of the body.
    const verifHash = req.headers.get("verif-hash");
    if (!verifHash) {
      console.error("Missing verif-hash header");
      return new Response(
        JSON.stringify({ error: "Missing signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isValidSignature = constantTimeEqual(verifHash, secretHash);
    if (!isValidSignature) {
      console.error("Invalid webhook signature - verif-hash mismatch");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Webhook signature verified successfully");

    // 2. CHECK IDEMPOTENCY
    const eventId = payload.id || payload.event_id || payload.txRef;
    if (!eventId) {
      console.error("Missing event ID in payload");
      return new Response(
        JSON.stringify({ error: "Missing event ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: existingEvent } = await supabase.rpc('check_webhook_processed', {
      p_event_id: eventId,
      p_provider: 'flutterwave'
    });

    if (existingEvent) {
      console.log("Webhook event already processed:", eventId);
      await supabase.rpc('record_webhook_event', {
        p_event_id: eventId,
        p_provider: 'flutterwave',
        p_event_type: payload.event || 'unknown',
        p_payload: payload,
        p_status: 'duplicate'
      });
      return new Response(
        JSON.stringify({ message: "Event already processed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. PROCESS WEBHOOK EVENT
    const event = payload.event || payload.status;
    const data = payload.data || payload;

    console.log("Processing webhook event:", event);

    if (event === "charge.completed" && data.status === "successful") {
      const metadata = data.meta || data.metadata || {};
      const paymentType = metadata.payment_type || metadata.paymentType;
      const externalId = (data.id ?? data.tx_ref)?.toString();

      // Marketplace credit purchases and donations are keyed off payment_type
      // in the charge's meta - anything else falls through to the existing
      // subscription-upgrade handling below (which never checked payment_type
      // itself, so it stays the default for backward compatibility).
      if (paymentType === 'marketplace_purchase') {
        const orderId = metadata.order_id;
        if (!orderId) {
          console.error("Missing order_id in metadata");
          await supabase.rpc('record_webhook_event', {
            p_event_id: eventId, p_provider: 'flutterwave', p_event_type: event,
            p_payload: payload, p_status: 'failed', p_error_message: 'Missing order_id in metadata'
          });
          return new Response(
            JSON.stringify({ error: "Missing order_id" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const result = await confirmOrderPaid(supabase, orderId, externalId);
        await supabase.rpc('record_webhook_event', {
          p_event_id: eventId, p_provider: 'flutterwave', p_event_type: event,
          p_payload: payload, p_status: result.success ? 'success' : 'failed',
          p_error_message: result.success ? null : result.reason,
        });
        return new Response(
          JSON.stringify({ message: result.success ? "Marketplace purchase processed" : "Marketplace purchase processing failed" }),
          { status: result.success ? 200 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (paymentType === 'donation') {
        const donationId = metadata.donation_id;
        if (!donationId) {
          console.error("Missing donation_id in metadata");
          await supabase.rpc('record_webhook_event', {
            p_event_id: eventId, p_provider: 'flutterwave', p_event_type: event,
            p_payload: payload, p_status: 'failed', p_error_message: 'Missing donation_id in metadata'
          });
          return new Response(
            JSON.stringify({ error: "Missing donation_id" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Guard on status != 'completed' so a duplicate webhook delivery
        // (on top of the idempotency check already done above) can't
        // double-increment the campaign total. Use the donation's own
        // stored amount (not the gateway's amount field) since it's
        // already in the campaign's currency/unit.
        const { data: donation, error: donationError } = await supabase
          .from('campaign_donations')
          .update({ status: 'completed', payment_intent_id: externalId })
          .eq('id', donationId)
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

        await supabase.rpc('record_webhook_event', {
          p_event_id: eventId, p_provider: 'flutterwave', p_event_type: event,
          p_payload: payload, p_status: donationError ? 'failed' : 'success',
          p_error_message: donationError?.message ?? null,
        });
        return new Response(
          JSON.stringify({ message: donationError ? "Donation processing failed" : "Donation processed" }),
          { status: donationError ? 500 : 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const organizationId = metadata.organizationId || metadata.organization_id;
      const interval = metadata.interval;
      const VALID_PLANS = ['lite', 'pro', 'advanced', 'enterprise'];
      const requestedPlan = metadata.planType || metadata.plan_type || 'pro';
      if (!VALID_PLANS.includes(requestedPlan)) {
        console.error("Invalid plan_type in metadata:", requestedPlan);
        return new Response(
          JSON.stringify({ error: "Invalid plan type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const newPlan = requestedPlan;

      if (!organizationId) {
        console.error("Missing organizationId in metadata");
        await supabase.rpc('record_webhook_event', {
          p_event_id: eventId,
          p_provider: 'flutterwave',
          p_event_type: event,
          p_payload: payload,
          p_status: 'failed',
          p_error_message: 'Missing organizationId in metadata'
        });
        return new Response(
          JSON.stringify({ error: "Missing organizationId" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 4. VALIDATE ORGANIZATION OWNERSHIP
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("id, created_by, plan_type, name")
        .eq("id", organizationId)
        .single();

      if (orgError || !org) {
        console.error("Organization not found:", organizationId);
        await supabase.rpc('record_webhook_event', {
          p_event_id: eventId,
          p_provider: 'flutterwave',
          p_event_type: event,
          p_payload: payload,
          p_status: 'failed',
          p_error_message: `Organization not found: ${organizationId}`
        });
        return new Response(
          JSON.stringify({ error: "Organization not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const oldPlan = org.plan_type;

      // 5. UPDATE PLAN
      const { error: updateError } = await supabase
        .from("organizations")
        .update({
          plan_type: newPlan,
          plan_started_at: new Date().toISOString(),
          plan_expires_at: computePlanExpiry(interval),
          ...getPlanQuotas(newPlan),
        })
        .eq("id", organizationId);

      if (updateError) {
        console.error("Error updating organization plan:", updateError);
        await supabase.rpc('record_webhook_event', {
          p_event_id: eventId,
          p_provider: 'flutterwave',
          p_event_type: event,
          p_payload: payload,
          p_status: 'failed',
          p_error_message: updateError.message
        });
        throw updateError;
      }

      // 6. LOG AUDIT EVENT
      await supabase.rpc('log_audit_event', {
        p_actor_id: null,
        p_actor_type: 'webhook',
        p_org_id: organizationId,
        p_action: 'plan_upgraded',
        p_target_table: 'organizations',
        p_target_id: organizationId,
        p_payload: {
          old_plan: oldPlan,
          new_plan: newPlan,
          amount: data.amount,
          currency: data.currency,
          transaction_id: data.id || data.tx_ref,
          provider: 'flutterwave'
        }
      });

      // 7. LOG BILLING EVENT
      const { error: billingError } = await supabase
        .from("billing_events")
        .insert({
          organization_id: organizationId,
          event_type: "upgrade",
          old_plan: oldPlan,
          new_plan: newPlan,
          amount: data.amount,
          currency: data.currency,
          provider: "flutterwave",
          external_id: data.id || data.tx_ref,
        });

      if (billingError) {
        console.error("Error logging billing event:", billingError);
      }

      // 8. RECORD WEBHOOK SUCCESS
      await supabase.rpc('record_webhook_event', {
        p_event_id: eventId,
        p_provider: 'flutterwave',
        p_event_type: event,
        p_payload: payload,
        p_status: 'success'
      });

      console.log("Successfully upgraded organization:", organizationId, "to plan:", newPlan);

      return new Response(
        JSON.stringify({ message: "Webhook processed successfully" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Flutterwave's refund event is documented as "refund.completed"; some
    // accounts instead report the refund via "charge.completed" with the
    // original transaction's status flipped to "refunded"/"reversed". Handle
    // both shapes — verify against a real test webhook (Settings > Webhooks >
    // Resend) once live, since exact field names aren't verifiable from here.
    if (
      event === "refund.completed" ||
      (event === "charge.completed" && (data.status === "refunded" || data.status === "reversed"))
    ) {
      const metadata = data.meta || data.metadata || {};
      const organizationId = metadata.organizationId || metadata.organization_id;

      if (!organizationId) {
        console.warn("Refund event received without organizationId in meta:", eventId);
      } else {
        const result = await downgradeOrganizationForRefund(supabase, {
          organizationId,
          provider: "flutterwave",
          amount: data.amount_refunded ?? data.amount,
          currency: data.currency,
          externalId: (data.id ?? data.tx_ref)?.toString(),
        });

        if (!result.success) {
          console.error("Refund downgrade failed:", result.reason);
        }
      }

      await supabase.rpc('record_webhook_event', {
        p_event_id: eventId,
        p_provider: 'flutterwave',
        p_event_type: event,
        p_payload: payload,
        p_status: 'success'
      });

      return new Response(
        JSON.stringify({ message: "Refund processed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For other events, just log them
    console.log("Unhandled webhook event:", event);
    await supabase.rpc('record_webhook_event', {
      p_event_id: eventId,
      p_provider: 'flutterwave',
      p_event_type: event,
      p_payload: payload,
      p_status: 'success'
    });

    return new Response(
      JSON.stringify({ message: "Event received but not processed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
