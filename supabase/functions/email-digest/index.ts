import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DigestUser {
  user_id: string;
  email: string;
  full_name: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get users with email notifications enabled
    const { data: notifPrefs } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .eq('email_notifications', true);

    if (!notifPrefs?.length) {
      return new Response(JSON.stringify({ message: 'No users with email notifications enabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userIds = notifPrefs.map(p => p.user_id);

    // Get user profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, email, full_name')
      .in('user_id', userIds);

    if (!profiles?.length) {
      return new Response(JSON.stringify({ message: 'No profiles found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const digests: { user_id: string; email: string; digest: any }[] = [];
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Last 24 hours

    for (const profile of profiles as DigestUser[]) {
      // Gather unread broadcasts
      const { data: broadcasts } = await supabase
        .from('admin_broadcasts')
        .select('subject, message, priority, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(5);

      // Gather unread messages
      const { data: participations } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', profile.user_id);

      let unreadMessages = 0;
      if (participations?.length) {
        const convIds = participations.map(p => p.conversation_id);
        const { count } = await supabase
          .from('direct_messages')
          .select('id', { count: 'exact', head: true })
          .in('conversation_id', convIds)
          .neq('sender_id', profile.user_id)
          .gte('created_at', since);
        unreadMessages = count || 0;
      }

      // Gather verification updates on user's reports
      const { data: verificationUpdates } = await supabase
        .from('verification_logs')
        .select('report_id, action, created_at')
        .eq('user_id', profile.user_id)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(5);

      const hasContent = (broadcasts?.length || 0) > 0 || unreadMessages > 0 || (verificationUpdates?.length || 0) > 0;
      
      if (hasContent && profile.email) {
        digests.push({
          user_id: profile.user_id,
          email: profile.email,
          digest: {
            greeting: `Hi ${profile.full_name || 'there'}`,
            broadcasts: broadcasts || [],
            unread_messages: unreadMessages,
            verification_updates: verificationUpdates || [],
            generated_at: new Date().toISOString(),
          },
        });
      }
    }

    // Log digest generation event
    if (digests.length > 0) {
      await supabase.from('analytics_events').insert(
        digests.map(d => ({
          event_type: 'email_digest_generated',
          user_id: d.user_id,
          event_data: {
            broadcasts_count: d.digest.broadcasts.length,
            unread_messages: d.digest.unread_messages,
            verification_updates: d.digest.verification_updates.length,
          },
        }))
      );
    }

    // Note: Actual email sending would integrate with a mail service (Resend, etc.)
    // For now, we log the digest data for future email integration
    return new Response(JSON.stringify({
      message: `Generated ${digests.length} email digests`,
      digests_count: digests.length,
      user_ids: digests.map(d => d.user_id),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Email digest error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
