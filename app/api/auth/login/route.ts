import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password, provider } = await request.json()

    const supabase = createServerSupabaseClient()

    // Handle OAuth login
    if (provider) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as 'google' | 'github' | 'twitter',
        options: {
          redirectTo: `${process.env.NEXTAUTH_URL}/auth/callback`
        }
      })

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }

      return NextResponse.json({
        url: data.url
      })
    }

    // Handle email/password login
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to authenticate user' },
        { status: 500 }
      )
    }

    // Get or create user record in our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (userError && userError.code === 'PGRST116') {
      // User doesn't exist in our table, create them
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          persona_json: authData.user.user_metadata?.persona || null
        })

      if (insertError) {
        console.error('Error creating user record:', insertError)
      }
    }

    return NextResponse.json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        emailConfirmed: authData.user.email_confirmed_at !== null,
        persona: userData?.persona_json || authData.user.user_metadata?.persona
      },
      session: authData.session
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 