# CreatorPulse 🚀

**AI-Powered Trend Detection Platform**

CreatorPulse is a cutting-edge web application that helps content creators, marketers, and businesses discover trending topics in real-time. Using advanced AI and web crawling technology, it analyzes multiple content sources to identify emerging trends and provide actionable insights.

## ✨ Features

### 🔍 **Smart Trend Detection**
- **Multi-Source Analysis**: Crawls X (Twitter), YouTube, news websites, and RSS feeds
- **AI-Powered Ranking**: Uses machine learning to score and rank trends by relevance
- **Real-Time Updates**: Continuously monitors sources for fresh content
- **Category Filtering**: Organizes trends by technology, business, social, entertainment, and more

### 🔗 **Source Management**
- **Flexible Source Types**: Support for X accounts, hashtags, YouTube channels, and custom URLs
- **Easy Integration**: Simple interface to add and manage content sources
- **Source Analytics**: Track performance and engagement metrics

### 🎯 **Advanced Analytics**
- **Trend Scoring**: Multi-factor scoring based on recency, popularity, and engagement
- **Confidence Metrics**: AI-generated confidence scores for trend predictions
- **Historical Tracking**: Monitor trend evolution over time
- **Visual Insights**: Beautiful charts and data visualizations

### 🔐 **Secure Authentication**
- **Supabase Integration**: Robust user authentication and data management
- **OAuth Support**: Secure login with multiple providers
- **User Profiles**: Personalized dashboards and settings

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Modern, utility-first styling
- **Framer Motion**: Smooth animations and interactions
- **Recharts**: Beautiful data visualizations

### **Backend**
- **Supabase**: Database, authentication, and real-time features
- **Firecrawl**: Advanced web crawling and content extraction
- **OpenAI API**: AI-powered trend analysis and ranking
- **YouTube Data API**: YouTube content analysis
- **X (Twitter) API**: Social media trend detection

### **Infrastructure**
- **Vercel**: Hosting and deployment
- **PostgreSQL**: Reliable database storage
- **Edge Functions**: Serverless API endpoints

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key
- Firecrawl API key (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AkhilKumar-Git/CreatorPulse.git
   cd CreatorPulse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   
   # Firecrawl (optional)
   FIRECRAWL_API_KEY=your_firecrawl_api_key
   
   # X (Twitter) API (optional)
   X_BEARER_TOKEN=your_x_bearer_token
   
   # YouTube API (optional)
   YOUTUBE_API_KEY=your_youtube_api_key
   
   # App URLs
   NEXTAUTH_URL=http://localhost:3000
   CRON_SECRET_KEY=your_cron_secret
   ```

4. **Set up the database**
   ```bash
   # Run the Supabase setup script
   psql -h your_supabase_host -U your_username -d your_database -f supabase-setup.sql
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

### Core Tables

#### `users`
- User authentication and profile data
- OAuth integration with Supabase Auth

#### `sources`
- Content sources (X accounts, YouTube channels, websites)
- Source metadata and configuration

#### `trends`
- Detected trends with metadata
- AI-generated insights and scoring

#### `trend_rankings`
- Ranked trends with confidence scores
- Category classification and relevance metrics

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/callback` - OAuth callback

### Sources
- `GET /api/sources/connect` - Get user sources
- `POST /api/sources/connect` - Add new source
- `DELETE /api/sources/connect` - Remove source

### Trends
- `POST /api/trends/detect` - Detect trends from sources
- `GET /api/trends/detect` - Get recent trends

### Cron Jobs
- `POST /api/cron/trends` - Automated trend detection

## 🎨 UI Components

### Core Components
- **TrendCard**: Displays individual trends with metadata
- **AvatarCircles**: Visual representation of source diversity
- **Chart**: Interactive data visualizations
- **MovingBorder**: Animated UI elements

### Layout Components
- **Card**: Consistent content containers
- **Button**: Interactive elements with variants
- **LoadingSpinner**: Loading states and feedback

## 🤖 AI Features

### Trend Detection Algorithm
1. **Content Crawling**: Extract content from multiple sources
2. **Text Analysis**: Process and clean content using NLP
3. **Pattern Recognition**: Identify trending topics and hashtags
4. **Scoring System**: Multi-factor ranking based on:
   - Recency (time-based scoring)
   - Popularity (engagement metrics)
   - Relevance (AI-powered analysis)
   - Source credibility

### Machine Learning Pipeline
- **Content Classification**: Categorize trends by topic
- **Confidence Scoring**: AI-generated confidence metrics
- **Trend Prediction**: Forecast trend evolution
- **Personalization**: User-specific trend recommendations

## 📈 Performance Optimization

### Frontend
- **Code Splitting**: Lazy loading of components
- **Image Optimization**: Next.js automatic image optimization
- **Caching**: Strategic caching of API responses
- **Bundle Analysis**: Optimized JavaScript bundles

### Backend
- **Database Indexing**: Optimized queries and indexes
- **API Rate Limiting**: Prevent abuse and ensure stability
- **Caching Strategy**: Redis-like caching for frequent requests
- **Background Jobs**: Asynchronous trend processing

## 🔒 Security Features

### Authentication & Authorization
- **JWT Tokens**: Secure session management
- **OAuth 2.0**: Industry-standard authentication
- **Role-Based Access**: User permission management
- **API Security**: Rate limiting and input validation

### Data Protection
- **Encryption**: Data encryption at rest and in transit
- **Privacy Compliance**: GDPR and CCPA compliance
- **Secure APIs**: Protected endpoints with authentication
- **Input Sanitization**: Prevent injection attacks

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main branch

### Environment Setup
```bash
# Production environment variables
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
# ... other production variables
```

## 📝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

- **Documentation**: [docs.creatorpulse.com](https://docs.creatorpulse.com)
- **Issues**: [GitHub Issues](https://github.com/AkhilKumar-Git/CreatorPulse/issues)
- **Discussions**: [GitHub Discussions](https://github.com/AkhilKumar-Git/CreatorPulse/discussions)
- **Email**: support@creatorpulse.com

## 🙏 Acknowledgments

- **Supabase** for the amazing backend platform
- **OpenAI** for powerful AI capabilities
- **Firecrawl** for advanced web crawling
- **Vercel** for seamless deployment
- **Next.js** team for the excellent framework

---

**Built with ❤️ by the CreatorPulse Team**

*Never start from a blank page again.*
