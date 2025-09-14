import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

interface FlutterwaveWebhookPayload {
  event: string;
  data: {
    id: string;
    tx_ref: string;
    status: string;
    amount: number;
    currency: string;
    customer: {
      email: string;
    };
    meta?: {
      organizationId?: string;
      planType?: string;
    };
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify webhook secret
    const webhookSecret = req.headers.get('x-webhook-secret');
    const expectedSecret = Deno.env.get('FLUTTERWAVE_WEBHOOK_SECRET');
    
    if (webhookSecret !== expectedSecret) {
      throw new Error('Invalid webhook secret');
    }

    const payload: FlutterwaveWebhookPayload = await req.json();
    
    console.log('Flutterwave webhook received:', payload);

    // Handle successful payment
    if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
      const { organizationId, planType } = payload.data.meta || {};
      
      if (organizationId && planType) {
        // Update organization plan
        const { error: updateError } = await supabase
          .from('organizations')
          .update({ plan_type: planType })
          .eq('id', organizationId);

        if (updateError) {
          throw updateError;
        }

        // Log billing event
        await supabase
          .from('billing_events')
          .insert([{
            organization_id: organizationId,
            event_type: 'payment_completed',
            old_plan: 'lite', // Assuming upgrading from lite
            new_plan: planType,
            provider: 'flutterwave',
            amount: payload.data.amount,
            currency: payload.data.currency,
            external_id: payload.data.id
          }]);

        console.log(`Organization ${organizationId} upgraded to ${planType}`);
      }
    }

    // Handle failed payments
    if (payload.event === 'charge.failed') {
      const { organizationId } = payload.data.meta || {};
      
      if (organizationId) {
        await supabase
          .from('billing_events')
          .insert([{
            organization_id: organizationId,
            event_type: 'payment_failed',
            provider: 'flutterwave',
            amount: payload.data.amount,
            currency: payload.data.currency,
            external_id: payload.data.id
          }]);

        console.log(`Payment failed for organization ${organizationId}`);
      }
    }

    // Handle refunds/downgrades
    if (payload.event === 'charge.refunded') {
      const { organizationId } = payload.data.meta || {};
      
      if (organizationId) {
        // Downgrade to lite plan
        const { error: updateError } = await supabase
          .from('organizations')
          .update({ plan_type: 'lite' })
          .eq('id', organizationId);

        if (updateError) {
          throw updateError;
        }

        // Log billing event
        await supabase
          .from('billing_events')
          .insert([{
            organization_id: organizationId,
            event_type: 'refund_processed',
            old_plan: 'pro',
            new_plan: 'lite',
            provider: 'flutterwave',
            amount: payload.data.amount,
            currency: payload.data.currency,
            external_id: payload.data.id
          }]);

        // Send downgrade email notification
        try {
          await supabase.functions.invoke('send-downgrade-email', {
            body: { organizationId }
          });
        } catch (emailError) {
          console.error('Error sending downgrade email:', emailError);
        }

        console.log(`Organization ${organizationId} downgraded due to refund`);
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Error in flutterwave-webhook function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

serve(handler);