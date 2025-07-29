import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { trendAgent } from '@/lib/trend-agent'

export async function POST(request: NextRequest) {
  try {
    // Verify the request is from a cron job (you can add authentication here)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServerSupabaseClient()

    // Get all users with sources
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        sources (
          id,
          type,
          url,
          content,
          metadata
        )
      `)

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    const results = []

    // Process each user's sources
    for (const user of users || []) {
      try {
        if (!user.sources || user.sources.length === 0) {
          continue
        }

        // Detect trends for user's sources
        const trends = await trendAgent.detectUserTrends(user.sources)

        // Store trends in database
        const { error: storeError } = await supabase
          .from('trends')
          .insert({
            date: new Date().toISOString().split('T')[0], // Current date
            topics_json: {
              user_id: user.id,
              trends,
              timestamp: new Date().toISOString()
            }
          })
          .select()

        if (storeError) {
          console.error(`Error storing trends for user ${user.id}:`, storeError)
          continue
        }

        results.push({
          user_id: user.id,
          email: user.email,
          trends_count: trends.length,
          stored: true
        })

      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error)
        results.push({
          user_id: user.id,
          email: user.email,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    // Also detect global trends
    try {
      const globalTrends = await trendAgent.searchTrends()
      
      const { error: globalStoreError } = await supabase
        .from('trends')
        .insert({
          date: new Date().toISOString().split('T')[0],
          topics_json: {
            type: 'global',
            trends: globalTrends,
            timestamp: new Date().toISOString()
          }
        })
        .select()

      if (globalStoreError) {
        console.error('Error storing global trends:', globalStoreError)
      } else {
        results.push({
          type: 'global',
          trends_count: globalTrends.length,
          stored: true
        })
      }
    } catch (error) {
      console.error('Error processing global trends:', error)
      results.push({
        type: 'global',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Trend detection completed',
      results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in trend detection cron job:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Manual trigger endpoint for testing
export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // Get recent trends
    const { data: trends, error } = await supabase
      .from('trends')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching trends:', error)
      return NextResponse.json(
        { error: 'Failed to fetch trends' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      trends
    })

  } catch (error) {
    console.error('Error fetching trends:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 