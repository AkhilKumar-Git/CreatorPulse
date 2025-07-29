// Trend ranking and scoring system
import { searchTweets, getTrendingTopics } from './x-api'
import { getTrendingVideos } from './youtube-api'
import { crawlTrendingSites, type CrawlResult } from './firecrawl-mcp'

export interface TrendScore {
  recency: number      // 0-1 (1 = most recent)
  popularity: number   // 0-1 (1 = most popular)
  engagement: number   // 0-1 (1 = highest engagement)
  overall: number      // Combined weighted score
}

export interface RankedTrend {
  id: string
  title: string
  content: string
  source: string
  sourceType: 'x' | 'youtube' | 'news' | 'global'
  url: string
  timestamp: string
  metrics: {
    likes?: number
    shares?: number
    comments?: number
    views?: number
    retweets?: number
  }
  score: TrendScore
  tags: string[]
  category: 'technology' | 'business' | 'social' | 'entertainment' | 'science' | 'general'
}

export interface GlobalTrendSources {
  xTrending: string[]
  youtubeTrending: YouTubeVideo[]
  newsTrending: CrawlResult[]
  techTrending: CrawlResult[]
}

interface YouTubeVideo {
  id: string
  snippet?: {
    title?: string
    description?: string
    channelTitle?: string
    publishedAt?: string
    tags?: string[]
  }
  statistics?: {
    viewCount?: string
    likeCount?: string
    commentCount?: string
  }
}

/**
 * Fetch global trending content from all platforms
 */
export async function fetchGlobalTrends(): Promise<GlobalTrendSources> {
  console.log('🌍 Fetching global trending content...')
  
  const results: GlobalTrendSources = {
    xTrending: [],
    youtubeTrending: [],
    newsTrending: [],
    techTrending: []
  }

  try {
    // Get X trending topics (global)
    console.log('📱 Fetching X trending topics...')
    const xTrends = await getTrendingTopics(1) // Global trends
    results.xTrending = xTrends.map(trend => trend.name)
    
    // Get trending X content for top trends
    if (results.xTrending.length > 0) {
      const topTrend = results.xTrending[0]
      console.log(`🔥 Searching X for trending topic: ${topTrend}`)
      await searchTweets(topTrend, 10)
    }
  } catch (error) {
    console.error('Error fetching X trends:', error)
  }

  try {
    // Get YouTube trending videos
    console.log('📺 Fetching YouTube trending videos...')
    results.youtubeTrending = await getTrendingVideos('US', 10)
  } catch (error) {
    console.error('Error fetching YouTube trends:', error)
  }

  try {
    // Get trending from news and tech sites
    console.log('📰 Fetching trending news and tech content...')
    results.newsTrending = await crawlTrendingSites()
  } catch (error) {
    console.error('Error fetching news trends:', error)
  }

  console.log(`✅ Global trends fetched: ${results.xTrending.length} X trends, ${results.youtubeTrending.length} YouTube videos, ${results.newsTrending.length} news articles`)
  
  return results
}

/**
 * Calculate trend score based on recency, popularity, and engagement
 */
export function calculateTrendScore(trend: Partial<RankedTrend>): TrendScore {
  const now = new Date()
  const trendTime = new Date(trend.timestamp || now)
  const ageInHours = (now.getTime() - trendTime.getTime()) / (1000 * 60 * 60)
  
  // Recency score (exponential decay - newer = higher score)
  const recency = Math.max(0, Math.min(1, Math.exp(-ageInHours / 24))) // 24-hour half-life
  
  // Popularity score (normalized metrics)
  const metrics = trend.metrics || {}
  const totalEngagement = (metrics.likes || 0) + 
                          (metrics.shares || 0) + 
                          (metrics.comments || 0) + 
                          (metrics.retweets || 0) + 
                          (metrics.views || 0) / 100 // Views weighted lower
  
  const popularity = Math.min(1, Math.log10(totalEngagement + 1) / 6) // Log scale, max at 1M engagement
  
  // Engagement rate (comments + shares / total impressions)
  const activeEngagement = (metrics.comments || 0) + (metrics.shares || 0) + (metrics.retweets || 0)
  const totalImpressions = Math.max(metrics.views || 0, metrics.likes || 0)
  const engagement = totalImpressions > 0 ? Math.min(1, activeEngagement / totalImpressions * 100) : 0
  
  // Weighted overall score
  const overall = (recency * 0.4) + (popularity * 0.4) + (engagement * 0.2)
  
  return {
    recency,
    popularity,
    engagement,
    overall
  }
}

interface XTweet {
  id: string
  text: string
  created_at: string
  author_id: string
  public_metrics?: {
    like_count: number
    retweet_count: number
    reply_count: number
    quote_count: number
  }
  entities?: {
    hashtags?: Array<{ tag: string }>
  }
}

/**
 * Convert X content to ranked trends
 */
export function convertXToRankedTrends(tweets: XTweet[], sourceType: 'x' = 'x'): RankedTrend[] {
  return tweets.map((tweet) => {
    const trend: RankedTrend = {
      id: `x_${tweet.id}`,
      title: tweet.text.substring(0, 100) + (tweet.text.length > 100 ? '...' : ''),
      content: tweet.text,
      source: `@${tweet.author_id}`,
      sourceType,
      url: `https://x.com/i/status/${tweet.id}`,
      timestamp: tweet.created_at,
      metrics: {
        likes: tweet.public_metrics?.like_count || 0,
        retweets: tweet.public_metrics?.retweet_count || 0,
        comments: tweet.public_metrics?.reply_count || 0,
        shares: tweet.public_metrics?.quote_count || 0
      },
      score: { recency: 0, popularity: 0, engagement: 0, overall: 0 },
      tags: tweet.entities?.hashtags?.map((h: { tag: string }) => h.tag) || [],
      category: 'general'
    }
    
    trend.score = calculateTrendScore(trend)
    return trend
  })
}

/**
 * Convert YouTube content to ranked trends
 */
export function convertYouTubeToRankedTrends(videos: YouTubeVideo[]): RankedTrend[] {
  return videos.map((video) => {
    const trend: RankedTrend = {
      id: `yt_${video.id}`,
      title: video.snippet?.title || 'Untitled Video',
      content: video.snippet?.description || '',
      source: video.snippet?.channelTitle || 'Unknown Channel',
      sourceType: 'youtube',
      url: `https://youtube.com/watch?v=${video.id}`,
      timestamp: video.snippet?.publishedAt || new Date().toISOString(),
      metrics: {
        views: parseInt(video.statistics?.viewCount || '0'),
        likes: parseInt(video.statistics?.likeCount || '0'),
        comments: parseInt(video.statistics?.commentCount || '0')
      },
      score: { recency: 0, popularity: 0, engagement: 0, overall: 0 },
      tags: video.snippet?.tags || [],
      category: 'general'
    }
    
    trend.score = calculateTrendScore(trend)
    return trend
  })
}

/**
 * Convert news/blog content to ranked trends
 */
export function convertNewsToRankedTrends(articles: CrawlResult[]): RankedTrend[] {
  return articles.map((article, index) => {
    // Create a more unique ID using URL hash and timestamp
    const urlHash = article.url.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const trend: RankedTrend = {
      id: `news_${Math.abs(urlHash)}_${Date.now()}_${index}`,
      title: article.title || 'Untitled Article',
      content: article.content.substring(0, 500),
      source: extractDomain(article.url),
      sourceType: 'news',
      url: article.url,
      timestamp: article.timestamp,
      metrics: {
        // News articles don't have direct metrics, so we estimate based on content quality
        views: article.content.length * 10, // Rough estimate
      },
      score: { recency: 0, popularity: 0, engagement: 0, overall: 0 },
      tags: extractTagsFromContent(article.content),
      category: categorizeTrend(article.content, article.title || '')
    }
    
    trend.score = calculateTrendScore(trend)
    return trend
  })
}

/**
 * Combine and rank all trends
 */
export function combineAndRankTrends(
  userTrends: RankedTrend[],
  globalTrends: RankedTrend[],
  options: {
    maxResults?: number
    minScore?: number
    categories?: string[]
    timeWindow?: number // hours
  } = {}
): RankedTrend[] {
  const {
    maxResults = 50,
    minScore = 0.1,
    categories = [],
    timeWindow = 24
  } = options

  console.log(`🔀 Combining ${userTrends.length} user trends with ${globalTrends.length} global trends`)

  // Combine all trends
  const allTrends = [...userTrends, ...globalTrends]

  // Filter by time window
  const now = new Date()
  const filtered = allTrends.filter(trend => {
    const trendTime = new Date(trend.timestamp)
    const ageInHours = (now.getTime() - trendTime.getTime()) / (1000 * 60 * 60)
    return ageInHours <= timeWindow
  })

  // Filter by categories if specified
  const categoryFiltered = categories.length > 0 
    ? filtered.filter(trend => categories.includes(trend.category))
    : filtered

  // Filter by minimum score
  const scoreFiltered = categoryFiltered.filter(trend => trend.score.overall >= minScore)

  // Sort by overall score (descending)
  const sorted = scoreFiltered.sort((a, b) => b.score.overall - a.score.overall)

  console.log(`✨ Ranked ${sorted.length} trends, returning top ${maxResults}`)

  return sorted.slice(0, maxResults)
}

/**
 * Helper functions
 */
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return 'unknown'
  }
}

function extractTagsFromContent(content: string): string[] {
  const words = content.toLowerCase().split(/\s+/)
  const techKeywords = [
    'ai', 'artificial intelligence', 'machine learning', 'blockchain', 'crypto',
    'startup', 'funding', 'ipo', 'acquisition', 'venture capital',
    'saas', 'api', 'cloud', 'aws', 'google', 'microsoft',
    'react', 'javascript', 'python', 'typescript', 'nodejs'
  ]
  
  return techKeywords.filter(keyword => 
    words.some(word => word.includes(keyword.replace(' ', '')))
  ).slice(0, 5)
}

function categorizeTrend(content: string, title: string): RankedTrend['category'] {
  const text = (content + ' ' + title).toLowerCase()
  
  if (text.includes('ai') || text.includes('artificial intelligence') || text.includes('machine learning')) {
    return 'technology'
  }
  if (text.includes('startup') || text.includes('funding') || text.includes('business')) {
    return 'business'
  }
  if (text.includes('social') || text.includes('viral') || text.includes('trending')) {
    return 'social'
  }
  if (text.includes('entertainment') || text.includes('celebrity') || text.includes('movie')) {
    return 'entertainment'
  }
  if (text.includes('research') || text.includes('study') || text.includes('science')) {
    return 'science'
  }
  
  return 'general'
} 