import { createServerSupabaseClient } from './supabase'
import { NextRequest } from 'next/server'

export interface AuthUser {
  id: string
  email?: string
  user_metadata?: Record<string, unknown>
}

/**
 * Get user from session for API routes
 */
export async function getUserFromSession(request: NextRequest): Promise<AuthUser | null> {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.split(' ')[1]
    
    // Verify the JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata
    }
  } catch (error) {
    console.error('Error getting user from session:', error)
    return null
  }
}

/**
 * Middleware helper to protect API routes
 */
export async function requireAuth(request: NextRequest): Promise<{ user: AuthUser } | { error: Response }> {
  const user = await getUserFromSession(request)
  
  if (!user) {
    return {
      error: new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }
  
  return { user }
} 