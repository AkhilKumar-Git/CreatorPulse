// Types for database tables
export interface User {
  id: string
  email: string
  persona_json?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export interface Style {
  id: string
  user_id: string
  embeddings_json: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export interface Draft {
  id: string
  user_id: string
  content: string
  status: 'draft' | 'published' | 'archived'
  feedback?: string
  created_at?: string
  updated_at?: string
}

export interface Source {
  id: string
  user_id: string
  type: 'url' | 'file' | 'text'
  url?: string
  content?: string
  metadata?: Record<string, unknown>
  created_at?: string
  updated_at?: string
}

export interface Trend {
  id: string
  date: string
  topics_json: Record<string, unknown>
  created_at?: string
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
      }
      styles: {
        Row: Style
        Insert: Omit<Style, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Style, 'id' | 'created_at' | 'updated_at'>>
      }
      drafts: {
        Row: Draft
        Insert: Omit<Draft, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Draft, 'id' | 'created_at' | 'updated_at'>>
      }
      sources: {
        Row: Source
        Insert: Omit<Source, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Source, 'id' | 'created_at' | 'updated_at'>>
      }
      trends: {
        Row: Trend
        Insert: Omit<Trend, 'id' | 'created_at'>
        Update: Partial<Omit<Trend, 'id' | 'created_at'>>
      }
    }
  }
} 