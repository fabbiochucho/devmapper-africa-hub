
-- ============================================================
-- SECURITY FIX: Remove self-role-assignment policies (privilege escalation)
-- ============================================================
DROP POLICY IF EXISTS "Users can insert their own non-admin roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can update their own non-admin roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can delete their own non-admin roles" ON public.user_roles;

-- ============================================================
-- PERFORMANCE: Add missing indexes for hot query paths
-- ============================================================

-- organizations.created_by is used in many RLS subqueries (993 seq scans on user_roles)
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON public.organizations (created_by);

-- organization_members.user_id for plan lookups
CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON public.organization_members (user_id);

-- fundraising_campaigns.created_by for donation RLS
CREATE INDEX IF NOT EXISTS idx_fundraising_campaigns_created_by ON public.fundraising_campaigns (created_by);

-- reports.user_id already has idx_reports_user, but let's clean up the duplicate
DROP INDEX IF EXISTS idx_reports_user_id;

-- esg tables for org-scoped queries
CREATE INDEX IF NOT EXISTS idx_esg_suppliers_org ON public.esg_suppliers (organization_id);
CREATE INDEX IF NOT EXISTS idx_esg_supplier_emissions_org ON public.esg_supplier_emissions (organization_id);
CREATE INDEX IF NOT EXISTS idx_esg_indicators_org ON public.esg_indicators (organization_id);
CREATE INDEX IF NOT EXISTS idx_esg_scenarios_org ON public.esg_scenarios (organization_id);

-- audit/analytics
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON public.audit_logs (org_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON public.analytics_events (user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_org ON public.analytics_events (organization_id);

-- certification
CREATE INDEX IF NOT EXISTS idx_certification_apps_applicant ON public.certification_applications (applicant_id);
CREATE INDEX IF NOT EXISTS idx_certification_apps_report ON public.certification_applications (report_id);

-- verification
CREATE INDEX IF NOT EXISTS idx_verification_scores_report ON public.verification_scores (report_id);
CREATE INDEX IF NOT EXISTS idx_verification_stages_report ON public.verification_workflow_stages (report_id);

-- project management
CREATE INDEX IF NOT EXISTS idx_project_tasks_report ON public.project_tasks (report_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned ON public.project_tasks (assigned_to);
CREATE INDEX IF NOT EXISTS idx_project_milestones_report ON public.project_milestones (report_id);
CREATE INDEX IF NOT EXISTS idx_project_budgets_report ON public.project_budgets (report_id);
CREATE INDEX IF NOT EXISTS idx_project_indicators_report ON public.project_indicators (report_id);
CREATE INDEX IF NOT EXISTS idx_project_updates_report ON public.project_updates (report_id);
CREATE INDEX IF NOT EXISTS idx_project_affiliations_report ON public.project_affiliations (report_id);
CREATE INDEX IF NOT EXISTS idx_project_affiliations_user ON public.project_affiliations (user_id);

-- evidence
CREATE INDEX IF NOT EXISTS idx_evidence_items_report ON public.evidence_items (report_id);

-- government projects
CREATE INDEX IF NOT EXISTS idx_government_projects_gov ON public.government_projects (government_id);

-- forum
CREATE INDEX IF NOT EXISTS idx_forum_posts_author ON public.forum_posts (author_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_likes_post ON public.forum_post_likes (post_id);

-- change makers
CREATE INDEX IF NOT EXISTS idx_change_makers_country ON public.change_makers (country_code);

-- corporate targets
CREATE INDEX IF NOT EXISTS idx_corporate_targets_company ON public.corporate_targets (company_id);

-- campaign donations
CREATE INDEX IF NOT EXISTS idx_campaign_donations_campaign ON public.campaign_donations (campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_donations_donor ON public.campaign_donations (donor_id);
