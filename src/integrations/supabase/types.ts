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
      agenda2063_links: {
        Row: {
          agenda_aspiration: number
          agenda_goal: string
          alignment_description: string
          created_at: string | null
          data_source: string | null
          id: string
          indicator_code: string | null
          sdg_goal: number
          sdg_target: string
        }
        Insert: {
          agenda_aspiration: number
          agenda_goal: string
          alignment_description: string
          created_at?: string | null
          data_source?: string | null
          id?: string
          indicator_code?: string | null
          sdg_goal: number
          sdg_target: string
        }
        Update: {
          agenda_aspiration?: number
          agenda_goal?: string
          alignment_description?: string
          created_at?: string | null
          data_source?: string | null
          id?: string
          indicator_code?: string | null
          sdg_goal?: number
          sdg_target?: string
        }
        Relationships: []
      }
      alphaearth_cache: {
        Row: {
          cache_key: string
          expires_at: string | null
          fetched_at: string | null
          id: string
          organization_id: string | null
          payload: Json
          provider: string
        }
        Insert: {
          cache_key: string
          expires_at?: string | null
          fetched_at?: string | null
          id?: string
          organization_id?: string | null
          payload: Json
          provider: string
        }
        Update: {
          cache_key?: string
          expires_at?: string | null
          fetched_at?: string | null
          id?: string
          organization_id?: string | null
          payload?: Json
          provider?: string
        }
        Relationships: [
          {
            foreignKeyName: "alphaearth_cache_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown
          organization_id: string | null
          page_url: string | null
          referrer: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          page_url?: string | null
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          page_url?: string | null
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          created_at: string | null
          id: string
          org_id: string | null
          payload: Json | null
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type: string
          created_at?: string | null
          id?: string
          org_id?: string | null
          payload?: Json | null
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          created_at?: string | null
          id?: string
          org_id?: string | null
          payload?: Json | null
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
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
          {
            foreignKeyName: "corporate_targets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "test_accounts_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      esg_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          metadata: Json | null
          module: string
          organization_id: string
          row_id: string | null
          table_name: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          module: string
          organization_id: string
          row_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          module?: string
          organization_id?: string
          row_id?: string | null
          table_name?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "esg_audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      esg_indicators: {
        Row: {
          carbon_scope1_tonnes: number | null
          carbon_scope2_tonnes: number | null
          carbon_scope3_tonnes: number | null
          community_investment: number | null
          created_at: string | null
          created_by: string | null
          data_quality: string | null
          energy_consumption_kwh: number | null
          esg_score: number | null
          id: string
          organization_id: string
          renewable_energy_percentage: number | null
          reporting_year: number
          updated_at: string | null
          verification_status: string | null
          waste_generated_tonnes: number | null
          water_consumption_m3: number | null
        }
        Insert: {
          carbon_scope1_tonnes?: number | null
          carbon_scope2_tonnes?: number | null
          carbon_scope3_tonnes?: number | null
          community_investment?: number | null
          created_at?: string | null
          created_by?: string | null
          data_quality?: string | null
          energy_consumption_kwh?: number | null
          esg_score?: number | null
          id?: string
          organization_id: string
          renewable_energy_percentage?: number | null
          reporting_year: number
          updated_at?: string | null
          verification_status?: string | null
          waste_generated_tonnes?: number | null
          water_consumption_m3?: number | null
        }
        Update: {
          carbon_scope1_tonnes?: number | null
          carbon_scope2_tonnes?: number | null
          carbon_scope3_tonnes?: number | null
          community_investment?: number | null
          created_at?: string | null
          created_by?: string | null
          data_quality?: string | null
          energy_consumption_kwh?: number | null
          esg_score?: number | null
          id?: string
          organization_id?: string
          renewable_energy_percentage?: number | null
          reporting_year?: number
          updated_at?: string | null
          verification_status?: string | null
          waste_generated_tonnes?: number | null
          water_consumption_m3?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "esg_indicators_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      esg_scenarios: {
        Row: {
          assumptions: Json
          baseline_year: number
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          results: Json | null
          status: string | null
          target_year: number
          updated_at: string | null
        }
        Insert: {
          assumptions?: Json
          baseline_year: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          results?: Json | null
          status?: string | null
          target_year: number
          updated_at?: string | null
        }
        Update: {
          assumptions?: Json
          baseline_year?: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          results?: Json | null
          status?: string | null
          target_year?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "esg_scenarios_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      esg_supplier_emissions: {
        Row: {
          activity_description: string | null
          alphaearth_benchmark_id: string | null
          created_at: string | null
          data_quality: string | null
          emission_factor: number | null
          emission_factor_source: string | null
          emissions_tonnes: number
          evidence_url: string | null
          id: string
          organization_id: string
          reporting_year: number
          supplier_id: string
          updated_at: string | null
        }
        Insert: {
          activity_description?: string | null
          alphaearth_benchmark_id?: string | null
          created_at?: string | null
          data_quality?: string | null
          emission_factor?: number | null
          emission_factor_source?: string | null
          emissions_tonnes?: number
          evidence_url?: string | null
          id?: string
          organization_id: string
          reporting_year: number
          supplier_id: string
          updated_at?: string | null
        }
        Update: {
          activity_description?: string | null
          alphaearth_benchmark_id?: string | null
          created_at?: string | null
          data_quality?: string | null
          emission_factor?: number | null
          emission_factor_source?: string | null
          emissions_tonnes?: number
          evidence_url?: string | null
          id?: string
          organization_id?: string
          reporting_year?: number
          supplier_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "esg_supplier_emissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "esg_supplier_emissions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "esg_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      esg_suppliers: {
        Row: {
          alphaearth_enriched: boolean | null
          annual_spend: number | null
          contact_email: string | null
          country_code: string | null
          created_at: string | null
          data_source: string | null
          id: string
          name: string
          organization_id: string
          sector: string | null
          updated_at: string | null
        }
        Insert: {
          alphaearth_enriched?: boolean | null
          annual_spend?: number | null
          contact_email?: string | null
          country_code?: string | null
          created_at?: string | null
          data_source?: string | null
          id?: string
          name: string
          organization_id: string
          sector?: string | null
          updated_at?: string | null
        }
        Update: {
          alphaearth_enriched?: boolean | null
          annual_spend?: number | null
          contact_email?: string | null
          country_code?: string | null
          created_at?: string | null
          data_source?: string | null
          id?: string
          name?: string
          organization_id?: string
          sector?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "esg_suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          feature: string
          id: string
          plan: Database["public"]["Enums"]["plan_type"]
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          feature: string
          id?: string
          plan: Database["public"]["Enums"]["plan_type"]
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          feature?: string
          id?: string
          plan?: Database["public"]["Enums"]["plan_type"]
        }
        Relationships: []
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
          {
            foreignKeyName: "fundraising_campaigns_change_maker_id_fkey"
            columns: ["change_maker_id"]
            isOneToOne: false
            referencedRelation: "test_accounts_view"
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
          {
            foreignKeyName: "government_projects_government_id_fkey"
            columns: ["government_id"]
            isOneToOne: false
            referencedRelation: "test_accounts_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_notifications: boolean | null
          id: string
          marketing_emails: boolean | null
          push_notifications: boolean | null
          sms_notifications: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          marketing_emails?: boolean | null
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          marketing_emails?: boolean | null
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
          alphaearth_api_calls_limit: number | null
          created_at: string
          created_by: string
          esg_enabled: boolean | null
          esg_scenarios_limit: number | null
          esg_suppliers_limit: number | null
          feature_flags: Json | null
          id: string
          name: string
          plan_expires_at: string | null
          plan_started_at: string | null
          plan_type: string
          primary_sector: string | null
          reporting_year: number | null
          updated_at: string
        }
        Insert: {
          alphaearth_api_calls_limit?: number | null
          created_at?: string
          created_by: string
          esg_enabled?: boolean | null
          esg_scenarios_limit?: number | null
          esg_suppliers_limit?: number | null
          feature_flags?: Json | null
          id?: string
          name: string
          plan_expires_at?: string | null
          plan_started_at?: string | null
          plan_type?: string
          primary_sector?: string | null
          reporting_year?: number | null
          updated_at?: string
        }
        Update: {
          alphaearth_api_calls_limit?: number | null
          created_at?: string
          created_by?: string
          esg_enabled?: boolean | null
          esg_scenarios_limit?: number | null
          esg_suppliers_limit?: number | null
          feature_flags?: Json | null
          id?: string
          name?: string
          plan_expires_at?: string | null
          plan_started_at?: string | null
          plan_type?: string
          primary_sector?: string | null
          reporting_year?: number | null
          updated_at?: string
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
      webhook_events: {
        Row: {
          created_at: string | null
          error_message: string | null
          event_id: string
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          processing_status: string
          provider: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          event_id: string
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
          processing_status?: string
          provider: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          processing_status?: string
          provider?: string
        }
        Relationships: []
      }
    }
    Views: {
      dashboard_stats: {
        Row: {
          countries_count: number | null
          last_updated: string | null
          total_campaigns: number | null
          total_change_makers: number | null
          total_funds_raised: number | null
          total_reports: number | null
        }
        Relationships: []
      }
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
      test_accounts_view: {
        Row: {
          countries: string[] | null
          email: string | null
          full_name: string | null
          organizations: string[] | null
          roles: Database["public"]["Enums"]["app_role"][] | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      assign_test_role: {
        Args: {
          p_country?: string
          p_organization?: string
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: string
      }
      can_access_feature: {
        Args: { p_feature: string; p_user_id: string }
        Returns: boolean
      }
      check_webhook_processed: {
        Args: { p_event_id: string; p_provider: string }
        Returns: boolean
      }
      get_agenda2063_for_sdg: {
        Args: { p_sdg_goal: number }
        Returns: {
          aspiration: number
          data_source: string
          description: string
          goal: string
        }[]
      }
      get_dashboard_stats: {
        Args: never
        Returns: {
          countries_count: number
          last_updated: string
          total_campaigns: number
          total_change_makers: number
          total_funds_raised: number
          total_reports: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_actor_id: string
          p_actor_type: string
          p_org_id: string
          p_payload?: Json
          p_target_id?: string
          p_target_table?: string
        }
        Returns: string
      }
      record_webhook_event: {
        Args: {
          p_error_message?: string
          p_event_id: string
          p_event_type: string
          p_payload: Json
          p_provider: string
          p_status?: string
        }
        Returns: string
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
      plan_type: "free" | "lite" | "pro"
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
      plan_type: ["free", "lite", "pro"],
    },
  },
} as const
