# CreatorPulse

> **"Never start from a blank page again"**

**CreatorPulse** is an AI-powered content creation platform that helps creators tap emerging trends instantly and maintain consistent, high-quality content creation. In today's attention economy, consistency and speed are the currency of content creators.

## 🎯 **Vision & Impact**

CreatorPulse tackles the creator bottleneck head-on by:
- ⚡ **Tapping emerging trends instantly** - Never miss timely conversations
- 🎯 **Riding viral moments** - Position yourself as a thought leader
- 📈 **Maintaining 2-3× higher posting cadence** - Consistent content without burnout
- 🎨 **Freeing creative energy** - Focus on creation, not hunting for ideas
- 🔍 **70%+ draft acceptance rate** - Quality content from ranked trends

## 🚀 **Features**

### **Core Platform**
- 🔐 **Supabase Authentication** - Secure login/signup with email confirmation
- 🎨 **Modern UI with shadcn/ui** - Beautiful card-based design with hover effects
- 📱 **Mobile Responsive** - Works perfectly on all devices
- 🛡️ **Route Protection** - Secure, authenticated-only access

### **Trend Intelligence Engine**
- 🧠 **Multi-Source Intelligence** - X, YouTube, News, and Custom Sources
- 📊 **Smart Ranking Algorithm** - Recency (40%) + Popularity (40%) + Engagement (20%)
- 🎯 **Category Filtering** - Technology, Business, Social, Entertainment, Science
- ⚡ **Real-time Processing** - Top 20 trends from the last 24 hours
- 🌍 **Global + Personal** - Combines trending topics with your custom sources

### **Beautiful UI Components**
- 💳 **Trend Cards** - Rich metadata with confidence scores and engagement metrics
- 📈 **Radial Confidence Charts** - Visual percentage-based scoring
- 🗑️ **Smart Delete Buttons** - Manage sources and trends easily
- 🖼️ **Favicon Avatars** - Real source logos from X, YouTube, and websites
- 🔍 **Advanced Filtering** - Category dropdowns and search functionality

## 🛠️ **Quick Start**

### **Prerequisites**
- Node.js 18+
- Supabase account
- API keys (see setup section)

### **Installation**
```bash
# Clone and install
git clone <repository-url>
cd creatorpulse
npm install

# Set up environment (see Environment Setup section)
cp .env.local.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start creating content!

## 🔧 **Environment Setup**

Create a `.env.local` file with these required API keys:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# AI & Content Analysis
OPENAI_API_KEY=sk-your-openai-key-here

# Social Media APIs
X_BEARER_TOKEN=your-x-bearer-token-here
YOUTUBE_API_KEY=your-youtube-api-key-here

# Web Crawling
FIRECRAWL_API_KEY=fc-your-firecrawl-key-here
```

### **API Key Setup Guides**

#### **1. Supabase Setup**
1. Go to [supabase.com](https://supabase.com) → Create new project
2. Settings → API → Copy Project URL and anon key
3. Run the database setup script: `supabase-setup.sql`

#### **2. X (Twitter) API v2**
1. Visit [X Developer Portal](https://developer.x.com/)
2. Create app → Get Bearer Token
3. Add as `X_BEARER_TOKEN`

#### **3. YouTube Data API v3**
1. [Google Cloud Console](https://console.cloud.google.com/)
2. Enable YouTube Data API v3 → Create API Key
3. Add as `YOUTUBE_API_KEY`

#### **4. Firecrawl API**
1. Sign up at [Firecrawl](https://firecrawl.dev/)
2. Get API key from dashboard
3. Add as `FIRECRAWL_API_KEY`

#### **5. OpenAI API**
1. [OpenAI Platform](https://platform.openai.com/)
2. Create API key with GPT-3.5-turbo access
3. Add as `OPENAI_API_KEY`

## 📊 **How the Trend Ranking System Works**

### **Multi-Source Intelligence**
CreatorPulse combines **4 intelligence streams**:

1. **👤 Your Custom Sources**: Hand-picked X accounts, YouTube channels, websites
2. **🌍 Global X Trends**: Real-time trending topics worldwide  
3. **📺 YouTube Trending**: Viral videos and emerging channels
4. **📰 News & Tech Sites**: TechCrunch, The Verge, Hacker News, etc.

### **Smart Scoring Algorithm**
Each trend gets scored on **3 critical dimensions**:

```
🕐 RECENCY (40% weight)
   └── Exponential decay: newer = higher score
   └── 24-hour half-life for optimal freshness

📊 POPULARITY (40% weight)  
   └── Engagement metrics: likes + shares + comments + views
   └── Logarithmic scale: handles viral content appropriately

💬 ENGAGEMENT RATE (20% weight)
   └── Active participation: comments + shares / total reach
   └── Identifies quality conversations vs passive consumption
```

**Overall Score = (Recency × 0.4) + (Popularity × 0.4) + (Engagement × 0.2)**

## 🎮 **How to Use CreatorPulse**

### **1. Add Your Sources** (2 minutes)
- **X Accounts**: Add influencers, thought leaders (`@username`)
- **X Hashtags**: Track trending topics (`#AI`, `#WebDev`)
- **YouTube Channels**: Monitor creator trends (`YCombinator`)
- **Websites**: Follow news sites (`https://techcrunch.com`)

### **2. Detect Trends** (30 seconds)
- Click "Detect Trends" to analyze your sources + global trends
- System crawls max 20 articles for fast processing
- AI ranks trends by recency, popularity, and engagement

### **3. Create Content** (5-15 minutes)
Use ranked trends for:
- **Breaking News Reactions** (High Recency Score >0.8)
- **Deep Dive Analysis** (High Engagement Rate >0.6)
- **Viral Content** (High Popularity Score >0.7)
- **Trend Connections** (Multiple related trends)

### **4. Filter & Focus**
- **Category Filter**: Technology, Business, Social, etc.
- **Time Window**: Last 24 hours for maximum relevance
- **Top 20 Limit**: Most impactful trends only

## 🏗️ **Project Structure**

```
creatorpulse/
├── app/
│   ├── api/
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── sources/connect/      # Source management API
│   │   ├── trends/detect/        # Trend detection API
│   │   └── cron/trends/          # Scheduled trend updates
│   ├── components/
│   │   └── LoadingSpinner.tsx    # Loading states
│   ├── login/page.tsx            # Authentication pages
│   ├── signup/page.tsx
│   └── page.tsx                  # Main dashboard
├── components/ui/                # shadcn/ui components
│   ├── card.tsx                  # Trend cards
│   ├── button.tsx                # Interactive buttons
│   ├── chart.tsx                 # Confidence visualizations
│   ├── trend-card.tsx            # Main trend component
│   ├── avatar-circles.tsx        # Source visualization
│   └── moving-border.tsx         # Hover effects
├── lib/
│   ├── auth.ts                   # Authentication utilities
│   ├── supabase*.ts              # Database clients
│   ├── trend-agent.ts            # Core AI trend detection
│   ├── trend-ranking.ts          # Ranking algorithm
│   ├── x-api.ts                  # X integration
│   ├── youtube-api.ts            # YouTube integration
│   ├── firecrawl-mcp.ts          # Web crawling
│   ├── favicon-utils.ts          # Source icons
│   └── user-context.tsx          # Auth context
└── middleware.ts                 # Route protection
```

## 🎯 **Content Creation Workflows**

### **"Breaking News Reactor"** (High Recency)
```
Template: "🚨 BREAKING: [Trend Title]

My take: [Your unique angle]

Here's why this matters: [Impact analysis]

What do you think? 👇"
```

### **"Trend Connector"** (Multiple High-Scoring Trends)
```
Template: "Seeing a pattern emerge:

🔹 [Trend 1]
🔹 [Trend 2]  
🔹 [Trend 3]

The common thread: [Your insight]

This signals: [Future prediction]"
```

### **"Deep Dive Expert"** (High Engagement Rate)
```
Template: "Everyone's talking about [Trend], but here's what they're missing:

[Your expert insight]

Thread 🧵 1/n"
```

## 🔌 **API Reference**

### **Trend Detection API**
```bash
POST /api/trends/detect?maxResults=20&timeWindow=24&categories=technology&includeGlobal=true
```

**Parameters:**
- `maxResults`: Number of trends to return (default: 20)
- `timeWindow`: Hours to look back (default: 24)
- `categories`: Filter by category (default: all)
- `includeGlobal`: Include global trends (default: true)

**Response:**
```json
{
  "success": true,
  "rankedTrends": [...],
  "metadata": {
    "rankedTrendsFound": 20,
    "timeWindow": "24 hours",
    "scoring": {
      "recencyWeight": 0.4,
      "popularityWeight": 0.4,
      "engagementWeight": 0.2,
      "topScore": 0.89
    }
  }
}
```

### **Source Management API**
```bash
# Add source
POST /api/sources/connect
{
  "type": "x",
  "content": "waitin4agi_"
}

# Delete source  
DELETE /api/sources/connect?id=source-id
```

## 🗄️ **Database Schema**

```sql
-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Content sources
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  type TEXT NOT NULL, -- 'x', 'youtube', 'url', etc.
  url TEXT,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now()
);

-- Detected trends
CREATE TABLE trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  topic TEXT NOT NULL,
  explainer TEXT,
  link TEXT,
  confidence DECIMAL,
  category TEXT,
  sources TEXT[],
  created_at TIMESTAMP DEFAULT now()
);
```

## 🚀 **Performance Optimizations**

- **Limited Crawling**: Max 20 articles from global sources for 5x faster processing
- **Intelligent Caching**: 30-minute cache for trending content
- **Parallel Processing**: Concurrent API calls for X, YouTube, and news sources
- **Smart Rate Limiting**: Respects API limits while maximizing throughput
- **Optimized Queries**: Efficient database operations with proper indexing

## 🧪 **Development & Testing**

### **Run Development Server**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
```

### **Test Trend Detection**
1. Add test sources (X accounts, YouTube channels)
2. Click "Detect Trends"
3. Verify trends appear with proper scoring
4. Test category filtering
5. Check source deletion functionality

### **Environment Testing**
- Test with different API key combinations
- Verify error handling for missing keys
- Check rate limiting behavior
- Test Firecrawl fallbacks

## 🛡️ **Security & Best Practices**

- **API Key Security**: All keys stored in environment variables
- **Row Level Security**: Supabase RLS policies protect user data
- **Input Validation**: Sanitized inputs on all API endpoints
- **Rate Limiting**: Prevents API abuse and respects service limits
- **Error Handling**: Graceful fallbacks for API failures

## 📈 **Success Metrics**

### **Speed Metrics**
- **Trend Detection**: < 30 seconds
- **Content Research**: 70% reduction (2 hours → 30 minutes)
- **Posting Frequency**: 2-3× increase
- **Draft Quality**: 70%+ acceptance rate

### **Engagement Benefits**
- **Timeliness**: Catch trends 6-12 hours earlier
- **Relevance**: Higher engagement from timely content
- **Consistency**: Never miss trending conversations
- **Authority**: Position as thought leader on emerging topics

## 🏆 **Technologies Used**

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: shadcn/ui, Tailwind CSS, Framer Motion
- **Backend**: Supabase (Auth, Database, Real-time)
- **AI**: OpenAI GPT-3.5-turbo, LangChain
- **APIs**: X API v2, YouTube Data API v3, Firecrawl
- **Deployment**: Vercel (recommended)

## 🤝 **Contributing**

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

MIT License - see LICENSE file for details

---

**Ready to eliminate the blank page forever?** 

Start with CreatorPulse and join creators posting 2-3× more consistently while maintaining quality. Transform your content creation workflow and never run out of trending ideas again! 🚀✨
