-- CreatorPulse Database Setup Script
-- Run this in your Supabase SQL Editor

-- NOTE: Remove the following line if you get permission errors
-- ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create users table (extends auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    persona_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create styles table for user writing style embeddings
CREATE TABLE public.styles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    embeddings_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create drafts table for content drafts
CREATE TABLE public.drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sources table for content sources
CREATE TABLE public.sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('x', 'x_hashtag', 'twitter', 'youtube', 'rss', 'hashtag', 'url')) NOT NULL,
    url TEXT,
    content TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trends table for tracking content trends
CREATE TABLE public.trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    topics_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_styles_user_id ON public.styles(user_id);
CREATE INDEX idx_drafts_user_id ON public.drafts(user_id);
CREATE INDEX idx_drafts_status ON public.drafts(status);
CREATE INDEX idx_sources_user_id ON public.sources(user_id);
CREATE INDEX idx_sources_type ON public.sources(type);
CREATE INDEX idx_trends_date ON public.trends(date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_styles_updated_at 
    BEFORE UPDATE ON public.styles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drafts_updated_at 
    BEFORE UPDATE ON public.drafts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sources_updated_at 
    BEFORE UPDATE ON public.sources 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trends ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users table policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Styles table policies
CREATE POLICY "Users can view own styles" ON public.styles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own styles" ON public.styles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own styles" ON public.styles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own styles" ON public.styles
    FOR DELETE USING (auth.uid() = user_id);

-- Drafts table policies
CREATE POLICY "Users can view own drafts" ON public.drafts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own drafts" ON public.drafts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own drafts" ON public.drafts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own drafts" ON public.drafts
    FOR DELETE USING (auth.uid() = user_id);

-- Sources table policies
CREATE POLICY "Users can view own sources" ON public.sources
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sources" ON public.sources
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sources" ON public.sources
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sources" ON public.sources
    FOR DELETE USING (auth.uid() = user_id);

-- Trends table policies (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view trends" ON public.trends
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create a function to handle user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, persona_json, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->'persona', NEW.created_at, NEW.updated_at)
    ON CONFLICT (id) DO UPDATE SET
        email = NEW.email,
        updated_at = NEW.updated_at;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sync existing auth.users to public.users (one-time migration)
INSERT INTO public.users (id, email, created_at, updated_at)
SELECT id, email, created_at, updated_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = EXCLUDED.updated_at;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Create a simple view for user stats (optional)
CREATE VIEW public.user_stats AS
SELECT 
    u.id,
    u.email,
    COUNT(DISTINCT d.id) as draft_count,
    COUNT(DISTINCT s.id) as source_count,
    u.created_at as joined_at
FROM public.users u
LEFT JOIN public.drafts d ON u.id = d.user_id
LEFT JOIN public.sources s ON u.id = s.user_id
GROUP BY u.id, u.email, u.created_at;

-- Grant access to the view
GRANT SELECT ON public.user_stats TO authenticated; 