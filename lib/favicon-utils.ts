/**
 * Get favicon URL for different source types
 */
export function getFaviconUrl(source: {
  type: string
  url?: string
  content?: string
}): string {
  // Default fallback favicons
  const defaultFavicons = {
    x: 'https://abs.twimg.com/favicons/twitter.2.ico',
    twitter: 'https://abs.twimg.com/favicons/twitter.2.ico',
    x_hashtag: 'https://abs.twimg.com/favicons/twitter.2.ico',
    hashtag: 'https://abs.twimg.com/favicons/twitter.2.ico',
    youtube: 'https://www.youtube.com/favicon.ico',
    rss: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/rss.svg',
    url: 'https://www.google.com/favicon.ico'
  }

  // If we have a URL, try to get its favicon
  if (source.url) {
    try {
      const domain = new URL(source.url).hostname
      
      // Special cases for known domains
      if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
        return 'https://www.youtube.com/favicon.ico'
      }
      if (domain.includes('twitter.com') || domain.includes('x.com')) {
        return 'https://abs.twimg.com/favicons/twitter.2.ico'
      }
      if (domain.includes('github.com')) {
        return 'https://github.com/favicon.ico'
      }
      if (domain.includes('medium.com')) {
        return 'https://medium.com/favicon.ico'
      }
      if (domain.includes('substack.com')) {
        return 'https://substack.com/favicon.ico'
      }
      if (domain.includes('techcrunch.com')) {
        return 'https://techcrunch.com/favicon.ico'
      }
      if (domain.includes('theverge.com')) {
        return 'https://www.theverge.com/favicon.ico'
      }
      
      // Generic favicon URL for other domains
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
    } catch {
      // If URL parsing fails, use type-based default
    }
  }

  // YouTube channel handling
  if (source.type === 'youtube' && source.content) {
    return 'https://www.youtube.com/favicon.ico'
  }

  // X/Twitter handling
  if ((source.type === 'x' || source.type === 'twitter' || source.type === 'x_hashtag') && source.content) {
    return 'https://abs.twimg.com/favicons/twitter.2.ico'
  }

  // Return default based on type
  return defaultFavicons[source.type as keyof typeof defaultFavicons] || defaultFavicons.url
}

/**
 * Get display name for source
 */
export function getSourceDisplayName(source: {
  type: string
  url?: string
  content?: string
}): string {
  if (source.content) {
    return source.content.replace('@', '').substring(0, 15)
  }
  
  if (source.url) {
    try {
      const domain = new URL(source.url).hostname.replace('www.', '')
      return domain.substring(0, 15)
    } catch {
      return source.type
    }
  }
  
  return source.type
} 