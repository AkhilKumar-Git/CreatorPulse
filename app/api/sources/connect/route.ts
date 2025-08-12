import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getUserFromSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { type, url, content, metadata } = body

    // Validate required fields  
    if (!type || !['x', 'x_hashtag', 'twitter', 'youtube', 'rss', 'hashtag', 'url'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid source type. Must be x, x_hashtag, twitter, youtube, rss, hashtag, or url' },
        { status: 400 }
      )
    }

    if (!url && !content) {
      return NextResponse.json(
        { error: 'Either url or content is required' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = createServerSupabaseClient()

    // Insert source into database
    const { data: source, error } = await supabase
      .from('sources')
      .insert({
        user_id: user.id,
        type,
        url: url || null,
        content: content || null,
        metadata: metadata || {}
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting source:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      
      // Provide more specific error messages
      if (error.code === '23514') {
        return NextResponse.json(
          { error: 'Invalid source type. Please check the type field.' },
          { status: 400 }
        )
      }
      
      if (error.code === '23503') {
        return NextResponse.json(
          { error: 'User not found. Please log in again.' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to save source', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      source
    })

  } catch (error) {
    console.error('Error in source connection:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create Supabase client
    const supabase = createServerSupabaseClient()

    // Get user's sources
    const { data: sources, error } = await supabase
      .from('sources')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching sources:', error)
      // Check if it's a table doesn't exist error
      if (error.message?.includes('relation "sources" does not exist')) {
        return NextResponse.json({
          success: true,
          sources: [],
          message: 'Sources table not found. Please run the database setup script.'
        })
      }
      return NextResponse.json(
        { error: 'Failed to fetch sources', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      sources: sources || []
    })

  } catch (error) {
    console.error('Error fetching sources:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getUserFromSession(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get source ID from URL parameters
    const { searchParams } = new URL(request.url)
    const sourceId = searchParams.get('id')

    if (!sourceId) {
      return NextResponse.json(
        { error: 'Source ID is required' },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = createServerSupabaseClient()

    // Delete the source (only if it belongs to the user)
    const { error } = await supabase
      .from('sources')
      .delete()
      .eq('id', sourceId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting source:', error)
      return NextResponse.json(
        { error: 'Failed to delete source' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Source deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting source:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 