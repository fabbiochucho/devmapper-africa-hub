import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getPlanPrice } from "../_shared/planQuotas.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PaymentRequest {
  // Organization payment
  organizationId?: string;
  provider?: 'flutterwave' | 'paystack';
  planType?: 'lite' | 'individual' | 'pro' | 'advanced' | 'enterprise';
  interval?: 'monthly' | 'quarterly' | 'yearly';
  // Donation payment
  payment_type?: 'subscription' | 'donation' | 'marketplace_purchase';
  amount: number;
  currency?: string;
  email?: string;
  name?: string;
  campaign_id?: string;
  message?: string;
  anonymous?: boolean;
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
    const { payment_type, amount } = requestData;

    // Log identifying/routing fields only - never the raw request, which
    // can carry a donor's email and name.
    console.log('Processing payment request:', {
      payment_type: requestData.payment_type,
      amount: requestData.amount,
      currency: requestData.currency,
      organizationId: requestData.organizationId,
      campaign_id: requestData.campaign_id,
      order_id: requestData.order_id,
    });

    // Handle donation payments (can be anonymous)
    if (payment_type === 'donation') {
      const { email, name, campaign_id, message, anonymous } = requestData;

      // Input validation
      const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (
        !email || !campaign_id ||
        typeof email !== 'string' || email.length > 255 || !emailRe.test(email) ||
        !uuidRe.test(campaign_id) ||
        typeof amount !== 'number' || !isFinite(amount) || amount < 1 || amount > 1_000_000 ||
        (name && (typeof name !== 'string' || name.length > 200)) ||
        (message && (typeof message !== 'string' || message.length > 500))
      ) {
        return new Response(JSON.stringify({ error: 'Invalid donation payload' }), {
          status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const { data: campaign } = await supabase
        .from('fundraising_campaigns').select('currency, status, deadline').eq('id', campaign_id).maybeSingle();
      if (!campaign || campaign.status !== 'active' || (campaign.deadline && new Date(campaign.deadline) < new Date())) {
        return new Response(JSON.stringify({ error: 'This campaign is not accepting donations' }), {
          status: 409, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // The donation row is created here, not by the browser, so guests can give and the
      // currency/status can't be chosen by the client. Signed-in donors are linked by their JWT.
      const jwt = req.headers.get('Authorization')?.replace('Bearer ', '');
      const { data: { user: donor } } = jwt ? await supabase.auth.getUser(jwt) : { data: { user: null } };
      const { data: donationRow, error: donationInsertError } = await supabase
        .from('campaign_donations')
        .insert({
          campaign_id, amount, currency: campaign.currency, status: 'pending',
          donor_id: donor?.id ?? null, anonymous: anonymous === true, message: message || null,
        })
        .select('id')
        .single();
      if (donationInsertError || !donationRow) throw donationInsertError ?? new Error('Could not record donation');
      const donation_id = donationRow.id;
      const currency = campaign.currency;
      // Only send donors back to our own site.
      const siteUrl = Deno.env.get('SITE_URL') ?? 'https://devmapper.africa';
      const redirect_url = requestData.redirect_url?.startsWith(siteUrl) ? requestData.redirect_url : `${siteUrl}/fundraising?donation=success`;

      // Donations go through Paystack; paystack-webhook confirms them (amount + currency checked).
      const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY');
      if (!PAYSTACK_SECRET) {
        return new Response(JSON.stringify({ error: 'Payments are not configured' }), {
          status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      const reference = `donation_${donation_id}_${Date.now()}`;
      const response = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          amount: Math.round(amount * 100), // subunits (kobo/cents)
          currency, // the campaign's; a non-NGN currency must be enabled on the Paystack account
          reference,
          callback_url: redirect_url,
          metadata: { donation_id, campaign_id, payment_type: 'donation', donor_name: name || 'Anonymous Donor' },
        }),
      });
      const paystackData = await response.json();
      // Log the outcome only - the full response carries the payment link.
      console.log('Paystack initialize status:', paystackData?.status);

      if (paystackData.status && paystackData.data?.authorization_url) {
        await supabase
          .from('campaign_donations')
          .update({ payment_intent_id: reference })
          .eq('id', donation_id)
          .is('payment_intent_id', null);

        return new Response(
          JSON.stringify({ success: true, payment_link: paystackData.data.authorization_url, reference }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // The donation row stays 'pending' with no reference; nothing was charged.
      throw new Error(paystackData.message || 'Failed to create payment link');
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
      const { order_id, provider, redirect_url: purchaseRedirectUrl } = requestData;

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

      // Each branch below only fires for its own explicitly-requested
      // provider, and returns a clear error if that provider's secret is
      // missing - a Paystack request must never silently fall through and
      // get charged via Flutterwave instead just because PAYSTACK_SECRET
      // isn't configured.
      if (provider === 'paystack') {
        if (!PAYSTACK_SECRET) {
          return new Response(JSON.stringify({ error: 'Paystack is not configured for this deployment' }), {
            status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        const paystackPayload = {
          email: user.email,
          amount: Math.round(order.total_amount * 100),
          currency: order.currency || 'NGN',
          reference: tx_ref,
          // Paystack's callback_url is a browser redirect after checkout, not
          // the webhook - the webhook URL is configured separately in the
          // Paystack dashboard and fires server-to-server regardless of this.
          callback_url: purchaseRedirectUrl || `${Deno.env.get('SUPABASE_URL')}/functions/v1/paystack-webhook`,
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

      if (provider === 'flutterwave' || !provider) {
        if (!FLUTTERWAVE_SECRET) {
          return new Response(JSON.stringify({ error: 'Flutterwave is not configured for this deployment' }), {
            status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
        const flutterwavePayload = {
          tx_ref,
          amount: order.total_amount,
          currency: order.currency || 'USD',
          // Flutterwave's redirect_url is only the post-checkout browser
          // landing page - the actual webhook is configured separately in
          // the Flutterwave dashboard and fires server-to-server regardless
          // of this value.
          redirect_url: purchaseRedirectUrl || `${Deno.env.get('SUPABASE_URL')}/functions/v1/flutterwave-webhook`,
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

    const { organizationId, provider, planType, interval, redirect_url: subscriptionRedirectUrl } = requestData;

    // Individual plans are bought by the signed-in user for themselves; every other plan
    // belongs to an organisation the user created.
    const isIndividual = planType === 'individual';
    let org: { plan_type: string } | null = null;
    if (!isIndividual) {
      const { data: orgRow, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .eq('created_by', user.id)
        .single();
      if (orgError || !orgRow) {
        throw new Error('Organization not found or access denied');
      }
      org = orgRow;
    }
    const payer = isIndividual
      ? { refPrefix: `ind_${user.id}`, meta: { user_id: user.id, plan_type: planType, interval, payment_type: 'individual_subscription' }, billing: { user_id: user.id, organization_id: null } }
      : { refPrefix: `sub_${organizationId}`, meta: { organization_id: organizationId, plan_type: planType, interval, payment_type: 'subscription' }, billing: { organization_id: organizationId } };

    // The client chooses which plan and interval, never how much that
    // costs - the client-supplied `amount` was previously charged
    // directly, letting a request for e.g. planType:'advanced' pass
    // amount:0.01 and be charged a cent while the webhook still upgrades
    // the org to the full plan on "payment success". "enterprise" has no
    // self-serve price (sales-assisted only, matches getPlanQuotas'
    // comment) so it's rejected here rather than silently priced at $0.
    if (!['monthly', 'quarterly', 'yearly'].includes(interval ?? '')) {
      throw new Error('interval must be monthly, quarterly or yearly');
    }
    const subscriptionAmount = getPlanPrice(planType, interval);
    if (subscriptionAmount <= 0) {
      throw new Error('This plan is not available for self-serve checkout');
    }

    const FLUTTERWAVE_SECRET = Deno.env.get('FLUTTERWAVE_SECRET_KEY');
    const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY');

    // As with marketplace purchases above: each branch only fires for its
    // own explicitly-requested provider and errors clearly if unconfigured,
    // rather than falling through to the dev-mode mock fallback below and
    // reporting a fake "success" (with a fabricated billing_events row) for
    // a payment that was never actually attempted.
    if (provider === 'flutterwave') {
      if (!FLUTTERWAVE_SECRET) {
        return new Response(JSON.stringify({ error: 'Flutterwave is not configured for this deployment' }), {
          status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      // Create real Flutterwave payment
      const tx_ref = `${payer.refPrefix}_${Date.now()}`;
      
      const flutterwavePayload = {
        tx_ref,
        amount: subscriptionAmount,
        currency: 'USD',
        // Post-checkout browser landing page only - the real webhook is
        // configured separately in the Flutterwave dashboard.
        redirect_url: subscriptionRedirectUrl || `${Deno.env.get('SUPABASE_URL')}/functions/v1/flutterwave-webhook`,
        customer: {
          email: user.email,
          name: user.user_metadata?.full_name || 'DevMapper User'
        },
        customizations: {
          title: 'DevMapper Subscription',
          description: `${planType} plan - ${interval}`,
          logo: 'https://devmapper.africa/logo.png'
        },
        meta: payer.meta
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
            ...payer.billing,
            event_type: 'payment_initiated',
            old_plan: org?.plan_type ?? null,
            new_plan: planType,
            provider: 'flutterwave',
            amount: subscriptionAmount,
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
    if (provider === 'paystack') {
      if (!PAYSTACK_SECRET) {
        return new Response(JSON.stringify({ error: 'Paystack is not configured for this deployment' }), {
          status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      const tx_ref = `${payer.refPrefix}_${Date.now()}`;
      const paystackPayload = {
        email: user.email,
        amount: subscriptionAmount * 100, // Paystack amounts are in the currency's subunit (cents)
        currency: 'USD', // plan prices are USD; requires USD enabled on the Paystack account
        reference: tx_ref,
        // Post-checkout browser landing page only - the real webhook is
        // configured separately in the Paystack dashboard.
        callback_url: subscriptionRedirectUrl || `${Deno.env.get('SUPABASE_URL')}/functions/v1/paystack-webhook`,
        metadata: payer.meta,
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
          ...payer.billing,
          event_type: 'payment_initiated',
          old_plan: org?.plan_type ?? null,
          new_plan: planType,
          provider: 'paystack',
          amount: subscriptionAmount,
          currency: 'USD',
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

    // Fallback to mock payment for development - only reached when `provider`
    // is neither 'flutterwave' nor 'paystack' (e.g. omitted entirely). Either
    // named provider is fully handled above: it either succeeds for real, or
    // returns a clear error (missing secret or gateway rejection) - never
    // silently mocked.
    const paymentUrl = provider === 'flutterwave'
      ? `https://checkout.flutterwave.com/demo?plan=${planType}&interval=${interval}&amount=${subscriptionAmount}`
      : `https://checkout.paystack.com/demo?plan=${planType}&interval=${interval}&amount=${subscriptionAmount}`;

    // Log billing event
    await supabase
      .from('billing_events')
      .insert([{
        ...payer.billing,
        event_type: 'payment_initiated',
        old_plan: org?.plan_type ?? null,
        new_plan: planType,
        provider: provider || 'flutterwave',
        amount: subscriptionAmount,
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
