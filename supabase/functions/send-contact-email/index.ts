// Public contact-form intake. verify_jwt = false; persists to contact_submissions
// and notifies all admins in-app and, when RESEND_API_KEY is set, by email.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactPayload {
  name: string;
  email: string;
  subject?: string;
  message: string;
  source_url?: string;
}

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = (await req.json()) as ContactPayload;
    const name = (body.name ?? '').trim().slice(0, 200);
    const email = (body.email ?? '').trim().toLowerCase().slice(0, 320);
    const subject = (body.subject ?? '').trim().slice(0, 300) || null;
    const message = (body.message ?? '').trim().slice(0, 5000);

    if (!name || !message || !isEmail(email)) {
      return new Response(JSON.stringify({ error: 'Invalid name, email or message' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: inserted, error: insertErr } = await supabase
      .from('contact_submissions')
      .insert({
        name,
        email,
        subject,
        message,
        user_agent: req.headers.get('user-agent')?.slice(0, 500) ?? null,
        source_url: (body.source_url ?? '').slice(0, 500) || null,
      })
      .select('id')
      .single();

    if (insertErr) throw insertErr;

    // Notify admins in-app
    const { data: admins } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('role', ['admin', 'platform_admin'])
      .eq('is_active', true);

    if (admins?.length) {
      await supabase.from('notifications').insert(
        admins.map((a: { user_id: string }) => ({
          user_id: a.user_id,
          type: 'info',
          title: `New contact: ${subject ?? 'No subject'}`,
          message: `${name} <${email}>: ${message.slice(0, 180)}${message.length > 180 ? '…' : ''}`,
          link: '/admin/crm',
        }))
      );
    }

    // Email the admins too. Plain text so user input can't inject markup; a send
    // failure is logged, not returned, since the submission is already saved.
    const resendKey = Deno.env.get('RESEND_API_KEY');
    if (resendKey && admins?.length) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('email')
        .in('user_id', admins.map((a: { user_id: string }) => a.user_id));
      const to = [...new Set((profiles ?? []).map((p: { email: string | null }) => p.email).filter(Boolean))];
      if (to.length) {
        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'DevMapper Africa <noreply@devmapper.africa>',
            to,
            reply_to: email,
            subject: `[Contact] ${subject ?? 'No subject'}`.replace(/[\r\n]+/g, ' '),
            text: `From: ${name} <${email}>\n${body.source_url ? `Page: ${body.source_url}\n` : ''}\n${message}`,
          }),
        });
        if (!resp.ok) console.error('contact email send failed', resp.status, await resp.text());
      }
    }

    return new Response(JSON.stringify({ ok: true, id: inserted?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-contact-email error', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
