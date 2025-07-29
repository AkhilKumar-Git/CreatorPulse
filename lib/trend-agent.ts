import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { crawlTrendingSites, batchCrawlUrls, extractTrendingTopics, type CrawlResult } from './firecrawl-mcp'
import { getUserTweets, searchTweets, convertXTweetsToCrawlResult } from './x-api'
import { getChannelVideos, convertYouTubeVideosToCrawlResult, getChannelIdFromUsername } from './youtube-api'
import { 
  fetchGlobalTrends, 
  combineAndRankTrends, 
  convertXToRankedTrends, 
  convertYouTubeToRankedTrends, 
  convertNewsToRankedTrends,
  type RankedTrend 
} from './trend-ranking'

export interface Trend {
  topic: string
  explainer: string
  link: string
  confidence: number
  timestamp: string
  category?: string
  sources?: string[]
}

export interface TrendAnalysis {
  trends: Trend[]
  summary: string
  timestamp: string
  metadata?: {
    totalSources: number
    processingTime: number
    cacheHits: number
  }
}

// Enhanced LangChain model with better error handling
const createModel = () => {
  const openAIApiKey = process.env.OPENAI_API_KEY || ''
  
  if (!openAIApiKey || openAIApiKey.trim() === '') {
    throw new Error('OPENAI_API_KEY is required. Please add it to your .env.local file')
  }
  
  return new ChatOpenAI({
    modelName: 'gpt-4o',
    temperature: 0.7,
    openAIApiKey,
    maxTokens: 2000,
    timeout: 30000 // 30 second timeout
  })
}

/**
 * Enhanced trend detection agent using Firecrawl v1 API
 */
export class TrendDetectionAgent {
  private model: ChatOpenAI
  private startTime: number = 0

  constructor() {
    this.model = createModel()
  }

  /**
   * Enhanced trend analysis with structured content processing
   */
  async analyzeTrends(content: CrawlResult[]): Promise<TrendAnalysis> {
    this.startTime = Date.now()
    
    try {
      console.log(`Starting enhanced trend analysis for ${content.length} sources`)
      
      if (!content.length) {
        console.log('No content provided for trend analysis')
        throw new Error('No content provided for trend analysis')
      }

      // Filter and prepare high-quality content
      const qualityContent = content
        .filter(item => item.content && item.content.length > 100)
        .slice(0, 25) // Limit for better processing

      if (!qualityContent.length) {
        console.log('No quality content found after filtering')
        throw new Error('No quality content found after filtering')
      }

      // Extract trending keywords for additional context
      const allContent = qualityContent.map(item => item.content).join(' ')
      const trendingKeywords = extractTrendingTopics(allContent)

             // Use LangChain for trend analysis
      console.log('Using LangChain for trend analysis')

      // Structure content for LLM analysis
      const structuredContent = qualityContent.map((item, index) => ({
        id: index + 1,
        source: this.cleanUrl(item.url),
        title: item.title?.slice(0, 100) || 'Untitled',
        content: item.content.slice(0, 800), // Limit content per source
        timestamp: item.timestamp,
        keywords: item.metadata?.keywords || ''
      }))

      const prompt = PromptTemplate.fromTemplate(`
        You are an expert trend analyst. Analyze the following web content to identify the top 3 most significant trending topics.

        Context: This content was crawled from various sources including tech news, social media, and trending sites.
        
        Key trending keywords detected: {keywords}
        
        Focus on identifying:
        - Emerging technologies, products, or breakthrough announcements
        - Breaking news with viral potential  
        - Popular discussions or social movements
        - Business developments, funding, or market shifts
        - Cultural trends or entertainment phenomena

        Sources to analyze:
        {content}

        For each trend, provide:
        1. A specific, compelling topic name (3-6 words)
        2. A clear explanation (2-3 sentences) of why this is trending and its impact
        3. The strongest evidence from the sources
        4. A confidence score (0.1-1.0) based on source quality and frequency
        5. A relevant category

        Respond in valid JSON format only:
        {{
          "trends": [
            {{
              "topic": "Specific Trend Name",
              "explainer": "Clear explanation of the trend's significance and why it's gaining attention now.",
              "evidence": "Specific quotes, data points, or facts from the sources that support this trend.",
              "confidence": 0.85,
              "category": "Technology|Business|Social|Entertainment|Science|Politics",
              "link": "most relevant source URL"
            }}
          ],
          "summary": "Brief overview of the trending landscape and key themes"
        }}
      `)

      const chain = prompt.pipe(this.model).pipe(new StringOutputParser())

             console.log('🤖 Using LangChain with OpenAI GPT-3.5 for trend analysis...')
       console.log('📊 LangChain Pipeline: PromptTemplate → ChatOpenAI → StringOutputParser')
       console.log('📝 Structured content size:', JSON.stringify(structuredContent).length, 'characters')
       
       const result = await chain.invoke({
         content: JSON.stringify(structuredContent, null, 2),
         keywords: trendingKeywords.slice(0, 10).join(', ')
       })
       
       console.log('✅ LangChain analysis completed, parsing AI response...')

      // Parse and validate LLM response
      let parsedResult
      try {
        // Clean up response if it has markdown formatting
        const cleanResult = result
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim()
        
        parsedResult = JSON.parse(cleanResult)
      } catch (parseError) {
        console.error('Failed to parse LLM response:', parseError)
        console.log('Raw LLM response:', result)
        throw new Error('Failed to parse LLM response for trend analysis')
      }

      const trends = (parsedResult.trends || []).map((trend: Record<string, unknown>) => ({
        topic: trend.topic || 'Unknown Topic',
        explainer: trend.explainer || trend.explanation || 'No explanation provided',
        link: trend.link || qualityContent[0]?.url || '#',
        confidence: Math.min(Math.max((trend.confidence as number) || 0.5, 0.1), 1.0),
        timestamp: new Date().toISOString(),
        category: trend.category || 'General',
        sources: qualityContent.slice(0, 3).map(item => item.url)
      }))

      const processingTime = Date.now() - this.startTime
      console.log(`Trend analysis completed in ${processingTime}ms, found ${trends.length} trends`)

      return {
        trends,
        summary: parsedResult.summary || `Analyzed ${qualityContent.length} sources and identified ${trends.length} trending topics`,
        timestamp: new Date().toISOString(),
        metadata: {
          totalSources: qualityContent.length,
          processingTime,
          cacheHits: 0 // TODO: Implement cache hit tracking
        }
      }

          } catch (error) {
        console.error('Error in enhanced trend analysis:', error)
        throw error
      }
  }

  /**
   * Search for global trending topics using enhanced crawling
   */
  async searchTrends(): Promise<Trend[]> {
    try {
      console.log('Starting global trend search with enhanced crawling...')
      
      // Use enhanced trending sites crawling with parallel processing
      const trendingSiteResults = await crawlTrendingSites()
      
      // Add specific trending search targets (news and tech sites only)
      const trendingTargets = [
        'https://trends.google.com/trends/trendingsearches/daily',
        'https://news.ycombinator.com',
        'https://github.com/trending',
        'https://www.producthunt.com',
        'https://dev.to'
      ]

      // Batch crawl trending targets with rate limiting
      const targetResults = await batchCrawlUrls(trendingTargets, {
        limit: 3,
        maxAge: 1800000, // 30 minutes cache
        concurrency: 2
      })

      // Combine all results
      const allContent = [...trendingSiteResults, ...targetResults]
      
      console.log(`Crawled ${allContent.length} pages for trend analysis`)
      
      if (!allContent.length) {
        console.log('No content crawled from trending sites')
        return []
      }

      // Analyze combined content
      const analysis = await this.analyzeTrends(allContent)
      
      return analysis.trends

    } catch (error) {
      console.error('Error in global trend search:', error)
      return []
    }
  }

  /**
   * Enhanced user trend detection with better source handling
   */
  async detectUserTrends(sources: Array<{ url?: string; type?: string; content?: string }>): Promise<Trend[]> {
    try {
      console.log(`Detecting trends from ${sources.length} user sources`)
      
      if (!sources.length) {
        console.log('No user sources provided')
        return []
      }

      // Process different types of sources
      const crawlResults: CrawlResult[] = []
      
      for (const source of sources) {
        try {
          console.log(`Processing source:`, { type: source.type, content: source.content, url: source.url })
          
          if ((source.type === 'x' || source.type === 'twitter') && source.content) {
            // Handle X (Twitter) sources
            const username = source.content.replace('@', '')
            console.log(`Fetching X content for @${username}`)
            
            const tweets = await getUserTweets(username, 10)
            if (tweets.length > 0) {
              const xResult = convertXTweetsToCrawlResult(tweets, `https://x.com/${username}`)
              crawlResults.push(xResult)
              console.log(`✅ Successfully fetched ${tweets.length} tweets from @${username}`)
            } else {
              console.log(`No tweets found for @${username}`)
            }
          } else if ((source.type === 'x_hashtag' || source.type === 'hashtag') && source.content) {
            // Handle X hashtag searches
            const hashtag = source.content.replace('#', '')
            console.log(`Searching X for hashtag #${hashtag}`)
            
            const tweets = await searchTweets(`#${hashtag}`, 10)
            if (tweets.length > 0) {
              const xResult = convertXTweetsToCrawlResult(tweets, `https://x.com/search?q=%23${hashtag}`)
              crawlResults.push(xResult)
              console.log(`✅ Successfully found ${tweets.length} tweets for #${hashtag}`)
            } else {
              console.log(`No tweets found for #${hashtag}`)
            }
          } else if (source.type === 'youtube' && source.content) {
            // Handle YouTube channel sources
            console.log(`Fetching YouTube content for ${source.content}`)
            
            // Try to get channel ID from username/identifier
            const channelId = await getChannelIdFromUsername(source.content)
            if (!channelId) {
              console.log(`Could not find YouTube channel for: ${source.content}`)
              console.log('💡 Try using:')
              console.log('   - Channel ID (starts with UC, e.g., UC_x5XG1OV2P6uZZ5FSM9Ttw)')
              console.log('   - Exact channel name (e.g., "Google Developers")')
              console.log('   - Legacy username (if available)')
              continue
            }
            
            console.log(`Using YouTube channel ID: ${channelId}`)
            const videos = await getChannelVideos(channelId, 10)
            if (videos.length > 0) {
              const youtubeResult = convertYouTubeVideosToCrawlResult(videos, `https://youtube.com/channel/${channelId}`)
              crawlResults.push(youtubeResult)
              console.log(`✅ Successfully fetched ${videos.length} videos from YouTube channel`)
            } else {
              console.log(`No videos found for channel ${channelId}`)
            }
          } else if (source.url) {
            // Handle URL-based sources
            if (source.url.includes('x.com') || source.url.includes('twitter.com')) {
              // Extract username from X/Twitter URL
              const urlMatch = source.url.match(/(?:x\.com|twitter\.com)\/([^\/\?]+)/)
              if (urlMatch) {
                const username = urlMatch[1]
                console.log(`Fetching X content from URL for @${username}`)
                
                const tweets = await getUserTweets(username, 10)
                if (tweets.length > 0) {
                  const xResult = convertXTweetsToCrawlResult(tweets, source.url)
                  crawlResults.push(xResult)
                  console.log(`✅ Successfully fetched ${tweets.length} tweets from @${username}`)
                }
              }
            } else if (source.url.includes('youtube.com')) {
              // Extract channel from YouTube URL
              const channelMatch = source.url.match(/youtube\.com\/(?:channel\/|@|c\/|user\/)?([^\/\?]+)/)
              if (channelMatch) {
                const channelIdentifier = channelMatch[1]
                console.log(`Fetching YouTube content from URL for: ${channelIdentifier}`)
                
                const channelId = await getChannelIdFromUsername(channelIdentifier)
                if (channelId) {
                  const videos = await getChannelVideos(channelId, 10)
                  if (videos.length > 0) {
                    const youtubeResult = convertYouTubeVideosToCrawlResult(videos, source.url)
                    crawlResults.push(youtubeResult)
                    console.log(`✅ Successfully fetched ${videos.length} videos from YouTube`)
                  }
                }
              }
            } else {
              // Handle other URLs with Firecrawl (news, blogs, docs)
              console.log(`Crawling URL with Firecrawl: ${source.url}`)
              
              const firecrawlResults = await batchCrawlUrls([source.url], {
                limit: 5,
                maxAge: 3600000,
                concurrency: 1
              })
              
              crawlResults.push(...firecrawlResults)
            }
          } else {
            console.log(`⚠️  Unrecognized source type or missing content:`, { type: source.type, content: source.content, url: source.url })
            console.log('💡 Supported source types:')
            console.log('   - { type: "x", content: "username" }')
            console.log('   - { type: "twitter", content: "username" }')
            console.log('   - { type: "x_hashtag", content: "hashtag" }')
            console.log('   - { type: "hashtag", content: "hashtag" }')
            console.log('   - { type: "youtube", content: "channel_name_or_id" }')
            console.log('   - { url: "https://example.com" }')
          }
        } catch (error) {
          console.error(`Error processing source ${source.type}:${source.content}:`, error)
          // Continue with other sources even if one fails
        }
      }

      if (!crawlResults.length) {
        console.log('No content fetched from user sources')
        return []
      }

      console.log(`Successfully fetched content from ${crawlResults.length} sources`)

      // Analyze user-specific trends
      const analysis = await this.analyzeTrends(crawlResults)
      
      return analysis.trends

    } catch (error) {
      console.error('Error detecting user trends:', error)
      return []
    }
  }



  /**
   * Get ranked trends combining user sources with global trending content
   * This is the main method for CreatorPulse's trend detection
   */
  async getRankedTrends(
    sources: Array<{ url?: string; type?: string; content?: string }>,
    options: {
      maxResults?: number
      categories?: string[]
      timeWindow?: number
      includeGlobal?: boolean
    } = {}
  ): Promise<RankedTrend[]> {
    try {
      const {
        maxResults = 20,
        categories = [],
        timeWindow = 24,
        includeGlobal = true
      } = options

      console.log('🚀 CreatorPulse: Starting comprehensive trend detection...')
      console.log(`📊 Config: ${maxResults} results, ${timeWindow}h window, global: ${includeGlobal}`)

      // Collect user trends
      const userRankedTrends: RankedTrend[] = []
      
      if (sources.length > 0) {
        console.log(`👤 Processing ${sources.length} user sources...`)
        
        for (const source of sources) {
          try {
            console.log(`Processing source:`, { type: source.type, content: source.content, url: source.url })
            
            if ((source.type === 'x' || source.type === 'twitter') && source.content) {
              const username = source.content.replace('@', '')
              console.log(`📱 Fetching X content for @${username}`)
              
              const tweets = await getUserTweets(username, 10)
              if (tweets.length > 0) {
                const xTrends = convertXToRankedTrends(tweets)
                userRankedTrends.push(...xTrends)
                console.log(`✅ Added ${xTrends.length} X trends from @${username}`)
              }
            } else if (source.type === 'youtube' && source.content) {
              console.log(`📺 Fetching YouTube content for ${source.content}`)
              
              const channelId = await getChannelIdFromUsername(source.content)
              if (channelId) {
                const videos = await getChannelVideos(channelId, 10)
                if (videos.length > 0) {
                  const ytTrends = convertYouTubeToRankedTrends(videos)
                  userRankedTrends.push(...ytTrends)
                  console.log(`✅ Added ${ytTrends.length} YouTube trends`)
                }
              }
            } else if (source.url) {
              // Handle URL-based sources with Firecrawl
              console.log(`🌐 Crawling URL: ${source.url}`)
              const crawlResults = await batchCrawlUrls([source.url], {
                limit: 5,
                maxAge: 3600000,
                concurrency: 1
              })
              
              if (crawlResults.length > 0) {
                const newsTrends = convertNewsToRankedTrends(crawlResults)
                userRankedTrends.push(...newsTrends)
                console.log(`✅ Added ${newsTrends.length} news trends`)
              }
            }
          } catch (error) {
            console.error(`Error processing source:`, error)
          }
        }
      }

      // Collect global trends
      const globalRankedTrends: RankedTrend[] = []
      
      if (includeGlobal) {
        console.log('🌍 Fetching global trending content...')
        
        try {
          const globalTrends = await fetchGlobalTrends()
          
          // Convert global X trends
          if (globalTrends.xTrending.length > 0) {
            // Search for tweets on trending topics
            const topTrend = globalTrends.xTrending[0]
            const trendTweets = await searchTweets(topTrend, 15)
            const globalXTrends = convertXToRankedTrends(trendTweets, 'x')
            globalRankedTrends.push(...globalXTrends)
          }
          
          // Convert global YouTube trends
          if (globalTrends.youtubeTrending.length > 0) {
            const globalYTTrends = convertYouTubeToRankedTrends(globalTrends.youtubeTrending)
            globalRankedTrends.push(...globalYTTrends)
          }
          
          // Convert global news trends
          if (globalTrends.newsTrending.length > 0) {
            const globalNewsTrends = convertNewsToRankedTrends(globalTrends.newsTrending)
            globalRankedTrends.push(...globalNewsTrends)
          }
          
          console.log(`✅ Collected ${globalRankedTrends.length} global trends`)
        } catch (error) {
          console.error('Error fetching global trends:', error)
        }
      }

      // Combine and rank all trends
      const rankedTrends = combineAndRankTrends(userRankedTrends, globalRankedTrends, {
        maxResults,
        minScore: 0.1,
        categories,
        timeWindow
      })

      console.log(`🎯 CreatorPulse: Delivered ${rankedTrends.length} ranked trends`)
      console.log(`📈 Top trend: ${rankedTrends[0]?.title} (score: ${rankedTrends[0]?.score.overall.toFixed(3)})`)

      return rankedTrends

    } catch (error) {
      console.error('Error in getRankedTrends:', error)
      return []
    }
  }

  /**
   * Clean URL for display
   */
  private cleanUrl(url: string): string {
    try {
      const parsed = new URL(url)
      return `${parsed.hostname}${parsed.pathname}`
    } catch {
      return url
    }
  }


}

// Export singleton instance
export const trendAgent = new TrendDetectionAgent() 