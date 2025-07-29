-- Quick Fix: Sync existing auth.users to public.users
-- Run this in your Supabase SQL Editor to fix the foreign key constraint issue

-- 1. First, sync existing auth.users to public.users
INSERT INTO public.users (id, email, created_at, updated_at)
SELECT id, email, created_at, updated_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = EXCLUDED.updated_at;

-- 2. Update the trigger function to handle both INSERT and UPDATE
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

-- 3. Drop and recreate the trigger to handle both INSERT and UPDATE
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Verify the fix - check if user exists
SELECT 'User sync completed successfully' as status, 
       COUNT(*) as users_synced 
FROM public.users; 