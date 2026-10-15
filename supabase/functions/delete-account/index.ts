// Self-service account deletion (Privacy Policy: "Your rights" / "Retention").
//
// The auth user is NOT hard-deleted: foreign keys would cascade-delete public records the
// policy promises to keep (reports, verification logs, retirement certificates), and payment
// records (orders, donations) must be kept by law and block deletion anyway. Instead the
// account is anonymised: personal details are erased, private data is deleted, and the login
// is disabled for good, leaving public/financial records attached to a pseudonymous ID.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { type Database, logAuditEvent } from '../_shared/db.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Unauthorized' }, 401);

  const url = Deno.env.get('SUPABASE_URL') ?? '';
  const userClient = createClient<Database>(url, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: 'Unauthorized' }, 401);

  const body = await req.json().catch(() => ({}));
  if (body?.confirm !== 'DELETE') return json({ error: 'Type DELETE to confirm account deletion.' }, 400);

  const admin = createClient<Database>(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
  const uid = user.id;
  const failures: string[] = [];
  const step = async (name: string, run: () => PromiseLike<{ error: { message: string } | null }>) => {
    const { error } = await run();
    if (error) failures.push(`${name}: ${error.message}`);
  };

  // 1. Erase personal details (public_profiles is kept in sync by trigger).
  await step('profile', () => admin.from('profiles').update({
    full_name: 'Deleted user', email: null, phone: null, bio: null, avatar_url: null,
    organization: null, country: null, legal_capacity: null, regulatory_exposure: null,
    sector_classification: null, impact_area: null,
  }).eq('user_id', uid));

  // 2. Delete private, personal-only data.
  for (const table of ['saved_items', 'watches', 'collections', 'notification_preferences', 'notifications',
    'user_badges', 'user_roles', 'conversation_participants', 'verifier_profiles'] as const) {
    await step(table, () => admin.from(table).delete().eq('user_id', uid));
  }

  // 3. Blank the content of messages this user sent (the other party keeps the thread).
  await step('direct_messages', () => admin.from('direct_messages')
    .update({ content: '[deleted]', file_url: null }).eq('sender_id', uid));

  // 4. Detach usage analytics and support tickets from the person.
  await step('analytics_events', () => admin.from('analytics_events').update({ user_id: null }).eq('user_id', uid));
  await step('support_tickets', () => admin.from('support_tickets').update({ user_id: null }).eq('user_id', uid));

  // 5. Contact-form messages are keyed by email, not user id.
  if (user.email) {
    await step('contact_submissions', () => admin.from('contact_submissions').delete().eq('email', user.email!));
  }

  if (failures.length) {
    // Leave the login working so the request can be retried; nothing personal is lost by stopping here.
    console.error('[DELETE-ACCOUNT] Partial failure for', uid, failures);
    return json({ error: 'Some data could not be removed. Please try again or contact the DPO.', failures }, 500);
  }

  // 6. Disable the login for good: replace the email, scrub metadata, random password, permanent ban.
  const { error: banError } = await admin.auth.admin.updateUserById(uid, {
    email: `deleted-${uid}@users.invalid`,
    password: crypto.randomUUID() + crypto.randomUUID(),
    user_metadata: {},
    ban_duration: '876000h',
  });
  if (banError) {
    console.error('[DELETE-ACCOUNT] Could not disable login for', uid, banError.message);
    return json({ error: 'Your data was removed but the login could not be disabled. Please contact the DPO.' }, 500);
  }

  await logAuditEvent(admin, {
    p_actor_id: uid,
    p_actor_type: 'user',
    p_org_id: null,
    p_action: 'account_deleted',
    p_target_table: 'profiles',
    p_target_id: uid,
    p_payload: { method: 'self_service_anonymisation' },
  });

  return json({ success: true });
});
