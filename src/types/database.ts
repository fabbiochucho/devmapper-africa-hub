/**
 * Auto-generated Supabase TypeScript Types
 * Generated from Supabase schema
 * Run: supabase gen types typescript --project-id ptfrzwsivtetvmdotfui > src/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          country: string | null
          organization: string | null
          phone: string | null
          bio: string | null
          is_verified: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          country?: string | null
          organization?: string | null
          phone?: string | null
          bio?: string | null
          is_verified?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          country?: string | null
          organization?: string | null
          phone?: string | null
          bio?: string | null
          is_verified?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: string
          organization: string | null
          country: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          organization?: string | null
          country?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          organization?: string | null
          country?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          id: string
          name: string
          created_by: string
          esg_enabled: boolean
          plan_type: 'lite' | 'pro' | 'enterprise'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_by: string
          esg_enabled?: boolean
          plan_type?: 'lite' | 'pro' | 'enterprise'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_by?: string
          esg_enabled?: boolean
          plan_type?: 'lite' | 'pro' | 'enterprise'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          id: string
          organization_id: string
          name: string
          country_code: string
          sector: string
          annual_spend: number | null
          emissions_status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          country_code: string
          sector: string
          annual_spend?: number | null
          emissions_status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          country_code?: string
          sector?: string
          annual_spend?: number | null
          emissions_status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          id: string
          is_group: boolean
          group_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          is_group?: boolean
          group_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          is_group?: boolean
          group_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          is_read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      forum_posts: {
        Row: {
          id: string
          title: string
          content: string
          author_id: string
          category: string
          tags: string[]
          is_pinned: boolean
          likes_count: number
          replies_count: number
          views_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          content: string
          author_id: string
          category: string
          tags?: string[]
          is_pinned?: boolean
          likes_count?: number
          replies_count?: number
          views_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          content?: string
          author_id?: string
          category?: string
          tags?: string[]
          is_pinned?: boolean
          likes_count?: number
          replies_count?: number
          views_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {
      plan_type: 'lite' | 'pro' | 'enterprise'
      user_role: 'admin' | 'platform_admin' | 'citizen_reporter' | 'government_official' | 'company_representative' | 'ngo_member' | 'verifier'
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'] & Database['public']['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] & {
      Schema: PublicTableNameOrOptions['schema']
    }
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'] &
        Database['public']['Views'])
    ? (Database['public']['Tables'] & Database['public']['Views'])[\n        PublicTableNameOrOptions\n      ] & {\n        Schema: 'public'\n      }\n    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database['public']['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof Database['public']['Enums']
    ? Database['public']['Enums'][PublicEnumNameOrOptions]
    : never
