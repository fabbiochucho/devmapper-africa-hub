import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Verify HMAC signature
    const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (PAYSTACK_SECRET && signature) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(PAYSTACK_SECRET),
        { name: 'HMAC', hash: 'SHA-512' },
        false,
        ['sign']
      );
      const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
      const expectedSig = Array.from(new Uint8Array(sig))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      if (signature !== expectedSig) {
        console.error('Invalid Paystack signature');
        return new Response('Invalid signature', { status: 401, headers: corsHeaders });
      }
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
        // Update organization plan
        await supabase
          .from('organizations')
          .update({
            plan_type: metadata.plan_type || 'pro',
            plan_started_at: new Date().toISOString(),
            plan_expires_at: metadata.interval === 'yearly'
              ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            // Update quotas based on plan
            project_cap: metadata.plan_type === 'advanced' ? 150 : metadata.plan_type === 'pro' ? 40 : 10,
            monthly_addition: metadata.plan_type === 'advanced' ? 15 : metadata.plan_type === 'pro' ? 5 : 3,
            rollover_allowed: metadata.plan_type !== 'lite' && metadata.plan_type !== 'free',
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
