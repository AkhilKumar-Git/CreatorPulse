// YouTube Data API v3 integration
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || ''

export interface YouTubeVideo {
  id: string
  title: string
  description: string
  publishedAt: string
  channelId: string
  channelTitle: string
  thumbnails: {
    default?: { url: string; width: number; height: number }
    medium?: { url: string; width: number; height: number }
    high?: { url: string; width: number; height: number }
  }
  statistics?: {
    viewCount: string
    likeCount: string
    commentCount: string
  }
  tags?: string[]
  categoryId: string
  duration?: string
}

export interface YouTubeChannel {
  id: string
  title: string
  description: string
  publishedAt: string
  thumbnails: {
    default?: { url: string; width: number; height: number }
    medium?: { url: string; width: number; height: number }
    high?: { url: string; width: number; height: number }
  }
  statistics?: {
    viewCount: string
    subscriberCount: string
    videoCount: string
  }
  customUrl?: string
}

export interface YouTubeSearchResult {
  items: YouTubeVideo[]
  nextPageToken?: string
  pageInfo: {
    totalResults: number
    resultsPerPage: number
  }
}

export interface YouTubeTrendingResult {
  items: YouTubeVideo[]
  nextPageToken?: string
  pageInfo: {
    totalResults: number
    resultsPerPage: number
  }
}

/**
 * Get videos from a specific channel
 */
export async function getChannelVideos(channelId: string, maxResults: number = 10): Promise<YouTubeVideo[]> {
  try {
    if (!YOUTUBE_API_KEY) {
      throw new Error('YOUTUBE_API_KEY is required. Please add it to your .env.local file')
    }

    console.log(`Fetching videos from channel: ${channelId}`)

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=${maxResults}&order=date&type=video&key=${YOUTUBE_API_KEY}`
    )

    if (!response.ok) {
      throw new Error(`Failed to get channel videos: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.items || data.items.length === 0) {
      return []
    }

    // Get video details including statistics
    const videoIds = data.items.map((item: Record<string, { videoId: string }>) => item.id.videoId).join(',')
    const detailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    )

    if (!detailsResponse.ok) {
      throw new Error(`Failed to get video details: ${detailsResponse.status} ${detailsResponse.statusText}`)
    }

    const detailsData = await detailsResponse.json()
    return detailsData.items || []

  } catch (error) {
    console.error('Error fetching channel videos:', error)
    throw error
  }
}

/**
 * Search videos by keyword
 */
export async function searchVideos(query: string, maxResults: number = 10): Promise<YouTubeVideo[]> {
  try {
    if (!YOUTUBE_API_KEY) {
      throw new Error('YOUTUBE_API_KEY is required. Please add it to your .env.local file')
    }

    console.log(`Searching videos for: ${query}`)

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=${maxResults}&order=relevance&type=video&key=${YOUTUBE_API_KEY}`
    )

    if (!response.ok) {
      throw new Error(`Failed to search videos: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.items || data.items.length === 0) {
      return []
    }

    // Get video details including statistics
    const videoIds = data.items.map((item: Record<string, { videoId: string }>) => item.id.videoId).join(',')
    const detailsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
    )

    if (!detailsResponse.ok) {
      throw new Error(`Failed to get video details: ${detailsResponse.status} ${detailsResponse.statusText}`)
    }

    const detailsData = await detailsResponse.json()
    return detailsData.items || []

  } catch (error) {
    console.error('Error searching videos:', error)
    throw error
  }
}

/**
 * Get trending videos
 */
export async function getTrendingVideos(regionCode: string = 'US', maxResults: number = 10): Promise<YouTubeVideo[]> {
  try {
    if (!YOUTUBE_API_KEY) {
      throw new Error('YOUTUBE_API_KEY is required. Please add it to your .env.local file')
    }

    console.log(`Fetching trending videos for region: ${regionCode}`)

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=${regionCode}&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`
    )

    if (!response.ok) {
      throw new Error(`Failed to get trending videos: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.items || []

  } catch (error) {
    console.error('Error fetching trending videos:', error)
    throw error
  }
}

/**
 * Get channel information
 */
export async function getChannelInfo(channelId: string): Promise<YouTubeChannel | null> {
  try {
    if (!YOUTUBE_API_KEY) {
      throw new Error('YOUTUBE_API_KEY is required. Please add it to your .env.local file')
    }

    console.log(`Fetching channel info for: ${channelId}`)

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`
    )

    if (!response.ok) {
      throw new Error(`Failed to get channel info: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.items?.[0] || null

  } catch (error) {
    console.error('Error fetching channel info:', error)
    throw error
  }
}

/**
 * Get channel ID from username, custom URL, or handle
 */
export async function getChannelIdFromUsername(identifier: string): Promise<string | null> {
  try {
    if (!YOUTUBE_API_KEY) {
      throw new Error('YOUTUBE_API_KEY is required. Please add it to your .env.local file')
    }

    console.log(`Getting channel ID for identifier: ${identifier}`)

    // If it's already a channel ID (starts with UC), return it
    if (identifier.startsWith('UC') && identifier.length === 24) {
      return identifier
    }

    // Try different methods to find the channel
    
    // Method 1: Search by channel name
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(identifier)}&type=channel&maxResults=1&key=${YOUTUBE_API_KEY}`
    )

    if (searchResponse.ok) {
      const searchData = await searchResponse.json()
      if (searchData.items && searchData.items.length > 0) {
        const channelId = searchData.items[0].snippet.channelId
        console.log(`Found channel ID via search: ${channelId}`)
        return channelId
      }
    }

    // Method 2: Try forUsername (legacy usernames)
    const usernameResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id&forUsername=${identifier}&key=${YOUTUBE_API_KEY}`
    )

    if (usernameResponse.ok) {
      const usernameData = await usernameResponse.json()
      if (usernameData.items && usernameData.items.length > 0) {
        const channelId = usernameData.items[0].id
        console.log(`Found channel ID via username: ${channelId}`)
        return channelId
      }
    }

    console.log(`Could not find channel ID for: ${identifier}`)
    return null

  } catch (error) {
    console.error('Error getting channel ID:', error)
    return null
  }
}

/**
 * Convert YouTube content to CrawlResult format for trend analysis
 */
export function convertYouTubeVideosToCrawlResult(videos: YouTubeVideo[], sourceUrl: string): CrawlResult {
  const content = videos.map(video => {
    const tags = video.tags?.join(' ') || ''
    const stats = video.statistics ? 
      `Views: ${video.statistics.viewCount}, Likes: ${video.statistics.likeCount}` : ''
    
    return `${video.title}\n${video.description}\n${tags}\n${stats}`.trim()
  }).join('\n\n')

  return {
    url: sourceUrl,
    title: `YouTube Content: ${videos.length} videos`,
    content,
    metadata: {
      platform: 'youtube',
      videoCount: videos.length,
      totalViews: videos.reduce((sum, video) => sum + parseInt(video.statistics?.viewCount || '0'), 0),
      totalLikes: videos.reduce((sum, video) => sum + parseInt(video.statistics?.likeCount || '0'), 0),
      categories: [...new Set(videos.map(video => video.categoryId))],
      tags: videos.flatMap(video => video.tags || [])
    },
    timestamp: new Date().toISOString()
  }
}

// Import CrawlResult type
import type { CrawlResult } from './firecrawl-mcp' 