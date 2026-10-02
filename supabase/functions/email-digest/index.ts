import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    // Authenticate: require service-role key or shared secret
    const authHeader = req.headers.get('Authorization');
    const expectedServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const token = authHeader?.replace('Bearer ', '');

    if (token !== expectedServiceKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabase = createClient(supabaseUrl, expectedServiceKey);

    // Email is on unless the user turned it off - matching the settings page, which shows it
    // on when no preferences have been saved.
    const { data: optedOut } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .eq('email_notifications', false);
    const off = new Set((optedOut ?? []).map((p: { user_id: string }) => p.user_id));

    // ponytail: loads every profile and queries per user; batch when users reach the thousands.
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('user_id, email, full_name')
      .not('email', 'is', null);
    const profiles = (allProfiles ?? []).filter((p: DigestUser) => !off.has(p.user_id));

    if (!profiles?.length) {
      return new Response(JSON.stringify({ message: 'No profiles found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const digests: {
      user_id: string;
      email: string;
      digest: {
        greeting: string;
        broadcasts: { subject: string; message: string }[];
        unread_messages: number;
        verification_updates: { action: string }[];
        notifications: { title: string; message: string | null }[];
        generated_at: string;
      };
    }[] = [];
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    for (const profile of profiles as DigestUser[]) {
      const { data: broadcasts } = await supabase
        .from('admin_broadcasts')
        .select('subject, message, priority, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(5);

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

      // Verification activity on the user's own reports.
      const { data: ownReports } = await supabase.from('reports').select('id, title').eq('user_id', profile.user_id);
      const titles = new Map((ownReports ?? []).map((r: { id: string; title: string }) => [r.id, r.title]));
      const { data: logs } = titles.size
        ? await supabase
          .from('verification_logs')
          .select('report_id, verification_type, created_at')
          .in('report_id', [...titles.keys()])
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(5)
        : { data: [] };
      const verificationUpdates = (logs ?? []).map((l: { report_id: string; verification_type: string }) =>
        ({ action: `${titles.get(l.report_id) ?? 'Your report'}: ${l.verification_type.replace(/_/g, ' ')}` }));

      // Unread in-app notifications, which include the nightly watch updates.
      const { data: notifications } = await supabase
        .from('notifications')
        .select('title, message')
        .eq('user_id', profile.user_id)
        .eq('is_read', false)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(10);

      const hasContent = (broadcasts?.length || 0) > 0 || unreadMessages > 0 || (verificationUpdates?.length || 0) > 0
        || (notifications?.length || 0) > 0;
      
      if (hasContent && profile.email) {
        digests.push({
          user_id: profile.user_id,
          email: profile.email,
          digest: {
            greeting: `Hi ${profile.full_name || 'there'}`,
            broadcasts: broadcasts || [],
            unread_messages: unreadMessages,
            verification_updates: verificationUpdates || [],
            notifications: notifications || [],
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

    // Send. Plain text, so broadcast/notification text can't inject markup.
    const resendKey = Deno.env.get('RESEND_API_KEY');
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://devmapper.africa';
    let sent = 0;
    if (resendKey) {
      for (const d of digests) {
        const { digest } = d;
        const sections = [
          digest.notifications.length && `Updates\n${digest.notifications.map((n) => `- ${n.title}${n.message ? `: ${n.message}` : ''}`).join('\n')}`,
          digest.unread_messages && `You have ${digest.unread_messages} new message${digest.unread_messages === 1 ? '' : 's'}.`,
          digest.verification_updates.length && `Verification\n${digest.verification_updates.map((v) => `- ${v.action}`).join('\n')}`,
          digest.broadcasts.length && `Announcements\n${digest.broadcasts.map((b) => `- ${b.subject}: ${b.message}`).join('\n')}`,
        ].filter(Boolean);
        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'DevMapper Africa <noreply@devmapper.africa>',
            to: [d.email],
            subject: 'Your DevMapper daily digest',
            text: `${digest.greeting},\n\n${sections.join('\n\n')}\n\nOpen DevMapper: ${siteUrl}\nTurn off these emails: ${siteUrl}/settings`,
          }),
        });
        if (resp.ok) sent++;
        else console.error('digest send failed', resp.status, await resp.text());
      }
    }

    // Return only counts — no user IDs
    return new Response(JSON.stringify({
      message: `Generated ${digests.length} email digests, sent ${sent}`,
      digests_count: digests.length,
      sent,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Email digest error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
