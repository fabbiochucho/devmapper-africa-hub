export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      billing_events: {
        Row: {
          amount: number | null
          created_at: string
          currency: string | null
          event_type: string
          external_id: string | null
          id: string
          new_plan: string | null
          old_plan: string | null
          organization_id: string
          provider: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          event_type: string
          external_id?: string | null
          id?: string
          new_plan?: string | null
          old_plan?: string | null
          organization_id: string
          provider?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          currency?: string | null
          event_type?: string
          external_id?: string | null
          id?: string
          new_plan?: string | null
          old_plan?: string | null
          organization_id?: string
          provider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_donations: {
        Row: {
          amount: number
          anonymous: boolean
          campaign_id: string
          created_at: string
          currency: string
          donor_id: string | null
          id: string
          message: string | null
          payment_intent_id: string | null
          status: string
        }
        Insert: {
          amount: number
          anonymous?: boolean
          campaign_id: string
          created_at?: string
          currency?: string
          donor_id?: string | null
          id?: string
          message?: string | null
          payment_intent_id?: string | null
          status?: string
        }
        Update: {
          amount?: number
          anonymous?: boolean
          campaign_id?: string
          created_at?: string
          currency?: string
          donor_id?: string | null
          id?: string
          message?: string | null
          payment_intent_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "fundraising_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      change_makers: {
        Row: {
          country_code: string | null
          created_at: string
          description: string
          id: string
          image_url: string | null
          impact_description: string | null
          is_verified: boolean | null
          location: string
          projects_count: number | null
          sdg_goals: number[]
          title: string
          total_funding: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          country_code?: string | null
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          impact_description?: string | null
          is_verified?: boolean | null
          location: string
          projects_count?: number | null
          sdg_goals: number[]
          title: string
          total_funding?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          country_code?: string | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          impact_description?: string | null
          is_verified?: boolean | null
          location?: string
          projects_count?: number | null
          sdg_goals?: number[]
          title?: string
          total_funding?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      corporate_targets: {
        Row: {
          company_id: string
          created_at: string
          current_value: number | null
          description: string
          id: string
          sdg_goals: number[]
          status: string
          target_date: string
          target_value: number | null
          title: string
          unit: string | null
          updated_at: string
          visibility: string
        }
        Insert: {
          company_id: string
          created_at?: string
          current_value?: number | null
          description: string
          id?: string
          sdg_goals: number[]
          status?: string
          target_date: string
          target_value?: number | null
          title: string
          unit?: string | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          current_value?: number | null
          description?: string
          id?: string
          sdg_goals?: number[]
          status?: string
          target_date?: string
          target_value?: number | null
          title?: string
          unit?: string | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "corporate_targets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "corporate_targets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      forum_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          author_id: string
          category: string
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          likes_count: number
          replies_count: number
          tags: string[] | null
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          author_id: string
          category?: string
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          likes_count?: number
          replies_count?: number
          tags?: string[] | null
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          author_id?: string
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          likes_count?: number
          replies_count?: number
          tags?: string[] | null
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: []
      }
      fundraising_campaigns: {
        Row: {
          category: string
          change_maker_id: string | null
          created_at: string
          created_by: string
          currency: string
          deadline: string
          description: string
          id: string
          image_url: string | null
          is_verified: boolean
          location: string
          raised_amount: number
          sdg_goals: number[]
          status: string
          target_amount: number
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          change_maker_id?: string | null
          created_at?: string
          created_by: string
          currency?: string
          deadline: string
          description: string
          id?: string
          image_url?: string | null
          is_verified?: boolean
          location: string
          raised_amount?: number
          sdg_goals: number[]
          status?: string
          target_amount: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          change_maker_id?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          deadline?: string
          description?: string
          id?: string
          image_url?: string | null
          is_verified?: boolean
          location?: string
          raised_amount?: number
          sdg_goals?: number[]
          status?: string
          target_amount?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fundraising_campaigns_change_maker_id_fkey"
            columns: ["change_maker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fundraising_campaigns_change_maker_id_fkey"
            columns: ["change_maker_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      government_projects: {
        Row: {
          beneficiaries: number | null
          budget: number | null
          created_at: string
          currency: string
          description: string
          end_date: string | null
          government_id: string
          id: string
          location: string | null
          sdg_goals: number[]
          spent_amount: number | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          beneficiaries?: number | null
          budget?: number | null
          created_at?: string
          currency?: string
          description: string
          end_date?: string | null
          government_id: string
          id?: string
          location?: string | null
          sdg_goals: number[]
          spent_amount?: number | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          beneficiaries?: number | null
          budget?: number | null
          created_at?: string
          currency?: string
          description?: string
          end_date?: string | null
          government_id?: string
          id?: string
          location?: string | null
          sdg_goals?: number[]
          spent_amount?: number | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "government_projects_government_id_fkey"
            columns: ["government_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "government_projects_government_id_fkey"
            columns: ["government_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          plan_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          plan_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          plan_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      otp_settings: {
        Row: {
          created_at: string | null
          expiration_time: number
          id: number
        }
        Insert: {
          created_at?: string | null
          expiration_time: number
          id?: never
        }
        Update: {
          created_at?: string | null
          expiration_time?: number
          id?: never
        }
        Relationships: []
      }
      partners: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          logo_url: string
          name: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          logo_url: string
          name: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          logo_url?: string
          name?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_verified: boolean
          organization: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_verified?: boolean
          organization?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_verified?: boolean
          organization?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          beneficiaries: number | null
          cost: number | null
          country_code: string | null
          description: string
          evidence_url: string | null
          id: string
          is_verified: boolean | null
          lat: number | null
          lng: number | null
          location: string | null
          project_status: string
          sdg_goal: number
          submitted_at: string
          title: string
          updated_at: string
          user_id: string | null
          verification_count: number | null
        }
        Insert: {
          beneficiaries?: number | null
          cost?: number | null
          country_code?: string | null
          description: string
          evidence_url?: string | null
          id?: string
          is_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          location?: string | null
          project_status?: string
          sdg_goal: number
          submitted_at?: string
          title: string
          updated_at?: string
          user_id?: string | null
          verification_count?: number | null
        }
        Update: {
          beneficiaries?: number | null
          cost?: number | null
          country_code?: string | null
          description?: string
          evidence_url?: string | null
          id?: string
          is_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          location?: string | null
          project_status?: string
          sdg_goal?: number
          submitted_at?: string
          title?: string
          updated_at?: string
          user_id?: string | null
          verification_count?: number | null
        }
        Relationships: []
      }
      sdg_agenda2063_alignment: {
        Row: {
          agenda2063_aspiration: string
          agenda2063_goal: string
          alignment_description: string
          created_at: string
          id: string
          sdg_goal: number
          sdg_target: string
        }
        Insert: {
          agenda2063_aspiration: string
          agenda2063_goal: string
          alignment_description: string
          created_at?: string
          id?: string
          sdg_goal: number
          sdg_target: string
        }
        Update: {
          agenda2063_aspiration?: string
          agenda2063_goal?: string
          alignment_description?: string
          created_at?: string
          id?: string
          sdg_goal?: number
          sdg_target?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          country: string | null
          granted_at: string
          granted_by: string | null
          id: string
          is_active: boolean
          organization: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          country?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          organization?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          country?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          organization?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_logs: {
        Row: {
          comments: string | null
          created_at: string
          id: string
          report_id: string | null
          user_id: string | null
          verification_type: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          id?: string
          report_id?: string | null
          user_id?: string | null
          verification_type: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          id?: string
          report_id?: string | null
          user_id?: string | null
          verification_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_logs_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          is_verified: boolean | null
          organization: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          is_verified?: boolean | null
          organization?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          is_verified?: boolean | null
          organization?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "ngo_member"
        | "government_official"
        | "company_representative"
        | "country_admin"
        | "platform_admin"
        | "change_maker"
        | "citizen_reporter"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "ngo_member",
        "government_official",
        "company_representative",
        "country_admin",
        "platform_admin",
        "change_maker",
        "citizen_reporter",
      ],
    },
  },
} as const
