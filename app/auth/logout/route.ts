import { createServerClientWithCookies } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createServerClientWithCookies()
  
  // Sign out the user
  await supabase.auth.signOut()
  
  // Redirect to login page
  return NextResponse.redirect(new URL('/login', request.url))
} 