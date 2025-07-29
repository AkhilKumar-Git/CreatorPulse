import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getUserFromSession } from '@/lib/auth'
import { trendAgent, type Trend } from '@/lib/trend-agent'
import type { RankedTrend } from '@/lib/trend-ranking'

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

    const supabase = createServerSupabaseClient()

    // Get user's sources
    const { data: sources, error: sourcesError } = await supabase
      .from('sources')
      .select('*')
      .eq('user_id', user.id)

    if (sourcesError) {
      console.error('Error fetching sources:', sourcesError)
      return NextResponse.json(
        { error: 'Failed to fetch sources' },
        { status: 500 }
      )
    }

    // CreatorPulse Enhanced Trend Detection with Ranking
    let rankedTrends: RankedTrend[] = []
    
    // Parse query parameters for advanced filtering
    const url = new URL(request.url)
    const maxResults = parseInt(url.searchParams.get('maxResults') || '20') // Changed to 20
    const timeWindow = parseInt(url.searchParams.get('timeWindow') || '24') // Day only
    const categories = url.searchParams.get('categories')?.split(',') || []
    const includeGlobal = url.searchParams.get('includeGlobal') !== 'false'
    
    console.log(`🚀 CreatorPulse API: Starting trend detection with advanced ranking`)
    console.log(`📊 Config: ${maxResults} results, ${timeWindow}h window, categories: [${categories.join(',')}]`)
    
    // Use the new ranked trends system
    rankedTrends = await trendAgent.getRankedTrends(sources || [], {
      maxResults,
      categories,
      timeWindow,
      includeGlobal
    })
    
    // Convert RankedTrends back to legacy Trend format for compatibility
    const trends: Trend[] = rankedTrends.map(rt => ({
      topic: rt.title,
      explainer: `${rt.content.substring(0, 200)}... (Score: ${rt.score.overall.toFixed(3)}, Source: ${rt.source})`,
      link: rt.url,
      confidence: rt.score.overall,
      timestamp: rt.timestamp,
      category: rt.category,
      sources: [rt.source]
    }))

    // Store trends in database
    const { data: storedTrends, error: storeError } = await supabase
      .from('trends')
      .insert({
        date: new Date().toISOString().split('T')[0],
        topics_json: {
          user_id: user.id,
          trends,
          timestamp: new Date().toISOString()
        }
      })
      .select()

    if (storeError) {
      console.error('Error storing trends:', storeError)
      return NextResponse.json(
        { error: 'Failed to store trends' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      trends,
      rankedTrends, // Include the full ranked trends data
      stored: storedTrends,
      metadata: {
        totalSources: sources?.length || 0,
        userSources: sources?.length || 0,
        globalIncluded: includeGlobal,
        trendsFound: trends.length,
        rankedTrendsFound: rankedTrends.length,
        timeWindow: `${timeWindow} hours`,
        categories: categories.length > 0 ? categories : 'all',
        timestamp: new Date().toISOString(),
        scoring: {
          recencyWeight: 0.4,
          popularityWeight: 0.4,
          engagementWeight: 0.2,
          topScore: rankedTrends[0]?.score.overall || 0
        }
      }
    })

  } catch (error) {
    console.error('Error in trend detection:', error)
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

    const supabase = createServerSupabaseClient()

    // Get user's recent trends
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