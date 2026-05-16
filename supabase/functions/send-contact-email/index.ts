// Public contact-form intake. verify_jwt = false; persists to contact_submissions
// and notifies all admins via the notifications table. Email delivery is layered
// on later when an email provider is configured.
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
