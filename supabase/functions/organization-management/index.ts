import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { notifyDowngrade } from "../_shared/planDowngrade.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

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

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const orgId = pathParts[pathParts.length - 1];

    console.log('Organization management request:', { method: req.method, orgId });

    if (req.method === 'GET') {
      // GET: Return organization details
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        throw new Error('No authorization header');
      }

      const jwt = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
      
      if (authError || !user) {
        throw new Error('Invalid authorization');
      }

      // Fetch organization - user must be the creator or a member
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id, name, plan_type')
        .eq('id', orgId)
        .or(`created_by.eq.${user.id},organization_members.user_id.eq.${user.id}`)
        .single();

      if (orgError || !org) {
        throw new Error('Organization not found or access denied');
      }

      return new Response(
        JSON.stringify(org),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );

    } else if (req.method === 'PATCH') {
      // PATCH: Update organization plan. Plan changes only ever happen
      // after a payment provider confirms a charge - a plain user JWT is
      // never sufficient here, no matter whose organization it is, since
      // that would let any org owner grant themselves a paid plan for
      // free. Nothing in this app currently calls this endpoint with a
      // user JWT (only paystack-webhook/flutterwave-webhook/create-payment
      // call it, all with the webhook secret) - this closes that path
      // rather than leaving it live and reachable via a raw request.
      const webhookSecret = req.headers.get('X-Webhook-Secret');
      const expectedSecret = Deno.env.get('WEBHOOK_SECRET');

      if (!webhookSecret || !expectedSecret || webhookSecret !== expectedSecret) {
        throw new Error('Invalid or missing webhook secret');
      }

      const body = await req.json();
      const { plan_type, event_type, provider, external_id, amount } = body;

      // Input validation
      if (!plan_type || !['lite', 'pro'].includes(plan_type)) {
        throw new Error('Invalid plan_type. Must be "lite" or "pro"');
      }

      // Validate external_id to prevent injection
      if (external_id && typeof external_id !== 'string') {
        throw new Error('Invalid external_id format');
      }

      // Validate amount if provided
      if (amount !== undefined && (typeof amount !== 'number' || amount < 0)) {
        throw new Error('Invalid amount');
      }

      // Fetch current organization
      const { data: currentOrg, error: fetchError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();

      if (fetchError || !currentOrg) {
        throw new Error('Organization not found');
      }

      if (plan_type === 'lite' && currentOrg.plan_type === 'pro') {
        console.warn(`Downgrade attempt for org ${orgId} via webhook`);
      }

      const oldPlan = currentOrg.plan_type;

      // Update organization plan
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ plan_type })
        .eq('id', orgId);

      if (updateError) {
        throw updateError;
      }

      // Log billing event
      await supabase
        .from('billing_events')
        .insert([{
          organization_id: orgId,
          event_type: event_type || (plan_type === 'pro' ? 'upgrade' : 'downgrade'),
          old_plan: oldPlan,
          new_plan: plan_type,
          provider: provider || 'system',
          external_id: external_id || null,
          amount: amount || 0,
          currency: 'USD'
        }]);

      // Send email notification for downgrades
      if (plan_type === 'lite' && oldPlan === 'pro') {
        await notifyDowngrade(orgId);
      }

      console.log(`Organization ${orgId} plan updated from ${oldPlan} to ${plan_type}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          plan_type,
          old_plan: oldPlan 
        }),
        { 
          status: 200, 
          headers: { 'Content-Type': 'application/json', ...corsHeaders } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Error in organization-management function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};


serve(handler);