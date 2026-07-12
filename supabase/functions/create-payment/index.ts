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
  planType?: 'lite' | 'pro' | 'advanced' | 'enterprise';
  interval?: 'monthly' | 'yearly';
  // Donation payment
  payment_type?: 'subscription' | 'donation' | 'marketplace_purchase';
  amount: number;
  currency?: string;
  email?: string;
  name?: string;
  campaign_id?: string;
  donation_id?: string;
  redirect_url?: string;
  // Marketplace purchase payment
  order_id?: string;
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

      // Input validation
      const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (
        !email || !campaign_id || !donation_id ||
        typeof email !== 'string' || email.length > 255 || !emailRe.test(email) ||
        !uuidRe.test(campaign_id) || !uuidRe.test(donation_id) ||
        typeof amount !== 'number' || !isFinite(amount) || amount <= 0 || amount > 1_000_000 ||
        (name && (typeof name !== 'string' || name.length > 200)) ||
        (currency && !/^[A-Z]{3}$/.test(currency))
      ) {
        return new Response(JSON.stringify({ error: 'Invalid donation payload' }), {
          status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Verify the donation row exists, matches the request, and has not already been linked
      const { data: existingDonation, error: donationLookupError } = await supabase
        .from('campaign_donations')
        .select('id, campaign_id, amount, status, payment_intent_id')
        .eq('id', donation_id)
        .maybeSingle();

      if (donationLookupError || !existingDonation) {
        return new Response(JSON.stringify({ error: 'Donation not found' }), {
          status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      if (
        existingDonation.campaign_id !== campaign_id ||
        Number(existingDonation.amount) !== Number(amount) ||
        existingDonation.payment_intent_id !== null ||
        (existingDonation.status && !['pending', 'created'].includes(existingDonation.status))
      ) {
        return new Response(JSON.stringify({ error: 'Donation cannot be processed' }), {
          status: 409, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
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
        // Update donation with transaction reference (only if not already linked)
        await supabase
          .from('campaign_donations')
          .update({ payment_intent_id: tx_ref })
          .eq('id', donation_id)
          .is('payment_intent_id', null);

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

    // Handle carbon marketplace purchases
    if (payment_type === 'marketplace_purchase') {
      const { order_id, provider } = requestData;

      if (!order_id) {
        return new Response(JSON.stringify({ error: 'Missing order_id' }), {
          status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const { data: order, error: orderLookupError } = await supabase
        .from('carbon_credit_orders')
        .select('id, buyer_id, listing_id, total_amount, currency, status, payment_reference')
        .eq('id', order_id)
        .maybeSingle();

      if (
        orderLookupError || !order ||
        order.buyer_id !== user.id ||
        order.status !== 'pending' ||
        order.payment_reference !== null
      ) {
        return new Response(JSON.stringify({ error: 'Order cannot be processed' }), {
          status: 409, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const { data: listing } = await supabase
        .from('marketplace_listings')
        .select('title')
        .eq('id', order.listing_id)
        .maybeSingle();

      const tx_ref = `mkt_${order_id}_${Date.now()}`;
      const FLUTTERWAVE_SECRET = Deno.env.get('FLUTTERWAVE_SECRET_KEY');
      const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY');

      if (provider === 'paystack' && PAYSTACK_SECRET) {
        const paystackPayload = {
          email: user.email,
          amount: Math.round(order.total_amount * 100),
          currency: order.currency || 'NGN',
          reference: tx_ref,
          callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/paystack-webhook`,
          metadata: { order_id, payment_type: 'marketplace_purchase' },
        };

        const response = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(paystackPayload),
        });

        const paystackData = await response.json();
        if (paystackData.status && paystackData.data?.authorization_url) {
          return new Response(
            JSON.stringify({ success: true, url: paystackData.data.authorization_url }),
            { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
        throw new Error(paystackData.message || 'Failed to create Paystack payment link');
      }

      if (FLUTTERWAVE_SECRET) {
        const flutterwavePayload = {
          tx_ref,
          amount: order.total_amount,
          currency: order.currency || 'USD',
          redirect_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/flutterwave-webhook`,
          customer: { email: user.email, name: user.user_metadata?.full_name || 'DevMapper User' },
          customizations: {
            title: 'DevMapper Carbon Credit Purchase',
            description: listing?.title || 'Carbon credit purchase',
            logo: 'https://devmapper.africa/logo.png'
          },
          meta: { order_id, payment_type: 'marketplace_purchase' }
        };

        const response = await fetch('https://api.flutterwave.com/v3/payments', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${FLUTTERWAVE_SECRET}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(flutterwavePayload)
        });

        const flutterwaveData = await response.json();
        if (flutterwaveData.status === 'success' && flutterwaveData.data?.link) {
          return new Response(
            JSON.stringify({ success: true, url: flutterwaveData.data.link, tx_ref }),
            { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
          );
        }
        throw new Error(flutterwaveData.message || 'Failed to create Flutterwave payment link');
      }

      return new Response(JSON.stringify({ error: 'No payment provider configured' }), {
        status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
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

      // The gateway was configured and called, but didn't return a usable
      // checkout link - this must surface as a real error, not silently
      // fall through to the mock-payment fallback below (which would
      // otherwise hand back a fake "success" demo URL for a real,
      // failed payment attempt).
      console.error('Flutterwave subscription payment failed:', flutterwaveData);
      throw new Error(flutterwaveData.message || 'Flutterwave declined the subscription payment request');
    }

    // Handle Paystack subscription payments
    const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (provider === 'paystack' && PAYSTACK_SECRET) {
      const tx_ref = `sub_${organizationId}_${Date.now()}`;
      const paystackPayload = {
        email: user.email,
        amount: amount * 100, // Paystack uses kobo/cents
        currency: 'NGN',
        reference: tx_ref,
        callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/paystack-webhook`,
        metadata: {
          organization_id: organizationId,
          plan_type: planType,
          interval,
          payment_type: 'subscription',
        },
      };

      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paystackPayload),
      });

      const paystackData = await response.json();

      if (paystackData.status && paystackData.data?.authorization_url) {
        await supabase.from('billing_events').insert([{
          organization_id: organizationId,
          event_type: 'payment_initiated',
          old_plan: org.plan_type,
          new_plan: planType,
          provider: 'paystack',
          amount,
          currency: 'NGN',
          external_id: tx_ref,
        }]);

        return new Response(
          JSON.stringify({ success: true, url: paystackData.data.authorization_url }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Same principle as the Flutterwave branch above: a configured
      // provider that fails must surface as an error, never fall through
      // to the mock fallback as a fake success.
      console.error('Paystack subscription payment failed:', paystackData);
      throw new Error(paystackData.message || 'Paystack declined the subscription payment request');
    }

    // Fallback to mock payment for development (only reached when NEITHER
    // provider has a secret configured at all - a configured provider that
    // fails throws above instead of reaching here).
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
    // Every throw in this function is a deliberately-authored Error with a
    // human-readable message describing what actually went wrong (auth,
    // validation, or a payment gateway rejecting the request) - previously
    // this was discarded in favor of a generic "Internal server error",
    // making every real failure (e.g. an invalid/expired gateway API key)
    // indistinguishable from an actual bug. Full detail is still logged
    // server-side either way.
    console.error('Error in create-payment function:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);
