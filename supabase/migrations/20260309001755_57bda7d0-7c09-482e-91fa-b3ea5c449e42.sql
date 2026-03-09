-- Performance optimization: Add indexes for frequently queried columns and foreign keys
-- These indexes optimize RLS policies, joins, and common query patterns

-- Organizations table optimizations
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON organizations(created_by);
CREATE INDEX IF NOT EXISTS idx_organizations_plan_type ON organizations(plan_type);

-- Organization members optimizations (used heavily in RLS policies)
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_composite ON organization_members(organization_id, user_id);

-- Reports table optimizations
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_country_code ON reports(country_code) WHERE country_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reports_sdg_goal ON reports(sdg_goal);
CREATE INDEX IF NOT EXISTS idx_reports_recent ON reports(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(project_status);

-- Fundraising campaigns optimizations
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON fundraising_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_change_maker ON fundraising_campaigns(change_maker_id) WHERE change_maker_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_campaigns_deadline ON fundraising_campaigns(deadline);
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON fundraising_campaigns(status, deadline) WHERE status = 'active';

-- Project affiliations (used in RLS policies)
CREATE INDEX IF NOT EXISTS idx_affiliations_user_id ON project_affiliations(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliations_report_id ON project_affiliations(report_id);

-- Certification applications
CREATE INDEX IF NOT EXISTS idx_cert_apps_applicant ON certification_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_cert_apps_report ON certification_applications(report_id);
CREATE INDEX IF NOT EXISTS idx_cert_apps_status ON certification_applications(status);

-- Evidence items
CREATE INDEX IF NOT EXISTS idx_evidence_report ON evidence_items(report_id);
CREATE INDEX IF NOT EXISTS idx_evidence_uploader ON evidence_items(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_evidence_status ON evidence_items(verification_status);

-- Project tasks
CREATE INDEX IF NOT EXISTS idx_tasks_report ON project_tasks(report_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON project_tasks(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_status ON project_tasks(status, priority);

-- Project indicators
CREATE INDEX IF NOT EXISTS idx_indicators_report ON project_indicators(report_id);
CREATE INDEX IF NOT EXISTS idx_indicators_sdg ON project_indicators(sdg_goal) WHERE sdg_goal IS NOT NULL;

-- Project budgets
CREATE INDEX IF NOT EXISTS idx_budgets_report ON project_budgets(report_id);
CREATE INDEX IF NOT EXISTS idx_budgets_creator ON project_budgets(created_by);

-- Project milestones
CREATE INDEX IF NOT EXISTS idx_milestones_report ON project_milestones(report_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON project_milestones(status);

-- ESG indicators
CREATE INDEX IF NOT EXISTS idx_esg_ind_org ON esg_indicators(organization_id);
CREATE INDEX IF NOT EXISTS idx_esg_ind_year ON esg_indicators(reporting_year);

-- ESG suppliers
CREATE INDEX IF NOT EXISTS idx_esg_supp_org ON esg_suppliers(organization_id);
CREATE INDEX IF NOT EXISTS idx_esg_supp_country ON esg_suppliers(country_code) WHERE country_code IS NOT NULL;

-- ESG supplier emissions
CREATE INDEX IF NOT EXISTS idx_esg_emis_supplier ON esg_supplier_emissions(supplier_id);
CREATE INDEX IF NOT EXISTS idx_esg_emis_org ON esg_supplier_emissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_esg_emis_year ON esg_supplier_emissions(reporting_year);

-- ESG scenarios
CREATE INDEX IF NOT EXISTS idx_esg_scen_org ON esg_scenarios(organization_id);
CREATE INDEX IF NOT EXISTS idx_esg_scen_status ON esg_scenarios(status);

-- Audit logs
CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_logs(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

-- ESG audit logs
CREATE INDEX IF NOT EXISTS idx_esg_audit_org ON esg_audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_esg_audit_created ON esg_audit_logs(created_at DESC);

-- Verification workflow stages
CREATE INDEX IF NOT EXISTS idx_workflow_report ON verification_workflow_stages(report_id);
CREATE INDEX IF NOT EXISTS idx_workflow_status ON verification_workflow_stages(status);

-- Verification scores
CREATE INDEX IF NOT EXISTS idx_scores_report ON verification_scores(report_id);

-- Project certifications
CREATE INDEX IF NOT EXISTS idx_cert_report ON project_certifications(report_id);
CREATE INDEX IF NOT EXISTS idx_cert_status ON project_certifications(status);

-- Forum posts
CREATE INDEX IF NOT EXISTS idx_forum_author ON forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_category ON forum_posts(category);
CREATE INDEX IF NOT EXISTS idx_forum_created ON forum_posts(created_at DESC);

-- Forum post likes
CREATE INDEX IF NOT EXISTS idx_forum_likes_post ON forum_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_likes_user ON forum_post_likes(user_id);

-- Government projects
CREATE INDEX IF NOT EXISTS idx_gov_proj_gov ON government_projects(government_id);
CREATE INDEX IF NOT EXISTS idx_gov_proj_area ON government_projects(admin_area_id) WHERE admin_area_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gov_proj_status ON government_projects(status);

-- Covering indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_reports_list_covering ON reports(submitted_at DESC, project_status) INCLUDE (title, sdg_goal, country_code);
CREATE INDEX IF NOT EXISTS idx_campaigns_list_covering ON fundraising_campaigns(created_at DESC, status) INCLUDE (title, target_amount, raised_amount);

COMMENT ON INDEX idx_reports_list_covering IS 'Covering index for reports list queries - includes frequently selected columns';
COMMENT ON INDEX idx_campaigns_list_covering IS 'Covering index for campaigns list queries - includes frequently selected columns';