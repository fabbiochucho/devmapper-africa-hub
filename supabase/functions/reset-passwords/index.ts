import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get the new password from request body, default to 'tester123'
    let newPassword = 'tester123'
    try {
      const body = await req.json()
      if (body.password) {
        newPassword = body.password
      }
    } catch {
      // Use default password if no body provided
    }

    console.log('Starting password reset for all users...')

    // List all users
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      throw listError
    }

    console.log(`Found ${users.users.length} users to update`)

    const results: { email: string; success: boolean; error?: string }[] = []

    // Update each user's password
    for (const user of users.users) {
      try {
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          { password: newPassword }
        )

        if (updateError) {
          console.error(`Error updating password for ${user.email}:`, updateError)
          results.push({ 
            email: user.email || user.id, 
            success: false, 
            error: updateError.message 
          })
        } else {
          console.log(`Password updated for ${user.email}`)
          results.push({ 
            email: user.email || user.id, 
            success: true 
          })
        }
      } catch (err) {
        console.error(`Exception updating ${user.email}:`, err)
        results.push({ 
          email: user.email || user.id, 
          success: false, 
          error: err instanceof Error ? err.message : 'Unknown error' 
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return new Response(
      JSON.stringify({
        message: `Password reset complete. ${successCount} succeeded, ${failCount} failed.`,
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Password reset error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})