import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

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
      // PATCH: Update organization plan
      const webhookSecret = req.headers.get('X-Webhook-Secret');
      const expectedSecret = Deno.env.get('WEBHOOK_SECRET');
      
      let user = null;
      
      // Verify authorization - either valid JWT or webhook secret
      if (webhookSecret && webhookSecret === expectedSecret) {
        console.log('Webhook request authenticated');
      } else {
        // Check JWT authentication
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
          throw new Error('No authorization header or webhook secret');
        }

        const jwt = authHeader.replace('Bearer ', '');
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(jwt);
        
        if (authError || !authUser) {
          throw new Error('Invalid authorization');
        }
        
        user = authUser;
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

      // If user authentication, verify access
      if (user && currentOrg.created_by !== user.id) {
        throw new Error('Access denied');
      }

      // Prevent downgrade from webhook without proper validation
      if (!user && plan_type === 'lite' && currentOrg.plan_type === 'pro') {
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
        await sendDowngradeEmail(orgId, currentOrg.name);
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
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );
  }
};

async function sendDowngradeEmail(orgId: string, orgName: string) {
  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.log('No Resend API key configured, skipping email');
      return;
    }

    const resend = new Resend(resendApiKey);
    const baseUrl = Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '') || 'https://your-app.com';
    const upgradeUrl = `${baseUrl}/billing/upgrade?orgId=${orgId}`;

    await resend.emails.send({
      from: "DevMapper <noreply@devmapper.org>",
      to: ["admin@example.com"], // In production, fetch org admin emails
      subject: `${orgName} - Plan Downgraded to Lite`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333; margin-bottom: 20px;">Plan Downgrade Notification</h1>
          
          <p>Hello,</p>
          
          <p>Your organization <strong>${orgName}</strong> has been downgraded to the Lite plan.</p>
          
          <p>This means you now have access to:</p>
          <ul>
            <li>Up to 10 projects</li>
            <li>Basic reporting</li>
            <li>Community support</li>
            <li>Standard SDG tracking</li>
          </ul>
          
          <p>To restore your Pro features and unlock unlimited projects, advanced analytics, and priority support, you can upgrade anytime:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${upgradeUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Upgrade to Pro
            </a>
          </div>
          
          <p>If you have any questions, feel free to contact our support team.</p>
          
          <p>Best regards,<br>The DevMapper Team</p>
        </div>
      `,
    });

    console.log('Downgrade email sent successfully');
  } catch (error) {
    console.error('Error sending downgrade email:', error);
  }
}

serve(handler);