import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Re-export types for convenience
export type { Database, User, Style, Draft, Source, Trend } from './types'

// Singleton Supabase client instance
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null

// Client-side Supabase client (singleton pattern)
export const createBrowserClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return supabaseClient
} 