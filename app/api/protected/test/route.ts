import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  // Require authentication
  const authResult = await requireAuth(request)
  
  if ('error' in authResult) {
    return authResult.error
  }

  const { user } = authResult

  return NextResponse.json({
    message: 'This is a protected route',
    user: {
      id: user.id,
      email: user.email
    },
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  // Require authentication
  const authResult = await requireAuth(request)
  
  if ('error' in authResult) {
    return authResult.error
  }

  const { user } = authResult
  const body = await request.json()

  return NextResponse.json({
    message: 'POST request received on protected route',
    user: {
      id: user.id,
      email: user.email
    },
    data: body,
    timestamp: new Date().toISOString()
  })
} 