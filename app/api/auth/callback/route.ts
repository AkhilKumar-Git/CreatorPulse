import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (error) {
      console.error('OAuth error:', error, errorDescription)
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/?error=${encodeURIComponent(error)}`
      )
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/?error=${encodeURIComponent('No authorization code received')}`
      )
    }

    const supabase = createServerSupabaseClient()

    // Exchange the code for a session
    const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code)

    if (authError) {
      console.error('Auth exchange error:', authError)
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/?error=${encodeURIComponent(authError.message)}`
      )
    }

    if (!authData.user) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/?error=${encodeURIComponent('No user data received')}`
      )
    }

    // Create or update user record in our users table
    const { error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (userError && userError.code === 'PGRST116') {
      // User doesn't exist, create them
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          persona_json: authData.user.user_metadata || null
        })

      if (insertError) {
        console.error('Error creating user record:', insertError)
        // Continue anyway - user auth succeeded
      }
    }

    // Redirect to the main app with success
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/?auth=success`
    )

  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/?error=${encodeURIComponent('OAuth callback failed')}`
    )
  }
} 