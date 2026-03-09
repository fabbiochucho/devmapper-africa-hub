-- Fix remaining unindexed foreign keys identified by Performance Advisor
-- These foreign keys don't have covering indexes, causing suboptimal query performance

-- Admin areas: parent_id for hierarchical lookups
CREATE INDEX IF NOT EXISTS idx_admin_areas_parent ON admin_areas(parent_id) WHERE parent_id IS NOT NULL;

-- Certification applications: organization_id
CREATE INDEX IF NOT EXISTS idx_cert_apps_organization ON certification_applications(organization_id) WHERE organization_id IS NOT NULL;

-- ESG audit logs: user_id for user activity tracking
CREATE INDEX IF NOT EXISTS idx_esg_audit_user ON esg_audit_logs(user_id) WHERE user_id IS NOT NULL;

-- ESG indicators: created_by for creator lookups
CREATE INDEX IF NOT EXISTS idx_esg_ind_creator ON esg_indicators(created_by) WHERE created_by IS NOT NULL;

-- ESG scenarios: created_by for creator lookups
CREATE INDEX IF NOT EXISTS idx_esg_scen_creator ON esg_scenarios(created_by) WHERE created_by IS NOT NULL;

-- Project certifications: score_id linking to verification scores
CREATE INDEX IF NOT EXISTS idx_cert_score ON project_certifications(score_id) WHERE score_id IS NOT NULL;

-- Project tasks: parent_task_id for task hierarchies
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON project_tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;

-- Regulatory exposure profiles: country_code (if table exists)
CREATE INDEX IF NOT EXISTS idx_reg_profiles_country ON regulatory_exposure_profiles(country_code) WHERE country_code IS NOT NULL;

-- User roles: granted_by for tracking who granted the role
CREATE INDEX IF NOT EXISTS idx_user_roles_granter ON user_roles(granted_by) WHERE granted_by IS NOT NULL;

-- Verification logs: report_id and user_id (if table exists)
CREATE INDEX IF NOT EXISTS idx_verif_logs_report ON verification_logs(report_id);
CREATE INDEX IF NOT EXISTS idx_verif_logs_user ON verification_logs(user_id);

COMMENT ON INDEX idx_admin_areas_parent IS 'FK index for hierarchical admin area lookups';
COMMENT ON INDEX idx_cert_apps_organization IS 'FK index for certification applications by organization';
COMMENT ON INDEX idx_tasks_parent IS 'FK index for parent-child task relationships';
COMMENT ON INDEX idx_user_roles_granter IS 'FK index for tracking role assignment audit trail';