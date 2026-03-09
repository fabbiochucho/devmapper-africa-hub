-- Performance indexes for high-traffic queries
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_project_status ON public.reports(project_status);
CREATE INDEX IF NOT EXISTS idx_reports_submitted_at ON public.reports(submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON public.forum_posts(category);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON public.forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_is_pinned ON public.forum_posts(is_pinned) WHERE is_pinned = true;

CREATE INDEX IF NOT EXISTS idx_project_affiliations_user_id ON public.project_affiliations(user_id);
CREATE INDEX IF NOT EXISTS idx_project_affiliations_report_id ON public.project_affiliations(report_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created ON public.analytics_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);

CREATE INDEX IF NOT EXISTS idx_verification_logs_user_id ON public.verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_report_id ON public.verification_logs(report_id);

CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation_created ON public.direct_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_broadcasts_created_at ON public.admin_broadcasts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_change_makers_is_verified ON public.change_makers(is_verified);
CREATE INDEX IF NOT EXISTS idx_change_makers_user_id ON public.change_makers(user_id);

CREATE INDEX IF NOT EXISTS idx_esg_indicators_org_year ON public.esg_indicators(organization_id, reporting_year);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_active ON public.user_roles(user_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_fundraising_campaigns_status ON public.fundraising_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_fundraising_campaigns_created_at ON public.fundraising_campaigns(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_created ON public.audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created ON public.audit_logs(org_id, created_at DESC);