import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const { nominee_email, nominee_name, nominator_name, reason } = await req.json()

    if (!nominee_email || !nominee_name) {
      throw new Error('nominee_email and nominee_name are required')
    }

    console.log(`Processing changemaker nomination for ${nominee_email}`)

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === nominee_email)

    if (existingUser) {
      // User exists - just add the change_maker role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({
          user_id: existingUser.id,
          role: 'change_maker',
          is_active: true
        }, { onConflict: 'user_id,role' })

      if (roleError) {
        console.error('Error assigning role:', roleError)
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `${nominee_name} already has an account. Change Maker role has been assigned.`,
          user_exists: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create invitation link for new user
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: nominee_email,
      options: {
        data: {
          full_name: nominee_name,
          selected_role: 'change_maker',
          nominated_by: nominator_name,
          nomination_reason: reason
        },
        redirectTo: `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/auth`
      }
    })

    if (inviteError) {
      console.error('Invite error:', inviteError)
      // Fallback: create user directly
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: nominee_email,
        email_confirm: false,
        user_metadata: {
          full_name: nominee_name,
          selected_role: 'change_maker',
          nominated_by: nominator_name
        }
      })

      if (createError) throw createError

      if (newUser?.user) {
        await supabaseAdmin.from('user_roles').insert({
          user_id: newUser.user.id,
          role: 'change_maker',
          is_active: true
        })
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Invitation sent to ${nominee_email}. They will be onboarded as a Change Maker.`,
          user_exists: false
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If invite succeeded, also assign the role for when they confirm
    if (inviteData?.user) {
      await supabaseAdmin.from('user_roles').insert({
        user_id: inviteData.user.id,
        role: 'change_maker',
        is_active: true
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Invitation email sent to ${nominee_email}. They'll be onboarded as a Change Maker.`,
        user_exists: false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Nomination error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
