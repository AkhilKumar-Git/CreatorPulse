// Server-side Firecrawl MCP integration using v1 API
// Enhanced with crawling, caching, and batch operations

export interface CrawlResult {
  url: string
  title?: string
  content: string
  metadata?: Record<string, unknown>
  timestamp: string
}

export interface CrawlOptions {
  includeTags?: string[]
  excludeTags?: string[]
  maxPages?: number
  waitFor?: number
}

interface FirecrawlDocument {
  markdown?: string
  html?: string
  metadata?: {
    title?: string
    description?: string
    sourceURL?: string
    url?: string
    statusCode?: number
    keywords?: string
    language?: string
  }
}

interface FirecrawlCrawlResponse {
  success: boolean
  status?: string
  data?: FirecrawlDocument[]
  error?: string
  id?: string
  url?: string
  completed?: number
  total?: number
  creditsUsed?: number
}

interface FirecrawlScrapeResponse {
  success: boolean
  data?: FirecrawlDocument
  error?: string
}

/**
 * Enhanced server-side crawling using Firecrawl v1 API
 * Features: Multi-page crawling, caching for speed, structured extraction
 */
export async function crawlWithFirecrawlMCP(url: string, options: {
  limit?: number
  formats?: string[]
  onlyMainContent?: boolean
  maxAge?: number
  useCrawl?: boolean
} = {}): Promise<CrawlResult[]> {
  try {
    const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || ''
    const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev'

    if (!FIRECRAWL_API_KEY || FIRECRAWL_API_KEY.trim() === '') {
      throw new Error('FIRECRAWL_API_KEY is required. Please add it to your .env.local file. Get your key at: https://firecrawl.dev')
    }

    const {
      limit = 10,
      formats = ['markdown'],
      onlyMainContent = true,
      maxAge = 3600000, // 1 hour cache for 500% faster crawling
      useCrawl = true
    } = options

    console.log(`Crawling URL with Firecrawl v1: ${url}`)

    // Check if URL is a social media site that might block scraping
    const isSocialMedia = url.includes('twitter.com') || url.includes('x.com') || 
                         url.includes('youtube.com') || url.includes('instagram.com') ||
                         url.includes('facebook.com') || url.includes('linkedin.com')

    if (isSocialMedia) {
      console.warn(`⚠️  Social media URL detected: ${url}. These sites often block automated scraping.`)
      console.warn('💡 Consider using their official APIs instead for better results.')
      
      // For social media, return mock data instead of trying to scrape
      // This prevents 403 errors and provides a better user experience
      return [{
        url,
        title: `Social Media Content: ${url.split('/').pop() || 'Content'}`,
        content: `This is a social media source (${url}). Due to platform restrictions, we cannot directly scrape this content. To get real-time data from this source, consider:
        
1. Using the platform's official API (Twitter API, YouTube Data API, etc.)
2. Setting up webhooks for real-time updates
3. Using RSS feeds if available
4. Manual content curation

For now, this source will be skipped in trend detection to avoid errors.`,
        metadata: {
          description: 'Social media source - requires API integration',
          keywords: 'social media, api required, platform restricted',
          sourceType: 'social_media',
          requiresApi: true
        },
        timestamp: new Date().toISOString()
      }]
    }

    // Use crawl endpoint for comprehensive site crawling
    if (useCrawl) {
      const crawlResponse = await fetch(`${FIRECRAWL_BASE_URL}/v1/crawl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
        },
        body: JSON.stringify({
          url,
          limit,
          scrapeOptions: {
            formats,
            onlyMainContent,
            maxAge
          }
        })
      })

      if (!crawlResponse.ok) {
        console.warn(`Crawl failed, falling back to scrape: ${crawlResponse.status}`)
        return await scrapeWithFirecrawl(url, { formats, onlyMainContent, maxAge })
      }

      const crawlData: FirecrawlCrawlResponse = await crawlResponse.json()
      
      if (!crawlData.success) {
        console.warn(`Crawl unsuccessful, falling back to scrape: ${crawlData.error}`)
        return await scrapeWithFirecrawl(url, { formats, onlyMainContent, maxAge })
      }

      // Handle async crawl
      if (crawlData.id && !crawlData.data) {
        console.log(`Async crawl started with ID: ${crawlData.id}`)
        return await checkCrawlStatus(crawlData.id, FIRECRAWL_API_KEY)
      }

      // Handle sync crawl with immediate data
      if (crawlData.data) {
        console.log(`Crawl completed with ${crawlData.data.length} pages`)
        return crawlData.data.map(doc => ({
          url: doc.metadata?.sourceURL || doc.metadata?.url || url,
          title: doc.metadata?.title || 'Untitled',
          content: doc.markdown || '',
          metadata: {
            description: doc.metadata?.description,
            keywords: doc.metadata?.keywords,
            ...doc.metadata
          },
          timestamp: new Date().toISOString()
        }))
      }
    }

    // Fallback to single page scrape
    return await scrapeWithFirecrawl(url, { formats, onlyMainContent, maxAge })

  } catch (error) {
    console.error('Error crawling with Firecrawl MCP:', url, error)
    // Return empty array instead of throwing to allow trend detection to continue
    return []
  }
}

/**
 * Check crawl status for async operations
 */
async function checkCrawlStatus(crawlId: string, apiKey: string): Promise<CrawlResult[]> {
  try {
    let attempts = 0
    const maxAttempts = 30 // 5 minutes max wait
    const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev'

    while (attempts < maxAttempts) {
      console.log(`Checking crawl status (attempt ${attempts + 1}/${maxAttempts})`)
      
      const statusResponse = await fetch(`${FIRECRAWL_BASE_URL}/v1/crawl/${crawlId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        }
      })

      if (!statusResponse.ok) {
        throw new Error(`Status check failed: ${statusResponse.status}`)
      }

      const statusData: FirecrawlCrawlResponse = await statusResponse.json()
      console.log(`Crawl status: ${statusData.status}, completed: ${statusData.completed}/${statusData.total}`)

      if (statusData.status === 'completed' && statusData.data) {
        console.log(`Crawl completed successfully with ${statusData.data.length} pages`)
        return statusData.data.map(doc => ({
          url: doc.metadata?.sourceURL || doc.metadata?.url || '',
          title: doc.metadata?.title || 'Untitled',
          content: doc.markdown || '',
          metadata: {
            description: doc.metadata?.description,
            keywords: doc.metadata?.keywords,
            ...doc.metadata
          },
          timestamp: new Date().toISOString()
        }))
      }

      if (statusData.status === 'failed') {
        throw new Error(`Crawl failed: ${statusData.error}`)
      }

      // Wait 10 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 10000))
      attempts++
    }

    throw new Error('Crawl timed out after 5 minutes')
  } catch (error) {
    console.error('Error checking crawl status:', error)
    return []
  }
}

/**
 * Single page scrape fallback
 */
async function scrapeWithFirecrawl(url: string, options: {
  formats?: string[]
  onlyMainContent?: boolean
  maxAge?: number
  mobile?: boolean
  waitFor?: number
} = {}): Promise<CrawlResult[]> {
  try {
    const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || ''
    const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev'

    console.log(`Scraping single URL: ${url}`)
    
    const response = await fetch(`${FIRECRAWL_BASE_URL}/v1/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify({
        url,
        formats: options.formats || ['markdown'],
        onlyMainContent: options.onlyMainContent !== false,
        maxAge: options.maxAge || 3600000,
        mobile: options.mobile || false,
        waitFor: options.waitFor || 3000
      })
    })

    if (!response.ok) {
      const errorMessage = `Firecrawl scrape error: ${response.status} ${response.statusText}`
      
      // Provide specific guidance for common errors
      if (response.status === 403) {
        console.warn(`🚫 Access forbidden (403) for ${url}. This site may block automated access.`)
        console.warn('💡 Consider using their official API or RSS feed instead.')
        return [{
          url,
          title: `Access Restricted: ${url.split('/').pop() || 'Content'}`,
          content: `This source (${url}) is currently blocking automated access. This is common with social media platforms and some news sites. To access this content, you would need to:
          
1. Use the site's official API
2. Set up RSS feeds if available
3. Use manual content curation
4. Contact the site owner for permission

This source will be skipped in trend analysis.`,
          metadata: {
            description: 'Access restricted - requires API or manual access',
            keywords: 'access restricted, api required, manual access needed',
            errorCode: 403,
            errorType: 'access_forbidden'
          },
          timestamp: new Date().toISOString()
        }]
      }
      
      if (response.status === 429) {
        console.warn(`⏰ Rate limit exceeded (429) for ${url}. Too many requests.`)
        return [{
          url,
          title: `Rate Limited: ${url.split('/').pop() || 'Content'}`,
          content: `Rate limit exceeded for ${url}. Please wait a moment before trying again.`,
          metadata: {
            description: 'Rate limit exceeded',
            keywords: 'rate limit, too many requests',
            errorCode: 429,
            errorType: 'rate_limited'
          },
          timestamp: new Date().toISOString()
        }]
      }
      
      throw new Error(errorMessage)
    }

    const data: FirecrawlScrapeResponse = await response.json()
    
    if (!data.success || !data.data) {
      throw new Error(`Failed to scrape ${url}: ${data.error || 'No data returned'}`)
    }

    return [{
      url: data.data.metadata?.sourceURL || url,
      title: data.data.metadata?.title || 'Untitled',
      content: data.data.markdown || '',
      metadata: {
        description: data.data.metadata?.description,
        keywords: data.data.metadata?.keywords,
        ...data.data.metadata
      },
      timestamp: new Date().toISOString()
    }]

  } catch (error) {
    console.error('Error scraping with Firecrawl:', error)
    return []
  }
}

/**
 * Crawl trending topics from news, blogs, and documentation sites
 */
export async function crawlTrendingSites(): Promise<CrawlResult[]> {
  const trendingSites = [
    // News websites
    'https://techcrunch.com',
    'https://www.theverge.com',
    'https://www.wired.com',
    'https://arstechnica.com',
    'https://www.engadget.com',
    
    // Tech blogs and platforms
    'https://medium.com/topic/technology',
    'https://substack.com/discover/technology',
    'https://www.producthunt.com',
    'https://news.ycombinator.com',
    'https://dev.to',
    
    // Documentation and technical blogs
    'https://github.blog',
    'https://stackoverflow.blog',
    'https://css-tricks.com',
    'https://smashingmagazine.com',
    'https://alistapart.com'
  ]

  console.log('Starting trending sites crawl...')
  const results: CrawlResult[] = []

  // Use Promise.allSettled for parallel crawling with limit
  const crawlPromises = trendingSites.slice(0, 10).map(async (site) => { // Limit to 10 sites
    try {
      const siteResults = await crawlWithFirecrawlMCP(site, {
        limit: 2, // Reduced from 5 to 2 pages per site for faster results
        maxAge: 1800000, // 30 minutes cache for trending content
        useCrawl: true
      })
      return siteResults
    } catch (error) {
      console.error(`Failed to crawl ${site}:`, error)
      return []
    }
  })

  const crawlResults = await Promise.allSettled(crawlPromises)
  
  // Flatten results and limit to 20 total articles
  crawlResults.forEach((result) => {
    if (result.status === 'fulfilled' && results.length < 20) {
      const articlesToAdd = result.value.slice(0, 20 - results.length)
      results.push(...articlesToAdd)
    }
  })

  console.log(`Crawled ${results.length} pages from trending sites (limited to 20 for performance)`)
  return results
}

/**
 * Enhanced topic search with batch crawling
 */
export async function searchAndCrawlTrends(searchTerms: string[]): Promise<CrawlResult[]> {
  const results: CrawlResult[] = []
  console.log(`Searching for trends: ${searchTerms.join(', ')}`)

  for (const term of searchTerms) {
    try {
      // Focus on reliable trending sources
      const searchSites = [
        `https://twitter.com/search?q=${encodeURIComponent(term)}&f=live`,
        `https://www.reddit.com/search/?q=${encodeURIComponent(term)}&sort=hot`,
        `https://news.ycombinator.com/item?id=${term}` // If term is a HN ID
      ]

      // Crawl each search result
      for (const searchUrl of searchSites) {
        try {
          const searchResults = await crawlWithFirecrawlMCP(searchUrl, {
            limit: 3,
            maxAge: 900000, // 15 minutes cache for search results
            useCrawl: false // Use scrape for search pages
          })
          results.push(...searchResults)
        } catch (error) {
          console.error(`Failed to crawl search URL ${searchUrl}:`, error)
        }
      }
    } catch (error) {
      console.error(`Failed to search for term ${term}:`, error)
    }
  }

  console.log(`Search crawl completed with ${results.length} results`)
  return results
}

/**
 * Enhanced trending topic extraction with NLP-style analysis
 */
export function extractTrendingTopics(content: string): string[] {
  const trends: string[] = []
  
  // Extract hashtags
  const hashtags = content.match(/#[\w\d_]+/g) || []
  trends.push(...hashtags.map(tag => tag.toLowerCase()))
  
  // Extract @mentions (potential trending accounts)
  const mentions = content.match(/@[\w\d_]+/g) || []
  trends.push(...mentions.slice(0, 5).map(mention => mention.toLowerCase()))
  
  // Enhanced trending keywords with context
  const trendingKeywords = [
    // AI/Tech
    'artificial intelligence', 'machine learning', 'chatgpt', 'openai', 'claude',
    'generative ai', 'llm', 'transformer', 'neural network',
    
    // Web3/Crypto
    'bitcoin', 'ethereum', 'defi', 'nft', 'web3', 'blockchain', 'crypto',
    'solana', 'cardano', 'polygon',
    
    // Business/Startup
    'funding round', 'series a', 'ipo', 'acquisition', 'merger', 'valuation',
    'startup', 'unicorn', 'yc', 'y combinator',
    
    // Technology
    'react', 'next.js', 'typescript', 'python', 'rust', 'go', 'kubernetes',
    'docker', 'aws', 'vercel', 'supabase', 'firebase',
    
    // Trends
    'viral', 'trending', 'breaking', 'announcement', 'launch', 'release'
  ]
  
  // Score keywords by frequency and context
  const keywordScores: Record<string, number> = {}
  
  for (const keyword of trendingKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
    const matches = content.match(regex) || []
    if (matches.length > 0) {
      keywordScores[keyword] = matches.length
      trends.push(keyword)
    }
  }
  
  // Extract potential trending phrases (2-3 words)
  const phrases = content.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g) || []
  trends.push(...phrases.slice(0, 10).map(phrase => phrase.toLowerCase()))
  
  // Remove duplicates and return top trends sorted by relevance
  const uniqueTrends = [...new Set(trends)]
  
  // Prioritize hashtags and scored keywords
  return uniqueTrends
    .sort((a, b) => {
      const scoreA = keywordScores[a] || (a.startsWith('#') ? 2 : 1)
      const scoreB = keywordScores[b] || (b.startsWith('#') ? 2 : 1)
      return scoreB - scoreA
    })
    .slice(0, 15)
}

/**
 * Batch crawl multiple URLs with rate limiting
 */
export async function batchCrawlUrls(urls: string[], options: {
  limit?: number
  maxAge?: number
  concurrency?: number
} = {}): Promise<CrawlResult[]> {
  const { limit = 5, maxAge = 3600000, concurrency = 3 } = options
  const results: CrawlResult[] = []
  
  console.log(`Batch crawling ${urls.length} URLs with concurrency ${concurrency}`)
  
  // Process URLs in batches to respect rate limits
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency)
    
    const batchPromises = batch.map(url => 
      crawlWithFirecrawlMCP(url, {
        limit,
        maxAge,
        useCrawl: false // Use scrape for individual URLs
      })
    )
    
    const batchResults = await Promise.allSettled(batchPromises)
    
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.push(...result.value)
      }
    })
    
    // Rate limiting: wait between batches
    if (i + concurrency < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  console.log(`Batch crawl completed: ${results.length} total results`)
  return results
} 