
-- ============================================
-- LAYER 1+2: AI Platform Foundation Tables
-- ============================================

-- Country Intelligence Registry (CIR) - 54 African countries
CREATE TABLE public.country_intelligence (
  country_code TEXT PRIMARY KEY,
  country_name TEXT NOT NULL,
  iso2_code TEXT NOT NULL UNIQUE,
  official_languages JSONB NOT NULL DEFAULT '["en"]',
  currency_code TEXT NOT NULL DEFAULT 'USD',
  legal_system_type TEXT DEFAULT 'civil',
  esg_regulatory_status TEXT DEFAULT 'emerging' CHECK (esg_regulatory_status IN ('none', 'emerging', 'developing', 'established', 'advanced')),
  climate_disclosure_status TEXT DEFAULT 'none' CHECK (climate_disclosure_status IN ('none', 'voluntary', 'partial_mandatory', 'mandatory')),
  carbon_market_maturity TEXT DEFAULT 'none' CHECK (carbon_market_maturity IN ('none', 'pilot', 'developing', 'operational')),
  ngo_regulation_score INTEGER DEFAULT 3 CHECK (ngo_regulation_score BETWEEN 1 AND 10),
  enforcement_intensity_index INTEGER DEFAULT 3 CHECK (enforcement_intensity_index BETWEEN 1 AND 10),
  digital_reporting_maturity TEXT DEFAULT 'low' CHECK (digital_reporting_maturity IN ('low', 'medium', 'high')),
  regional_blocs JSONB DEFAULT '[]',
  stock_exchange_name TEXT,
  central_bank_name TEXT,
  environmental_agency_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.country_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Country intelligence is viewable by everyone"
  ON public.country_intelligence FOR SELECT USING (true);

CREATE POLICY "Only admins can manage country intelligence"
  ON public.country_intelligence FOR ALL
  USING (has_role(auth.uid(), 'platform_admin') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'platform_admin') OR has_role(auth.uid(), 'admin'));

-- Regulatory Frameworks Registry
CREATE TABLE public.regulatory_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL REFERENCES public.country_intelligence(country_code),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('esg', 'climate', 'carbon', 'financial', 'governance', 'labor', 'health', 'ngo', 'procurement', 'tax', 'foreign_funding')),
  regulator_name TEXT,
  mandatory BOOLEAN NOT NULL DEFAULT false,
  applicable_entity_types JSONB NOT NULL DEFAULT '["legal_entity"]',
  reporting_frequency TEXT DEFAULT 'annual' CHECK (reporting_frequency IN ('monthly', 'quarterly', 'semi_annual', 'annual', 'event_based')),
  effective_date DATE,
  rule_tree JSONB DEFAULT '{}',
  enforcement_risk TEXT DEFAULT 'medium' CHECK (enforcement_risk IN ('low', 'medium', 'high', 'critical')),
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'superseded', 'archived')),
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.regulatory_frameworks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Frameworks are viewable by everyone"
  ON public.regulatory_frameworks FOR SELECT USING (true);

CREATE POLICY "Only admins can manage frameworks"
  ON public.regulatory_frameworks FOR ALL
  USING (has_role(auth.uid(), 'platform_admin') OR has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'platform_admin') OR has_role(auth.uid(), 'admin'));

-- Regulatory Exposure Profiles (REM)
CREATE TABLE public.regulatory_exposure_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('citizen', 'ngo', 'corporate', 'government', 'changemaker', 'donor')),
  user_id UUID NOT NULL,
  country_code TEXT NOT NULL REFERENCES public.country_intelligence(country_code),
  sector_code TEXT,
  exposure_categories JSONB NOT NULL DEFAULT '{}',
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  mandatory_frameworks JSONB DEFAULT '[]',
  voluntary_frameworks JSONB DEFAULT '[]',
  compliance_score INTEGER DEFAULT 0 CHECK (compliance_score BETWEEN 0 AND 100),
  reporting_frequency TEXT DEFAULT 'annual',
  last_assessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.regulatory_exposure_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exposure profiles"
  ON public.regulatory_exposure_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own exposure profiles"
  ON public.regulatory_exposure_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all exposure profiles"
  ON public.regulatory_exposure_profiles FOR SELECT
  USING (has_role(auth.uid(), 'platform_admin') OR has_role(auth.uid(), 'admin'));

-- AI Copilot Conversations
CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  context_type TEXT NOT NULL DEFAULT 'general' CHECK (context_type IN ('general', 'compliance', 'reporting', 'gap_analysis', 'scenario', 'carbon')),
  context_id UUID,
  title TEXT,
  messages JSONB NOT NULL DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own AI conversations"
  ON public.ai_conversations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- PROJECT MANAGEMENT MODULE
-- ============================================

-- Project Tasks
CREATE TABLE public.project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES public.project_tasks(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'blocked')),
  start_date DATE,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  estimated_hours NUMERIC,
  actual_hours NUMERIC,
  tags JSONB DEFAULT '[]',
  sort_order INTEGER DEFAULT 0,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project task access via affiliation"
  ON public.project_tasks FOR SELECT
  USING (
    report_id IN (SELECT r.id FROM reports r WHERE r.user_id = auth.uid())
    OR is_affiliated_with_report(auth.uid(), report_id)
  );

CREATE POLICY "Affiliated users can create tasks"
  ON public.project_tasks FOR INSERT
  WITH CHECK (
    report_id IN (SELECT r.id FROM reports r WHERE r.user_id = auth.uid())
    OR is_affiliated_with_report(auth.uid(), report_id)
  );

CREATE POLICY "Task assignees and owners can update"
  ON public.project_tasks FOR UPDATE
  USING (
    assigned_to = auth.uid()
    OR created_by = auth.uid()
    OR report_id IN (SELECT r.id FROM reports r WHERE r.user_id = auth.uid())
  );

CREATE POLICY "Project owners can delete tasks"
  ON public.project_tasks FOR DELETE
  USING (
    report_id IN (SELECT r.id FROM reports r WHERE r.user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all tasks"
  ON public.project_tasks FOR ALL
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'platform_admin'));

-- Task Dependencies
CREATE TABLE public.task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  depends_on_task_id UUID NOT NULL REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL DEFAULT 'finish_to_start' CHECK (dependency_type IN ('finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(task_id, depends_on_task_id),
  CHECK (task_id != depends_on_task_id)
);

ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Task dependency access follows task access"
  ON public.task_dependencies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_tasks pt
      WHERE pt.id = task_dependencies.task_id
      AND (
        pt.report_id IN (SELECT r.id FROM reports r WHERE r.user_id = auth.uid())
        OR is_affiliated_with_report(auth.uid(), pt.report_id)
      )
    )
  );

CREATE POLICY "Task dependency management follows task access"
  ON public.task_dependencies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM project_tasks pt
      WHERE pt.id = task_dependencies.task_id
      AND (
        pt.report_id IN (SELECT r.id FROM reports r WHERE r.user_id = auth.uid())
        OR is_affiliated_with_report(auth.uid(), pt.report_id)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_tasks pt
      WHERE pt.id = task_dependencies.task_id
      AND (
        pt.report_id IN (SELECT r.id FROM reports r WHERE r.user_id = auth.uid())
        OR is_affiliated_with_report(auth.uid(), pt.report_id)
      )
    )
  );

-- Task Comments/Activity Log
CREATE TABLE public.task_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL DEFAULT 'comment' CHECK (activity_type IN ('comment', 'status_change', 'assignment', 'priority_change', 'update')),
  content TEXT,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.task_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Task activity access follows task access"
  ON public.task_activity FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_tasks pt
      WHERE pt.id = task_activity.task_id
      AND (
        pt.report_id IN (SELECT r.id FROM reports r WHERE r.user_id = auth.uid())
        OR is_affiliated_with_report(auth.uid(), pt.report_id)
      )
    )
  );

CREATE POLICY "Authenticated users can add activity"
  ON public.task_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_project_tasks_report ON public.project_tasks(report_id);
CREATE INDEX idx_project_tasks_assigned ON public.project_tasks(assigned_to);
CREATE INDEX idx_project_tasks_status ON public.project_tasks(status);
CREATE INDEX idx_task_activity_task ON public.task_activity(task_id);
CREATE INDEX idx_regulatory_frameworks_country ON public.regulatory_frameworks(country_code);
CREATE INDEX idx_regulatory_exposure_user ON public.regulatory_exposure_profiles(user_id);
CREATE INDEX idx_ai_conversations_user ON public.ai_conversations(user_id);
