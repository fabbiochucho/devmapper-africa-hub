import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PaymentRequest {
  // Organization payment
  organizationId?: string;
  provider?: 'flutterwave' | 'paystack';
  planType?: 'lite' | 'pro';
  interval?: 'monthly' | 'yearly';
  // Donation payment
  payment_type?: 'subscription' | 'donation';
  amount: number;
  currency?: string;
  email?: string;
  name?: string;
  campaign_id?: string;
  donation_id?: string;
  redirect_url?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData: PaymentRequest = await req.json();
    const { payment_type, amount, currency = 'USD' } = requestData;

    console.log('Processing payment request:', requestData);

    // Handle donation payments (can be anonymous)
    if (payment_type === 'donation') {
      const { email, name, campaign_id, donation_id, redirect_url } = requestData;
      
      if (!email || !campaign_id || !donation_id) {
        throw new Error('Missing required donation fields');
      }

      const FLUTTERWAVE_SECRET = Deno.env.get('FLUTTERWAVE_SECRET_KEY');
      
      if (!FLUTTERWAVE_SECRET) {
        console.log('Flutterwave secret not configured, using mock payment');
        // Mock payment for development
        return new Response(
          JSON.stringify({ 
            success: true, 
            payment_link: `${redirect_url}&mock_payment=true&donation_id=${donation_id}`,
            message: 'Mock payment link generated (Flutterwave not configured)'
          }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Create Flutterwave payment link
      const tx_ref = `donation_${donation_id}_${Date.now()}`;
      
      const flutterwavePayload = {
        tx_ref,
        amount,
        currency,
        redirect_url: redirect_url || `${Deno.env.get('SUPABASE_URL')}/functions/v1/flutterwave-webhook`,
        customer: {
          email,
          name: name || 'Anonymous Donor'
        },
        customizations: {
          title: 'DevMapper Donation',
          description: `Donation to campaign ${campaign_id}`,
          logo: 'https://devmapper.africa/logo.png'
        },
        meta: {
          donation_id,
          campaign_id,
          payment_type: 'donation'
        }
      };

      const response = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FLUTTERWAVE_SECRET}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(flutterwavePayload)
      });

      const flutterwaveData = await response.json();
      console.log('Flutterwave response:', flutterwaveData);

      if (flutterwaveData.status === 'success' && flutterwaveData.data?.link) {
        // Update donation with transaction reference
        await supabase
          .from('campaign_donations')
          .update({ payment_intent_id: tx_ref })
          .eq('id', donation_id);

        return new Response(
          JSON.stringify({ 
            success: true, 
            payment_link: flutterwaveData.data.link,
            tx_ref
          }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      throw new Error(flutterwaveData.message || 'Failed to create payment link');
    }

    // Handle subscription payments (requires authentication)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      throw new Error('Invalid authorization');
    }

    const { organizationId, provider, planType, interval } = requestData;

    // Verify user has access to the organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .eq('created_by', user.id)
      .single();

    if (orgError || !org) {
      throw new Error('Organization not found or access denied');
    }

    const FLUTTERWAVE_SECRET = Deno.env.get('FLUTTERWAVE_SECRET_KEY');
    
    if (provider === 'flutterwave' && FLUTTERWAVE_SECRET) {
      // Create real Flutterwave payment
      const tx_ref = `sub_${organizationId}_${Date.now()}`;
      
      const flutterwavePayload = {
        tx_ref,
        amount,
        currency: 'USD',
        redirect_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/flutterwave-webhook`,
        customer: {
          email: user.email,
          name: user.user_metadata?.full_name || 'DevMapper User'
        },
        customizations: {
          title: 'DevMapper Subscription',
          description: `${planType} plan - ${interval}ly`,
          logo: 'https://devmapper.africa/logo.png'
        },
        meta: {
          organization_id: organizationId,
          plan_type: planType,
          interval,
          payment_type: 'subscription'
        }
      };

      const response = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FLUTTERWAVE_SECRET}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(flutterwavePayload)
      });

      const flutterwaveData = await response.json();

      if (flutterwaveData.status === 'success' && flutterwaveData.data?.link) {
        // Log billing event
        await supabase
          .from('billing_events')
          .insert([{
            organization_id: organizationId,
            event_type: 'payment_initiated',
            old_plan: org.plan_type,
            new_plan: planType,
            provider: 'flutterwave',
            amount,
            currency: 'USD',
            external_id: tx_ref
          }]);

        return new Response(
          JSON.stringify({ 
            success: true, 
            url: flutterwaveData.data.link,
            message: 'Redirecting to Flutterwave checkout...'
          }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
    }

    // Fallback to mock payment for development
    const paymentUrl = provider === 'flutterwave' 
      ? `https://checkout.flutterwave.com/demo?plan=${planType}&interval=${interval}&amount=${amount}`
      : `https://checkout.paystack.com/demo?plan=${planType}&interval=${interval}&amount=${amount}`;
    
    // Log billing event
    await supabase
      .from('billing_events')
      .insert([{
        organization_id: organizationId,
        event_type: 'payment_initiated',
        old_plan: org.plan_type,
        new_plan: planType,
        provider: provider || 'flutterwave',
        amount,
        currency: 'USD'
      }]);

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: paymentUrl,
        message: `Redirecting to ${provider} checkout...`
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (error) {
    console.error('Error in create-payment function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);
