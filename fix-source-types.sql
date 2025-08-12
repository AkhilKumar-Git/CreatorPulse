-- Migration script to fix source types constraint
-- Run this in your Supabase SQL Editor if you already have the database set up

-- Drop the existing constraint
ALTER TABLE public.sources DROP CONSTRAINT IF EXISTS sources_type_check;

-- Add the new constraint with updated types
ALTER TABLE public.sources ADD CONSTRAINT sources_type_check 
CHECK (type IN ('x', 'x_hashtag', 'twitter', 'youtube', 'rss', 'hashtag', 'url'));

-- Verify the change
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'sources' AND column_name = 'type';

-- Show the constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.sources'::regclass AND contype = 'c';
