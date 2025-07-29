// X (Twitter) API v2 integration
const X_BEARER_TOKEN = process.env.X_BEARER_TOKEN || ''

export interface XTweet {
  id: string
  text: string
  created_at: string
  author_id: string
  public_metrics?: {
    retweet_count: number
    reply_count: number
    like_count: number
    quote_count: number
  }
  entities?: {
    hashtags?: Array<{ tag: string }>
    mentions?: Array<{ username: string }>
    urls?: Array<{ url: string; expanded_url: string }>
  }
}

export interface XUser {
  id: string
  username: string
  name: string
  description?: string
  public_metrics?: {
    followers_count: number
    following_count: number
    tweet_count: number
  }
}

export interface XTrend {
  name: string
  url: string
  promoted_content?: string
  query: string
  tweet_volume?: number
}

export interface XSearchResult {
  data: XTweet[]
  includes?: {
    users?: XUser[]
  }
  meta?: {
    result_count: number
    next_token?: string
  }
}

/**
 * Get tweets from a specific user
 */
export async function getUserTweets(username: string, maxResults: number = 10): Promise<XTweet[]> {
  try {
    if (!X_BEARER_TOKEN) {
      throw new Error('X_BEARER_TOKEN is required. Please add it to your .env.local file')
    }

    console.log(`Fetching tweets from @${username} using X API v2`)
    console.log(`X_BEARER_TOKEN available: ${X_BEARER_TOKEN.substring(0, 10)}...`)

    // First get user ID
    const userResponse = await fetch(`https://api.x.com/2/users/by/username/${username}`, {
      headers: {
        'Authorization': `Bearer ${X_BEARER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    if (!userResponse.ok) {
      throw new Error(`Failed to get user: ${userResponse.status} ${userResponse.statusText}`)
    }

    const userData = await userResponse.json()
    const userId = userData.data.id

    // Get user's tweets
    const tweetsResponse = await fetch(
      `https://api.x.com/2/users/${userId}/tweets?max_results=${maxResults}&tweet.fields=created_at,public_metrics,entities&exclude=retweets,replies`,
      {
        headers: {
          'Authorization': `Bearer ${X_BEARER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!tweetsResponse.ok) {
      throw new Error(`Failed to get tweets: ${tweetsResponse.status} ${tweetsResponse.statusText}`)
    }

    const tweetsData: XSearchResult = await tweetsResponse.json()
    return tweetsData.data || []

  } catch (error) {
    console.error('Error fetching user tweets:', error)
    throw error
  }
}

/**
 * Search tweets by hashtag or keyword
 */
export async function searchTweets(query: string, maxResults: number = 10): Promise<XTweet[]> {
  try {
    if (!X_BEARER_TOKEN) {
      throw new Error('X_BEARER_TOKEN is required. Please add it to your .env.local file')
    }

    console.log(`Searching tweets for: ${query}`)

    const response = await fetch(
      `https://api.x.com/2/tweets/search/recent?query=${encodeURIComponent(query)}&max_results=${maxResults}&tweet.fields=created_at,public_metrics,entities`,
      {
        headers: {
          'Authorization': `Bearer ${X_BEARER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to search tweets: ${response.status} ${response.statusText}`)
    }

    const data: XSearchResult = await response.json()
    return data.data || []

  } catch (error) {
    console.error('Error searching tweets:', error)
    throw error
  }
}

/**
 * Get trending topics
 */
export async function getTrendingTopics(woeid: number = 1): Promise<XTrend[]> {
  try {
    if (!X_BEARER_TOKEN) {
      throw new Error('X_BEARER_TOKEN is required. Please add it to your .env.local file')
    }

    console.log(`Fetching trending topics for WOEID: ${woeid}`)

    const response = await fetch(`https://api.x.com/1.1/trends/place.json?id=${woeid}`, {
      headers: {
        'Authorization': `Bearer ${X_BEARER_TOKEN}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get trends: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data[0]?.trends || []

  } catch (error) {
    console.error('Error fetching trending topics:', error)
    throw error
  }
}

/**
 * Get user profile information
 */
export async function getUserProfile(username: string): Promise<XUser | null> {
  try {
    if (!X_BEARER_TOKEN) {
      throw new Error('X_BEARER_TOKEN is required. Please add it to your .env.local file')
    }

    console.log(`Fetching profile for @${username}`)

    const response = await fetch(
      `https://api.x.com/2/users/by/username/${username}?user.fields=description,public_metrics`,
      {
        headers: {
          'Authorization': `Bearer ${X_BEARER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to get user profile: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || null

  } catch (error) {
    console.error('Error fetching user profile:', error)
    throw error
  }
}

/**
 * Convert X content to CrawlResult format for trend analysis
 */
export function convertXTweetsToCrawlResult(tweets: XTweet[], sourceUrl: string): CrawlResult {
  const content = tweets.map(tweet => {
    const hashtags = tweet.entities?.hashtags?.map(h => `#${h.tag}`).join(' ') || ''
    const mentions = tweet.entities?.mentions?.map(m => `@${m.username}`).join(' ') || ''
    const urls = tweet.entities?.urls?.map(u => u.expanded_url).join(' ') || ''
    
    return `${tweet.text} ${hashtags} ${mentions} ${urls}`.trim()
  }).join('\n\n')

  return {
    url: sourceUrl,
    title: `X Content: ${tweets.length} tweets`,
    content,
    metadata: {
      platform: 'x',
      tweetCount: tweets.length,
      totalLikes: tweets.reduce((sum, tweet) => sum + (tweet.public_metrics?.like_count || 0), 0),
      totalRetweets: tweets.reduce((sum, tweet) => sum + (tweet.public_metrics?.retweet_count || 0), 0),
      hashtags: tweets.flatMap(tweet => tweet.entities?.hashtags?.map(h => h.tag) || []),
      mentions: tweets.flatMap(tweet => tweet.entities?.mentions?.map(m => m.username) || [])
    },
    timestamp: new Date().toISOString()
  }
}

// Import CrawlResult type
import type { CrawlResult } from './firecrawl-mcp' 