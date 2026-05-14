import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Authenticate the caller via JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const callerId = claimsData.claims.sub

    // Verify the caller has admin or platform_admin role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: roles } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callerId)
      .eq('is_active', true)
      .in('role', ['admin', 'platform_admin'])

    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Require an explicit list of target user IDs and a non-default password
    let body: { password?: string; user_ids?: string[] } = {};
    try { body = await req.json(); } catch { /* no body */ }

    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const userIds = Array.isArray(body.user_ids) ? body.user_ids.filter(id => typeof id === 'string' && uuidRe.test(id)) : [];
    const newPassword = typeof body.password === 'string' ? body.password : '';

    if (userIds.length === 0 || userIds.length > 50) {
      return new Response(JSON.stringify({ error: 'Provide between 1 and 50 user_ids' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      return new Response(JSON.stringify({ error: 'Password must be 8-128 characters' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let successCount = 0;
    let failCount = 0;

    for (const id of userIds) {
      try {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(id, { password: newPassword });
        if (updateError) failCount++; else successCount++;
      } catch {
        failCount++;
      }
    }

    // Audit the bulk reset (no user emails, no passwords)
    await supabaseAdmin.rpc('log_audit_event', {
      p_actor_id: callerId,
      p_actor_type: 'user',
      p_org_id: null,
      p_action: 'bulk_password_reset',
      p_payload: { target_count: userIds.length, success_count: successCount, fail_count: failCount },
    });


    // Return only counts — never leak user emails
    return new Response(
      JSON.stringify({
        message: `Password reset complete. ${successCount} succeeded, ${failCount} failed.`,
        success_count: successCount,
        fail_count: failCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Password reset error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
