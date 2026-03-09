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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_areas: {
        Row: {
          country_code: string
          created_at: string
          id: string
          level: string
          name: string
          parent_id: string | null
        }
        Insert: {
          country_code: string
          created_at?: string
          id?: string
          level: string
          name: string
          parent_id?: string | null
        }
        Update: {
          country_code?: string
          created_at?: string
          id?: string
          level?: string
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_areas_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "admin_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_broadcasts: {
        Row: {
          created_at: string | null
          id: string
          is_read_by: Json | null
          message: string
          priority: string | null
          recipient_ids: string[] | null
          recipient_type: string
          sender_id: string
          subject: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read_by?: Json | null
          message: string
          priority?: string | null
          recipient_ids?: string[] | null
          recipient_type: string
          sender_id: string
          subject: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read_by?: Json | null
          message?: string
          priority?: string | null
          recipient_ids?: string[] | null
          recipient_type?: string
          sender_id?: string
          subject?: string
        }
        Relationships: []
      }
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
      ai_conversations: {
        Row: {
          context_id: string | null
          context_type: string
          created_at: string
          id: string
          messages: Json
          metadata: Json | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          context_id?: string | null
          context_type?: string
          created_at?: string
          id?: string
          messages?: Json
          metadata?: Json | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          context_id?: string | null
          context_type?: string
          created_at?: string
          id?: string
          messages?: Json
          metadata?: Json | null
          title?: string | null
          updated_at?: string
          user_id?: string
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
      certification_applications: {
        Row: {
          applicant_id: string
          budget_usd: number | null
          created_at: string
          evidence_summary: string | null
          expected_outcomes: string | null
          geographic_scope: string | null
          id: string
          organization_id: string | null
          project_description: string | null
          report_id: string
          requested_tier: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          sdg_goals: number[]
          status: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          applicant_id: string
          budget_usd?: number | null
          created_at?: string
          evidence_summary?: string | null
          expected_outcomes?: string | null
          geographic_scope?: string | null
          id?: string
          organization_id?: string | null
          project_description?: string | null
          report_id: string
          requested_tier?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          sdg_goals?: number[]
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          budget_usd?: number | null
          created_at?: string
          evidence_summary?: string | null
          expected_outcomes?: string | null
          geographic_scope?: string | null
          id?: string
          organization_id?: string | null
          project_description?: string | null
          report_id?: string
          requested_tier?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          sdg_goals?: number[]
          status?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certification_applications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certification_applications_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: true
            referencedRelation: "reports"
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
      citizen_project_feedback: {
        Row: {
          comment: string | null
          created_at: string
          feedback_type: string
          id: string
          is_issue_report: boolean
          issue_severity: string | null
          photo_url: string | null
          progress_estimate: number | null
          rating: number | null
          report_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          feedback_type?: string
          id?: string
          is_issue_report?: boolean
          issue_severity?: string | null
          photo_url?: string | null
          progress_estimate?: number | null
          rating?: number | null
          report_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          feedback_type?: string
          id?: string
          is_issue_report?: boolean
          issue_severity?: string | null
          photo_url?: string | null
          progress_estimate?: number | null
          rating?: number | null
          report_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "citizen_project_feedback_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_content: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          is_published: boolean | null
          meta: Json | null
          page_key: string
          title: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          meta?: Json | null
          page_key: string
          title: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          meta?: Json | null
          page_key?: string
          title?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      cms_sections: {
        Row: {
          content: Json
          created_at: string | null
          display_order: number | null
          id: string
          is_visible: boolean | null
          page_key: string
          section_key: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          content?: Json
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          page_key: string
          section_key: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          display_order?: number | null
          id?: string
          is_visible?: boolean | null
          page_key?: string
          section_key?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          is_pinned: boolean
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_pinned?: boolean
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_pinned?: boolean
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string
          group_name: string | null
          id: string
          is_group: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          group_name?: string | null
          id?: string
          is_group?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          group_name?: string | null
          id?: string
          is_group?: boolean
          updated_at?: string
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
      country_intelligence: {
        Row: {
          carbon_market_maturity: string | null
          central_bank_name: string | null
          climate_disclosure_status: string | null
          country_code: string
          country_name: string
          created_at: string
          currency_code: string
          digital_reporting_maturity: string | null
          enforcement_intensity_index: number | null
          environmental_agency_name: string | null
          esg_regulatory_status: string | null
          iso2_code: string
          legal_system_type: string | null
          ngo_regulation_score: number | null
          official_languages: Json
          regional_blocs: Json | null
          stock_exchange_name: string | null
          updated_at: string
        }
        Insert: {
          carbon_market_maturity?: string | null
          central_bank_name?: string | null
          climate_disclosure_status?: string | null
          country_code: string
          country_name: string
          created_at?: string
          currency_code?: string
          digital_reporting_maturity?: string | null
          enforcement_intensity_index?: number | null
          environmental_agency_name?: string | null
          esg_regulatory_status?: string | null
          iso2_code: string
          legal_system_type?: string | null
          ngo_regulation_score?: number | null
          official_languages?: Json
          regional_blocs?: Json | null
          stock_exchange_name?: string | null
          updated_at?: string
        }
        Update: {
          carbon_market_maturity?: string | null
          central_bank_name?: string | null
          climate_disclosure_status?: string | null
          country_code?: string
          country_name?: string
          created_at?: string
          currency_code?: string
          digital_reporting_maturity?: string | null
          enforcement_intensity_index?: number | null
          environmental_agency_name?: string | null
          esg_regulatory_status?: string | null
          iso2_code?: string
          legal_system_type?: string | null
          ngo_regulation_score?: number | null
          official_languages?: Json
          regional_blocs?: Json | null
          stock_exchange_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_url: string | null
          id: string
          message_type: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          message_type?: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          message_type?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_locations: {
        Row: {
          address: string | null
          city: string | null
          country: string
          country_code: string | null
          created_at: string
          entity_type: string
          id: string
          is_headquarters: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country: string
          country_code?: string | null
          created_at?: string
          entity_type: string
          id?: string
          is_headquarters?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string
          country_code?: string | null
          created_at?: string
          entity_type?: string
          id?: string
          is_headquarters?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      evidence_items: {
        Row: {
          created_at: string
          description: string | null
          evidence_type: string
          file_url: string | null
          id: string
          report_id: string
          title: string
          updated_at: string
          uploaded_by: string
          verification_stage: string | null
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          evidence_type: string
          file_url?: string | null
          id?: string
          report_id: string
          title: string
          updated_at?: string
          uploaded_by: string
          verification_stage?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          evidence_type?: string
          file_url?: string | null
          id?: string
          report_id?: string
          title?: string
          updated_at?: string
          uploaded_by?: string
          verification_stage?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_items_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
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
      feedback_votes: {
        Row: {
          created_at: string
          feedback_id: string
          id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          created_at?: string
          feedback_id: string
          id?: string
          user_id: string
          vote_type: string
        }
        Update: {
          created_at?: string
          feedback_id?: string
          id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_votes_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "citizen_project_feedback"
            referencedColumns: ["id"]
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
          report_id: string | null
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
          report_id?: string | null
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
          report_id?: string | null
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
            foreignKeyName: "fundraising_campaigns_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      government_projects: {
        Row: {
          admin_area_id: string | null
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
          admin_area_id?: string | null
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
          admin_area_id?: string | null
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
            foreignKeyName: "government_projects_admin_area_id_fkey"
            columns: ["admin_area_id"]
            isOneToOne: false
            referencedRelation: "admin_areas"
            referencedColumns: ["id"]
          },
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
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          metadata?: Json | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          metadata?: Json | null
          title?: string
          type?: string
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
          compliance_tier: string | null
          created_at: string
          created_by: string
          esg_enabled: boolean | null
          esg_scenarios_limit: number | null
          esg_suppliers_limit: number | null
          feature_flags: Json | null
          id: string
          incorporation_country: string | null
          monthly_addition: number | null
          name: string
          operating_countries: string[] | null
          ownership_structure: string | null
          plan_expires_at: string | null
          plan_started_at: string | null
          plan_type: string
          primary_sector: string | null
          project_cap: number | null
          project_quota_remaining: number | null
          registration_id: string | null
          regulatory_exposure: Json | null
          reporting_year: number | null
          revenue_band: string | null
          rollover_allowed: boolean | null
          scholarship_override: string | null
          sector_code: string | null
          updated_at: string
        }
        Insert: {
          alphaearth_api_calls_limit?: number | null
          compliance_tier?: string | null
          created_at?: string
          created_by: string
          esg_enabled?: boolean | null
          esg_scenarios_limit?: number | null
          esg_suppliers_limit?: number | null
          feature_flags?: Json | null
          id?: string
          incorporation_country?: string | null
          monthly_addition?: number | null
          name: string
          operating_countries?: string[] | null
          ownership_structure?: string | null
          plan_expires_at?: string | null
          plan_started_at?: string | null
          plan_type?: string
          primary_sector?: string | null
          project_cap?: number | null
          project_quota_remaining?: number | null
          registration_id?: string | null
          regulatory_exposure?: Json | null
          reporting_year?: number | null
          revenue_band?: string | null
          rollover_allowed?: boolean | null
          scholarship_override?: string | null
          sector_code?: string | null
          updated_at?: string
        }
        Update: {
          alphaearth_api_calls_limit?: number | null
          compliance_tier?: string | null
          created_at?: string
          created_by?: string
          esg_enabled?: boolean | null
          esg_scenarios_limit?: number | null
          esg_suppliers_limit?: number | null
          feature_flags?: Json | null
          id?: string
          incorporation_country?: string | null
          monthly_addition?: number | null
          name?: string
          operating_countries?: string[] | null
          ownership_structure?: string | null
          plan_expires_at?: string | null
          plan_started_at?: string | null
          plan_type?: string
          primary_sector?: string | null
          project_cap?: number | null
          project_quota_remaining?: number | null
          registration_id?: string | null
          regulatory_exposure?: Json | null
          reporting_year?: number | null
          revenue_band?: string | null
          rollover_allowed?: boolean | null
          scholarship_override?: string | null
          sector_code?: string | null
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
      plan_features: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          feature_key: string
          id: string
          plan: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          feature_key: string
          id?: string
          plan: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          feature_key?: string
          id?: string
          plan?: string
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
          impact_area: string | null
          is_verified: boolean
          legal_capacity: string | null
          organization: string | null
          phone: string | null
          regulatory_exposure: Json | null
          sector_classification: string | null
          updated_at: string
          user_id: string
          verification_tier: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          impact_area?: string | null
          is_verified?: boolean
          legal_capacity?: string | null
          organization?: string | null
          phone?: string | null
          regulatory_exposure?: Json | null
          sector_classification?: string | null
          updated_at?: string
          user_id: string
          verification_tier?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          impact_area?: string | null
          is_verified?: boolean
          legal_capacity?: string | null
          organization?: string | null
          phone?: string | null
          regulatory_exposure?: Json | null
          sector_classification?: string | null
          updated_at?: string
          user_id?: string
          verification_tier?: string | null
        }
        Relationships: []
      }
      project_affiliations: {
        Row: {
          created_at: string
          id: string
          organization_name: string | null
          relationship_type: string
          report_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_name?: string | null
          relationship_type: string
          report_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_name?: string | null
          relationship_type?: string
          report_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_affiliations_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      project_budgets: {
        Row: {
          budget_allocated: number | null
          budget_spent: number | null
          created_at: string
          created_by: string
          currency: string
          donor_organization: string | null
          funding_source: string | null
          id: string
          notes: string | null
          report_id: string
          transparency_score: number | null
          updated_at: string
        }
        Insert: {
          budget_allocated?: number | null
          budget_spent?: number | null
          created_at?: string
          created_by: string
          currency?: string
          donor_organization?: string | null
          funding_source?: string | null
          id?: string
          notes?: string | null
          report_id: string
          transparency_score?: number | null
          updated_at?: string
        }
        Update: {
          budget_allocated?: number | null
          budget_spent?: number | null
          created_at?: string
          created_by?: string
          currency?: string
          donor_organization?: string | null
          funding_source?: string | null
          id?: string
          notes?: string | null
          report_id?: string
          transparency_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_budgets_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      project_certifications: {
        Row: {
          certificate_number: string | null
          certification_body: string | null
          certified_by: string | null
          certified_by_name: string | null
          created_at: string
          expires_at: string | null
          id: string
          issued_at: string
          notes: string | null
          rating: string
          report_id: string
          score_id: string | null
          status: string
        }
        Insert: {
          certificate_number?: string | null
          certification_body?: string | null
          certified_by?: string | null
          certified_by_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_at?: string
          notes?: string | null
          rating: string
          report_id: string
          score_id?: string | null
          status?: string
        }
        Update: {
          certificate_number?: string | null
          certification_body?: string | null
          certified_by?: string | null
          certified_by_name?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          issued_at?: string
          notes?: string | null
          rating?: string
          report_id?: string
          score_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_certifications_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_certifications_score_id_fkey"
            columns: ["score_id"]
            isOneToOne: false
            referencedRelation: "verification_scores"
            referencedColumns: ["id"]
          },
        ]
      }
      project_dism_scores: {
        Row: {
          created_at: string
          evidence_verification: number
          governance_ethics: number
          id: string
          impact_depth: number
          impact_scale: number
          innovation_replicability: number
          outcome_effectiveness: number
          report_id: string
          scored_by: string | null
          sdg_alignment: number
          sustainability: number
          total_score: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          evidence_verification?: number
          governance_ethics?: number
          id?: string
          impact_depth?: number
          impact_scale?: number
          innovation_replicability?: number
          outcome_effectiveness?: number
          report_id: string
          scored_by?: string | null
          sdg_alignment?: number
          sustainability?: number
          total_score?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          evidence_verification?: number
          governance_ethics?: number
          id?: string
          impact_depth?: number
          impact_scale?: number
          innovation_replicability?: number
          outcome_effectiveness?: number
          report_id?: string
          scored_by?: string | null
          sdg_alignment?: number
          sustainability?: number
          total_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_dism_scores_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: true
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      project_indicators: {
        Row: {
          agenda2063_aspiration: string | null
          baseline_value: number | null
          created_at: string
          created_by: string
          current_value: number | null
          id: string
          indicator_name: string
          report_id: string
          sdg_goal: number | null
          target_value: number | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          agenda2063_aspiration?: string | null
          baseline_value?: number | null
          created_at?: string
          created_by: string
          current_value?: number | null
          id?: string
          indicator_name: string
          report_id: string
          sdg_goal?: number | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          agenda2063_aspiration?: string | null
          baseline_value?: number | null
          created_at?: string
          created_by?: string
          current_value?: number | null
          id?: string
          indicator_name?: string
          report_id?: string
          sdg_goal?: number | null
          target_value?: number | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_indicators_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      project_milestones: {
        Row: {
          completion_percentage: number
          created_at: string
          created_by: string | null
          description: string | null
          evidence_url: string | null
          id: string
          notes: string | null
          report_id: string
          status: string
          target_date: string | null
          title: string
          updated_at: string
        }
        Insert: {
          completion_percentage?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          evidence_url?: string | null
          id?: string
          notes?: string | null
          report_id: string
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          completion_percentage?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          evidence_url?: string | null
          id?: string
          notes?: string | null
          report_id?: string
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      project_procurement: {
        Row: {
          contract_type: string
          contract_value: number
          contractor_name: string
          created_at: string
          created_by: string
          currency: string
          end_date: string | null
          evidence_url: string | null
          id: string
          procurement_method: string
          report_id: string
          scope: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          contract_type?: string
          contract_value?: number
          contractor_name: string
          created_at?: string
          created_by: string
          currency?: string
          end_date?: string | null
          evidence_url?: string | null
          id?: string
          procurement_method?: string
          report_id: string
          scope?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          contract_type?: string
          contract_value?: number
          contractor_name?: string
          created_at?: string
          created_by?: string
          currency?: string
          end_date?: string | null
          evidence_url?: string | null
          id?: string
          procurement_method?: string
          report_id?: string
          scope?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_procurement_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          parent_task_id: string | null
          priority: string
          report_id: string
          sort_order: number | null
          start_date: string | null
          status: string
          tags: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          parent_task_id?: string | null
          priority?: string
          report_id: string
          sort_order?: number | null
          start_date?: string | null
          status?: string
          tags?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          parent_task_id?: string | null
          priority?: string
          report_id?: string
          sort_order?: number | null
          start_date?: string | null
          status?: string
          tags?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          created_at: string
          created_by: string
          evidence_url: string | null
          id: string
          photos: Json | null
          progress_percent: number | null
          report_id: string
          update_text: string
        }
        Insert: {
          created_at?: string
          created_by: string
          evidence_url?: string | null
          id?: string
          photos?: Json | null
          progress_percent?: number | null
          report_id: string
          update_text: string
        }
        Update: {
          created_at?: string
          created_by?: string
          evidence_url?: string | null
          id?: string
          photos?: Json | null
          progress_percent?: number | null
          report_id?: string
          update_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      project_verifications: {
        Row: {
          comments: string | null
          created_at: string
          evidence_url: string | null
          id: string
          report_id: string
          status: string
          verification_level: string
          verified_at: string | null
          verifier_id: string
        }
        Insert: {
          comments?: string | null
          created_at?: string
          evidence_url?: string | null
          id?: string
          report_id: string
          status?: string
          verification_level?: string
          verified_at?: string | null
          verifier_id: string
        }
        Update: {
          comments?: string | null
          created_at?: string
          evidence_url?: string | null
          id?: string
          report_id?: string
          status?: string
          verification_level?: string
          verified_at?: string | null
          verifier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_verifications_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      regulatory_exposure_profiles: {
        Row: {
          actor_type: string
          compliance_score: number | null
          country_code: string
          created_at: string
          exposure_categories: Json
          id: string
          last_assessed_at: string | null
          mandatory_frameworks: Json | null
          reporting_frequency: string | null
          risk_level: string | null
          sector_code: string | null
          updated_at: string
          user_id: string
          voluntary_frameworks: Json | null
        }
        Insert: {
          actor_type: string
          compliance_score?: number | null
          country_code: string
          created_at?: string
          exposure_categories?: Json
          id?: string
          last_assessed_at?: string | null
          mandatory_frameworks?: Json | null
          reporting_frequency?: string | null
          risk_level?: string | null
          sector_code?: string | null
          updated_at?: string
          user_id: string
          voluntary_frameworks?: Json | null
        }
        Update: {
          actor_type?: string
          compliance_score?: number | null
          country_code?: string
          created_at?: string
          exposure_categories?: Json
          id?: string
          last_assessed_at?: string | null
          mandatory_frameworks?: Json | null
          reporting_frequency?: string | null
          risk_level?: string | null
          sector_code?: string | null
          updated_at?: string
          user_id?: string
          voluntary_frameworks?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "regulatory_exposure_profiles_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "country_intelligence"
            referencedColumns: ["country_code"]
          },
        ]
      }
      regulatory_frameworks: {
        Row: {
          applicable_entity_types: Json
          category: string
          country_code: string
          created_at: string
          effective_date: string | null
          enforcement_risk: string | null
          id: string
          mandatory: boolean
          name: string
          regulator_name: string | null
          reporting_frequency: string | null
          rule_tree: Json | null
          source_url: string | null
          status: string
          updated_at: string
          version: number
        }
        Insert: {
          applicable_entity_types?: Json
          category: string
          country_code: string
          created_at?: string
          effective_date?: string | null
          enforcement_risk?: string | null
          id?: string
          mandatory?: boolean
          name: string
          regulator_name?: string | null
          reporting_frequency?: string | null
          rule_tree?: Json | null
          source_url?: string | null
          status?: string
          updated_at?: string
          version?: number
        }
        Update: {
          applicable_entity_types?: Json
          category?: string
          country_code?: string
          created_at?: string
          effective_date?: string | null
          enforcement_risk?: string | null
          id?: string
          mandatory?: boolean
          name?: string
          regulator_name?: string | null
          reporting_frequency?: string | null
          rule_tree?: Json | null
          source_url?: string | null
          status?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "regulatory_frameworks_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "country_intelligence"
            referencedColumns: ["country_code"]
          },
        ]
      }
      report_flags: {
        Row: {
          created_at: string
          details: string | null
          flagged_by: string
          id: string
          reason: string
          report_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          flagged_by: string
          id?: string
          reason: string
          report_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          flagged_by?: string
          id?: string
          reason?: string
          report_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_flags_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          beneficiaries: number | null
          contractor: string | null
          cost: number | null
          cost_currency: string | null
          country_code: string | null
          description: string
          end_date: string | null
          evidence_url: string | null
          funder: string | null
          id: string
          is_verified: boolean | null
          lat: number | null
          lng: number | null
          location: string | null
          project_status: string
          sdg_goal: number
          sponsor: string | null
          start_date: string | null
          submitted_at: string
          title: string
          updated_at: string
          usd_exchange_rate: number | null
          user_id: string | null
          verification_count: number | null
          visibility: string
        }
        Insert: {
          beneficiaries?: number | null
          contractor?: string | null
          cost?: number | null
          cost_currency?: string | null
          country_code?: string | null
          description: string
          end_date?: string | null
          evidence_url?: string | null
          funder?: string | null
          id?: string
          is_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          location?: string | null
          project_status?: string
          sdg_goal: number
          sponsor?: string | null
          start_date?: string | null
          submitted_at?: string
          title: string
          updated_at?: string
          usd_exchange_rate?: number | null
          user_id?: string | null
          verification_count?: number | null
          visibility?: string
        }
        Update: {
          beneficiaries?: number | null
          contractor?: string | null
          cost?: number | null
          cost_currency?: string | null
          country_code?: string | null
          description?: string
          end_date?: string | null
          evidence_url?: string | null
          funder?: string | null
          id?: string
          is_verified?: boolean | null
          lat?: number | null
          lng?: number | null
          location?: string | null
          project_status?: string
          sdg_goal?: number
          sponsor?: string | null
          start_date?: string | null
          submitted_at?: string
          title?: string
          updated_at?: string
          usd_exchange_rate?: number | null
          user_id?: string | null
          verification_count?: number | null
          visibility?: string
        }
        Relationships: []
      }
      scholarships: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          country: string | null
          created_at: string
          duration_months: number | null
          expires_at: string | null
          id: string
          justification: string
          org_id: string | null
          organization_name: string | null
          requested_plan: string
          role: string | null
          status: string
          updated_at: string
          use_case: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          country?: string | null
          created_at?: string
          duration_months?: number | null
          expires_at?: string | null
          id?: string
          justification: string
          org_id?: string | null
          organization_name?: string | null
          requested_plan?: string
          role?: string | null
          status?: string
          updated_at?: string
          use_case?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          country?: string | null
          created_at?: string
          duration_months?: number | null
          expires_at?: string | null
          id?: string
          justification?: string
          org_id?: string | null
          organization_name?: string | null
          requested_plan?: string
          role?: string | null
          status?: string
          updated_at?: string
          use_case?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scholarships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      sdg_indicators: {
        Row: {
          created_at: string
          frequency: string | null
          id: string
          indicator_code: string
          indicator_name: string
          is_active: boolean
          level: string | null
          measurement_type: string
          sdg_id: number
          sector: string | null
          source: string | null
          target_id: string
          unit: string
          verification_requirement: string | null
        }
        Insert: {
          created_at?: string
          frequency?: string | null
          id?: string
          indicator_code: string
          indicator_name: string
          is_active?: boolean
          level?: string | null
          measurement_type?: string
          sdg_id: number
          sector?: string | null
          source?: string | null
          target_id: string
          unit?: string
          verification_requirement?: string | null
        }
        Update: {
          created_at?: string
          frequency?: string | null
          id?: string
          indicator_code?: string
          indicator_name?: string
          is_active?: boolean
          level?: string | null
          measurement_type?: string
          sdg_id?: number
          sector?: string | null
          source?: string | null
          target_id?: string
          unit?: string
          verification_requirement?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string | null
          description: string
          id: string
          priority: string | null
          resolution_notes: string | null
          resolved_at: string | null
          status: string | null
          subject: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string | null
          description: string
          id?: string
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      task_activity: {
        Row: {
          activity_type: string
          content: string | null
          created_at: string
          id: string
          new_value: string | null
          old_value: string | null
          task_id: string
          user_id: string
        }
        Insert: {
          activity_type?: string
          content?: string | null
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id: string
          user_id: string
        }
        Update: {
          activity_type?: string
          content?: string | null
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_activity_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          created_at: string
          dependency_type: string
          depends_on_task_id: string
          id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          dependency_type?: string
          depends_on_task_id: string
          id?: string
          task_id: string
        }
        Update: {
          created_at?: string
          dependency_type?: string
          depends_on_task_id?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "project_tasks"
            referencedColumns: ["id"]
          },
        ]
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
      verification_ledger: {
        Row: {
          actor_id: string | null
          created_at: string
          entry_hash: string
          event_type: string
          id: string
          payload: Json
          prev_hash: string | null
          report_id: string | null
          sequence_number: number
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          entry_hash: string
          event_type: string
          id?: string
          payload?: Json
          prev_hash?: string | null
          report_id?: string | null
          sequence_number: number
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          entry_hash?: string
          event_type?: string
          id?: string
          payload?: Json
          prev_hash?: string | null
          report_id?: string | null
          sequence_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "verification_ledger_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
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
      verification_scores: {
        Row: {
          certification_rating: string | null
          community_validation_score: number | null
          created_at: string
          evidence_strength_score: number | null
          id: string
          implementation_integrity_score: number | null
          outcome_achievement_score: number | null
          output_delivery_score: number | null
          report_id: string
          scored_at: string | null
          scored_by: string | null
          sdg_alignment_score: number | null
          sustainability_score: number | null
          total_sis: number | null
          updated_at: string
        }
        Insert: {
          certification_rating?: string | null
          community_validation_score?: number | null
          created_at?: string
          evidence_strength_score?: number | null
          id?: string
          implementation_integrity_score?: number | null
          outcome_achievement_score?: number | null
          output_delivery_score?: number | null
          report_id: string
          scored_at?: string | null
          scored_by?: string | null
          sdg_alignment_score?: number | null
          sustainability_score?: number | null
          total_sis?: number | null
          updated_at?: string
        }
        Update: {
          certification_rating?: string | null
          community_validation_score?: number | null
          created_at?: string
          evidence_strength_score?: number | null
          id?: string
          implementation_integrity_score?: number | null
          outcome_achievement_score?: number | null
          output_delivery_score?: number | null
          report_id?: string
          scored_at?: string | null
          scored_by?: string | null
          sdg_alignment_score?: number | null
          sustainability_score?: number | null
          total_sis?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_scores_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: true
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_workflow_stages: {
        Row: {
          assigned_verifier: string | null
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          report_id: string
          stage: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_verifier?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          report_id: string
          stage: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_verifier?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          report_id?: string
          stage?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_workflow_stages_report_id_fkey"
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
      mv_dashboard_stats: {
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
      check_project_quota: { Args: { p_org_id: string }; Returns: boolean }
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
      get_effective_plan: { Args: { p_org_id: string }; Returns: string }
      get_test_accounts: {
        Args: never
        Returns: {
          countries: string[]
          email: string
          full_name: string
          organizations: string[]
          roles: Database["public"]["Enums"]["app_role"][]
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_affiliated_with_report: {
        Args: { _report_id: string; _user_id: string }
        Returns: boolean
      }
      is_user_admin: { Args: { target_user_id: string }; Returns: boolean }
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
      refresh_dashboard_stats: { Args: never; Returns: undefined }
      reset_monthly_quotas: { Args: never; Returns: undefined }
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
      plan_type: "free" | "lite" | "pro" | "advanced" | "enterprise"
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
      plan_type: ["free", "lite", "pro", "advanced", "enterprise"],
    },
  },
} as const
