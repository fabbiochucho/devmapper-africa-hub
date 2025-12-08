import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, verif-hash',
};

// HMAC-SHA256 signature verification using Web Crypto API
async function verifyHmacSignature(secret: string, payload: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const expectedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // Constant-time comparison to prevent timing attacks
  if (signature.length !== expectedHash.length) return false;
  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return result === 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const webhookSecretKey = Deno.env.get("FLUTTERWAVE_SECRET_KEY");

    if (!supabaseUrl || !supabaseServiceKey || !webhookSecretKey) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the raw body for signature verification
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);

    // 1. VERIFY WEBHOOK SIGNATURE using HMAC-SHA256
    const verifHash = req.headers.get("verif-hash");
    if (!verifHash) {
      console.error("Missing verif-hash header");
      return new Response(
        JSON.stringify({ error: "Missing signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isValidSignature = await verifyHmacSignature(webhookSecretKey, rawBody, verifHash);
    if (!isValidSignature) {
      console.error("Invalid webhook signature - HMAC verification failed");
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
      const organizationId = metadata.organizationId || metadata.organization_id;
      const newPlan = metadata.planType || metadata.plan_type || 'pro';

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
        .update({ plan_type: newPlan })
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
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
