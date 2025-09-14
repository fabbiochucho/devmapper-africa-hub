import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  organizationId: string;
  provider: 'flutterwave' | 'paystack';
  planType: 'lite' | 'pro';
  interval: 'monthly' | 'yearly';
  amount: number;
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

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      throw new Error('Invalid authorization');
    }

    const { organizationId, provider, planType, interval, amount }: PaymentRequest = await req.json();

    console.log('Processing payment request:', { organizationId, provider, planType, interval, amount });

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

    // For demo purposes, simulate payment processing
    // In production, integrate with actual Flutterwave/Paystack APIs
    
    if (provider === 'flutterwave') {
      // Simulate Flutterwave payment URL generation
      const paymentUrl = `https://checkout.flutterwave.com/demo?plan=${planType}&interval=${interval}&amount=${amount}`;
      
      // Log billing event
      await supabase
        .from('billing_events')
        .insert([{
          organization_id: organizationId,
          event_type: 'payment',
          old_plan: org.plan_type,
          new_plan: planType,
          provider: 'flutterwave',
          amount: amount,
          currency: 'USD'
        }]);

      return new Response(
        JSON.stringify({ 
          success: true, 
          url: paymentUrl,
          message: 'Redirecting to Flutterwave checkout...'
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
      
    } else if (provider === 'paystack') {
      // Simulate Paystack payment URL generation
      const paymentUrl = `https://checkout.paystack.com/demo?plan=${planType}&interval=${interval}&amount=${amount}`;
      
      // Log billing event
      await supabase
        .from('billing_events')
        .insert([{
          organization_id: organizationId,
          event_type: 'payment',
          old_plan: org.plan_type,
          new_plan: planType,
          provider: 'paystack',
          amount: amount,
          currency: 'USD'
        }]);

      return new Response(
        JSON.stringify({ 
          success: true, 
          url: paymentUrl,
          message: 'Redirecting to Paystack checkout...'
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    // For free plan or direct upgrades without payment
    if (amount === 0) {
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
          event_type: 'upgrade',
          old_plan: org.plan_type,
          new_plan: planType,
          provider: provider,
          amount: 0,
          currency: 'USD'
        }]);

      return new Response(
        JSON.stringify({ 
          success: true, 
          plan_type: planType,
          message: 'Plan updated successfully!'
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    throw new Error('Invalid payment configuration');

  } catch (error) {
    console.error('Error in create-payment function:', error);
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