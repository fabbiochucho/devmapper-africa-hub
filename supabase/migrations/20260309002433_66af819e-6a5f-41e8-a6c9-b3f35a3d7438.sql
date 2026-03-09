-- Comprehensive Performance Advisor fixes
-- This migration addresses common Performance Advisor warnings:
-- 1. Missing indexes on foreign key columns
-- 2. Missing indexes on columns referenced in RLS policies
-- 3. Missing indexes on columns used in JOIN conditions
-- 4. Optimizations for sequential scans

-- ============================================
-- USER ROLES TABLE OPTIMIZATIONS
-- ============================================
-- Critical for RLS policies using has_role() function
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON user_roles(user_id, role) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- ============================================
-- CHANGE MAKERS TABLE OPTIMIZATIONS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_change_makers_user ON change_makers(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_change_makers_country ON change_makers(country_code) WHERE country_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_change_makers_verified ON change_makers(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_change_makers_sdg_goals ON change_makers USING GIN(sdg_goals);

-- ============================================
-- PROJECT UPDATES TABLE OPTIMIZATIONS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_project_updates_report ON project_updates(report_id);
CREATE INDEX IF NOT EXISTS idx_project_updates_creator ON project_updates(created_by);
CREATE INDEX IF NOT EXISTS idx_project_updates_created_desc ON project_updates(created_at DESC);

-- ============================================
-- VERIFICATION TABLES OPTIMIZATIONS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_project_verifications_report ON project_verifications(report_id);
CREATE INDEX IF NOT EXISTS idx_project_verifications_verifier ON project_verifications(verifier_id);
CREATE INDEX IF NOT EXISTS idx_project_verifications_status ON project_verifications(status);

CREATE INDEX IF NOT EXISTS idx_project_certifications_report ON project_certifications(report_id);
CREATE INDEX IF NOT EXISTS idx_project_certifications_verifier ON project_certifications(certified_by) WHERE certified_by IS NOT NULL;

-- ============================================
-- ANALYTICS AND AUDIT OPTIMIZATIONS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_org ON analytics_events(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);

-- ============================================
-- BILLING AND PAYMENTS OPTIMIZATIONS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_billing_events_org ON billing_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_type ON billing_events(event_type);
CREATE INDEX IF NOT EXISTS idx_billing_events_created ON billing_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_campaign_donations_campaign ON campaign_donations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_donations_donor ON campaign_donations(donor_id) WHERE donor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaign_donations_status ON campaign_donations(status);

-- ============================================
-- AI AND CONVERSATION OPTIMIZATIONS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_context ON ai_conversations(context_type, context_id) WHERE context_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated ON ai_conversations(updated_at DESC);

-- ============================================
-- AGENDA 2063 AND SDG OPTIMIZATIONS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_agenda2063_sdg ON agenda2063_links(sdg_goal);
CREATE INDEX IF NOT EXISTS idx_agenda2063_aspiration ON agenda2063_links(agenda_aspiration);

-- ============================================
-- SCHOLARSHIPS TABLE (if exists)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_scholarships_org ON scholarships(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_scholarships_status ON scholarships(status);
CREATE INDEX IF NOT EXISTS idx_scholarships_expires ON scholarships(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================
-- ENTITY LOCATIONS OPTIMIZATIONS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_entity_locations_user ON entity_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_entity_locations_type ON entity_locations(entity_type);
CREATE INDEX IF NOT EXISTS idx_entity_locations_country ON entity_locations(country_code) WHERE country_code IS NOT NULL;

-- ============================================
-- NOTIFICATION PREFERENCES OPTIMIZATIONS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_notif_prefs_user ON notification_preferences(user_id);

-- ============================================
-- TASK DEPENDENCIES OPTIMIZATIONS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_task_deps_task ON task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_deps_depends ON task_dependencies(depends_on_task_id);
CREATE INDEX IF NOT EXISTS idx_task_deps_type ON task_dependencies(dependency_type);

-- ============================================
-- PLAN FEATURES OPTIMIZATIONS
-- ============================================
CREATE INDEX IF NOT EXISTS idx_plan_features_plan ON plan_features(plan);
CREATE INDEX IF NOT EXISTS idx_plan_features_key ON plan_features(feature_key);
CREATE INDEX IF NOT EXISTS idx_plan_features_enabled ON plan_features(plan, enabled) WHERE enabled = true;

-- ============================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ============================================

-- Reports: Common list query pattern (status + created + country)
CREATE INDEX IF NOT EXISTS idx_reports_list_query ON reports(project_status, submitted_at DESC, country_code) 
  INCLUDE (title, sdg_goal, user_id, cost, beneficiaries);

-- Campaigns: Active campaigns by location
CREATE INDEX IF NOT EXISTS idx_campaigns_active_location ON fundraising_campaigns(status, deadline, location) 
  WHERE status = 'active';

-- Organizations: Plan-based queries
CREATE INDEX IF NOT EXISTS idx_org_plan_active ON organizations(plan_type, scholarship_override) 
  INCLUDE (project_quota_remaining, esg_enabled);

-- Evidence items: By report and verification status
CREATE INDEX IF NOT EXISTS idx_evidence_report_status ON evidence_items(report_id, verification_status, verification_stage);

-- Project tasks: By report and assignee
CREATE INDEX IF NOT EXISTS idx_tasks_report_assigned ON project_tasks(report_id, assigned_to, status) 
  WHERE assigned_to IS NOT NULL;

-- ESG suppliers: Organization lookups with enrichment status
CREATE INDEX IF NOT EXISTS idx_esg_supp_org_enriched ON esg_suppliers(organization_id, alphaearth_enriched);

-- Verification workflow: Report status lookups
CREATE INDEX IF NOT EXISTS idx_workflow_report_status ON verification_workflow_stages(report_id, stage, status);

-- ============================================
-- PARTIAL INDEXES FOR FILTERED QUERIES
-- ============================================

-- Active campaigns only
CREATE INDEX IF NOT EXISTS idx_campaigns_active_only ON fundraising_campaigns(created_at DESC) 
  WHERE status = 'active';

-- Verified reports only
CREATE INDEX IF NOT EXISTS idx_reports_verified ON reports(submitted_at DESC) 
  WHERE is_verified = true;

-- Pending certifications
CREATE INDEX IF NOT EXISTS idx_cert_apps_pending ON certification_applications(submitted_at DESC) 
  WHERE status = 'submitted';

-- Active user roles only
CREATE INDEX IF NOT EXISTS idx_user_roles_active_only ON user_roles(user_id, role) 
  WHERE is_active = true;

-- Non-anonymous donations
CREATE INDEX IF NOT EXISTS idx_donations_public ON campaign_donations(campaign_id, created_at DESC) 
  WHERE anonymous = false;

-- ============================================
-- GIN INDEXES FOR ARRAY COLUMNS
-- ============================================

-- SDG goals in reports (for filtering by SDG)
CREATE INDEX IF NOT EXISTS idx_corporate_targets_sdg ON corporate_targets USING GIN(sdg_goals);
CREATE INDEX IF NOT EXISTS idx_fundraising_sdg ON fundraising_campaigns USING GIN(sdg_goals);
CREATE INDEX IF NOT EXISTS idx_govt_projects_sdg ON government_projects USING GIN(sdg_goals);

-- Tags in forum posts
CREATE INDEX IF NOT EXISTS idx_forum_posts_tags ON forum_posts USING GIN(tags) WHERE tags IS NOT NULL;

-- ============================================
-- BTREE INDEXES FOR RANGE QUERIES
-- ============================================

-- Date range queries
CREATE INDEX IF NOT EXISTS idx_reports_date_range ON reports(start_date, end_date) WHERE start_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_date_range ON project_tasks(start_date, due_date) WHERE start_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_govt_projects_dates ON government_projects(start_date, end_date) WHERE start_date IS NOT NULL;

-- Numeric range queries
CREATE INDEX IF NOT EXISTS idx_reports_cost ON reports(cost) WHERE cost IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaigns_amount ON fundraising_campaigns(target_amount, raised_amount);

-- ============================================
-- COVERING INDEXES FOR HOT QUERIES
-- ============================================

-- User profile lookups (avoid table access)
CREATE INDEX IF NOT EXISTS idx_profiles_covering ON profiles(user_id) 
  INCLUDE (full_name, avatar_url, is_verified, organization, country);

-- Organization summary (for dashboard)
CREATE INDEX IF NOT EXISTS idx_org_summary ON organizations(id) 
  INCLUDE (name, plan_type, esg_enabled, project_quota_remaining, created_by);

-- Report summaries (for lists)
CREATE INDEX IF NOT EXISTS idx_reports_summary ON reports(id) 
  INCLUDE (title, description, sdg_goal, location, project_status, submitted_at);

COMMENT ON INDEX idx_user_roles_user_role IS 'Critical for has_role() function performance in RLS policies';
COMMENT ON INDEX idx_reports_list_query IS 'Covering index for main reports list query - avoids table scan';
COMMENT ON INDEX idx_campaigns_active_location IS 'Optimizes active campaign searches by location';
COMMENT ON INDEX idx_profiles_covering IS 'Covering index to avoid table access for profile lookups';