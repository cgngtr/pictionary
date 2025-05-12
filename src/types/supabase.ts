export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          created_at?: string
        }
      }
      images: {
        Row: {
          id: string
          user_id: string
          storage_path: string
          original_filename: string | null
          is_public: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          storage_path: string
          original_filename?: string | null
          is_public?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          storage_path?: string
          original_filename?: string | null
          is_public?: boolean
          created_at?: string
        }
      }
      user_images: {
        Row: {
          id: string
          created_at: string
          image_id: string
          user_id: string
          permission: 'read' | 'write'
          expires_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          image_id: string
          user_id: string
          permission?: 'read' | 'write'
          expires_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          image_id?: string
          user_id?: string
          permission?: 'read' | 'write'
          expires_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 