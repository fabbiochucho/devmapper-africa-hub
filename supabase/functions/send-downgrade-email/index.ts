import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  organizationId: string;
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

    const { organizationId }: EmailRequest = await req.json();

    // Get organization details
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('*, organization_members(user_id, role)')
      .eq('id', organizationId)
      .single();

    if (orgError || !org) {
      throw new Error('Organization not found');
    }

    // Get admin users for the organization
    const adminUserIds = org.organization_members
      .filter((member: any) => member.role === 'admin' || member.role === 'owner')
      .map((member: any) => member.user_id);

    // Get admin user emails
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('email')
      .in('user_id', adminUserIds);

    if (profilesError) {
      throw profilesError;
    }

    const adminEmails = profiles?.map(p => p.email).filter(Boolean) || [];

    if (adminEmails.length === 0) {
      console.log('No admin emails found for organization:', organizationId);
      return new Response(
        JSON.stringify({ success: true, message: 'No admin emails to notify' }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Create upgrade URL
    const upgradeUrl = `${Deno.env.get('SITE_URL')}/billing/upgrade?orgId=${organizationId}`;

    // Send email to all admin users
    const emailPromises = adminEmails.map(async (email) => {
      return resend.emails.send({
        from: 'DevMapper Africa <noreply@devmapper.africa>',
        to: [email],
        subject: 'Your plan has been downgraded to Lite',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #f97316; border-bottom: 2px solid #f97316; padding-bottom: 10px;">
              Plan Downgrade Notice
            </h2>
            
            <p>Hello,</p>
            
            <p>We're writing to inform you that your organization's plan has been downgraded to <strong>Lite</strong>.</p>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #d97706;">What this means:</h3>
              <ul style="margin-bottom: 0;">
                <li>Limited to 10 projects</li>
                <li>Basic reporting only</li>
                <li>Standard SDG tracking</li>
                <li>Community support</li>
              </ul>
            </div>
            
            <p>If you'd like to restore your Pro features, you can upgrade again at any time:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${upgradeUrl}" 
                 style="background-color: #f97316; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Upgrade to Pro
              </a>
            </div>
            
            <h3 style="color: #374151;">Pro Plan Benefits:</h3>
            <ul style="color: #6b7280;">
              <li>Unlimited projects</li>
              <li>Advanced analytics & insights</li>
              <li>Priority support</li>
              <li>Custom reporting</li>
              <li>API access</li>
              <li>Team collaboration</li>
              <li>Advanced SDG mapping</li>
              <li>Export capabilities</li>
              <li>White-label options</li>
            </ul>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 14px;">
              If you have any questions or need assistance, please don't hesitate to contact our support team.
            </p>
            
            <p style="color: #6b7280; font-size: 14px;">
              Best regards,<br>
              The DevMapper Africa Team
            </p>
          </div>
        `,
      });
    });

    await Promise.all(emailPromises);

    console.log(`Downgrade emails sent to ${adminEmails.length} admin(s) for organization:`, organizationId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailsSent: adminEmails.length,
        organization: org.name
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Error in send-downgrade-email function:', error);
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