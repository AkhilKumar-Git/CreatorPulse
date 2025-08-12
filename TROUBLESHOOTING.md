# 🔧 CreatorPulse Troubleshooting Guide

This guide helps you resolve common issues when setting up and using CreatorPulse.

## 🚨 Common Errors & Solutions

### 1. "Failed to save source" Error

**Error Message:**
```
Error: Failed to add source: "Failed to save source"
```

**Root Cause:**
This error typically occurs when there's a mismatch between the source types allowed in the frontend and the database constraints.

**Solution:**
1. **Run the database migration script** in your Supabase SQL Editor:
   ```sql
   -- Run this in Supabase SQL Editor
   ALTER TABLE public.sources DROP CONSTRAINT IF EXISTS sources_type_check;
   ALTER TABLE public.sources ADD CONSTRAINT sources_type_check 
   CHECK (type IN ('x', 'x_hashtag', 'twitter', 'youtube', 'rss', 'hashtag', 'url'));
   ```

2. **Or run the complete setup script** (`supabase-setup.sql`) if you haven't set up the database yet.

3. **Verify your environment variables** are correctly set in `.env.local`.

**Prevention:**
- Always run the database setup script before using the application
- Ensure your Supabase project has the correct schema

### 2. "Sources table not found" Error

**Error Message:**
```
Database not set up. Please run the database setup script first.
```

**Solution:**
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase-setup.sql`
4. Run the script
5. Refresh your application

### 3. Authentication Errors

**Error Message:**
```
User not authenticated, skipping sources load
```

**Solution:**
1. Check if you're logged in
2. Verify your Supabase environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
3. Clear browser cookies and log in again
4. Check browser console for CORS errors

### 4. API Rate Limiting

**Error Message:**
```
Rate limit exceeded (429) for [URL]
```

**Solution:**
1. Wait a few minutes before trying again
2. Check your API key limits
3. Reduce the frequency of requests
4. Consider upgrading your API plan if needed

### 5. Database Constraint Violations

**Error Message:**
```
Invalid source type. Please check the type field.
```

**Solution:**
1. Ensure you're using one of these source types:
   - `x` (X/Twitter account)
   - `x_hashtag` (X hashtag)
   - `twitter` (legacy Twitter)
   - `youtube` (YouTube channel)
   - `rss` (RSS feed)
   - `hashtag` (general hashtag)
   - `url` (website)

2. Check the database schema matches the application requirements

## 🛠️ Database Setup Issues

### Missing Tables
If you see errors about missing tables:

1. **Run the complete setup script:**
   ```bash
   # In Supabase SQL Editor, run:
   -- Copy contents of supabase-setup.sql
   ```

2. **Verify table creation:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

### Permission Errors
If you get permission errors:

1. **Check RLS policies:**
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
   FROM pg_policies 
   WHERE schemaname = 'public';
   ```

2. **Verify user authentication:**
   ```sql
   SELECT auth.uid() as current_user_id;
   ```

## 🔍 Debugging Steps

### 1. Check Browser Console
Open Developer Tools (F12) and look for:
- JavaScript errors
- Network request failures
- Authentication errors

### 2. Check Server Logs
Look for errors in:
- Supabase logs
- Vercel deployment logs
- API route logs

### 3. Verify Environment Variables
Ensure all required variables are set:
```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional but recommended
OPENAI_API_KEY=your_openai_api_key
FIRECRAWL_API_KEY=your_firecrawl_api_key
X_BEARER_TOKEN=your_x_bearer_token
YOUTUBE_API_KEY=your_youtube_api_key
```

### 4. Test Database Connection
```sql
-- Test basic connectivity
SELECT version();

-- Test user table access
SELECT COUNT(*) FROM public.users;

-- Test sources table
SELECT COUNT(*) FROM public.sources;
```

## 🚀 Performance Issues

### Slow Trend Detection
1. **Reduce source limits** in the API calls
2. **Enable caching** with appropriate `maxAge` values
3. **Use batch operations** for multiple sources
4. **Monitor API rate limits**

### Large Bundle Size
1. **Enable code splitting** in Next.js
2. **Use dynamic imports** for heavy components
3. **Optimize images** and assets
4. **Enable compression** in your hosting provider

## 🔐 Security Issues

### Authentication Failures
1. **Check JWT token expiration**
2. **Verify Supabase RLS policies**
3. **Check CORS configuration**
4. **Validate API key permissions**

### Data Access Issues
1. **Verify user ownership** of data
2. **Check RLS policy enforcement**
3. **Validate input sanitization**
4. **Monitor for unauthorized access**

## 📱 Mobile/Responsive Issues

### UI Layout Problems
1. **Check Tailwind CSS breakpoints**
2. **Verify responsive design classes**
3. **Test on different screen sizes**
4. **Check mobile browser compatibility**

### Touch Interactions
1. **Verify button sizes** (minimum 44px)
2. **Check touch target areas**
3. **Test gesture support**
4. **Validate mobile navigation**

## 🌐 Network Issues

### CORS Errors
1. **Check Supabase CORS settings**
2. **Verify domain whitelist**
3. **Check API endpoint configuration**
4. **Validate request headers**

### API Timeouts
1. **Increase timeout values**
2. **Implement retry logic**
3. **Use connection pooling**
4. **Monitor network latency**

## 📊 Monitoring & Logging

### Enable Debug Logging
```typescript
// In your environment variables
DEBUG=true
LOG_LEVEL=debug
```

### Monitor Key Metrics
- API response times
- Database query performance
- User authentication success rate
- Error frequency by type

### Set Up Alerts
- Error rate thresholds
- Performance degradation
- Authentication failures
- Database connection issues

## 🆘 Getting Help

### 1. Check This Guide First
Most common issues are covered here.

### 2. Review Error Logs
Look for specific error codes and messages.

### 3. Check GitHub Issues
Search for similar problems in the repository.

### 4. Create New Issue
If you can't find a solution, create a new issue with:
- Error message and stack trace
- Steps to reproduce
- Environment details
- Expected vs actual behavior

### 5. Community Support
- GitHub Discussions
- Stack Overflow (tag: creatorpulse)
- Discord community (if available)

## 🔄 Common Workarounds

### Temporary Source Type Issues
If you can't immediately fix database constraints:
1. Use supported source types only
2. Wait for database migration
3. Use the migration script provided

### API Rate Limiting
1. Implement exponential backoff
2. Use caching strategies
3. Batch multiple requests
4. Respect rate limit headers

### Authentication Issues
1. Clear browser storage
2. Check token expiration
3. Verify Supabase configuration
4. Test with fresh browser session

---

**Remember:** Most issues can be resolved by following the setup guide and running the database scripts. If you continue to have problems, check the logs and create a detailed issue report.
