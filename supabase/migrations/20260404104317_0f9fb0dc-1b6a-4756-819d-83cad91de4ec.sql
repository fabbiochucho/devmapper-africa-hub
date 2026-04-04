-- Reporting frameworks and indicators
CREATE TABLE IF NOT EXISTS reporting_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  version TEXT,
  category TEXT,
  is_mandatory BOOLEAN DEFAULT FALSE,
  applicable_regions TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS framework_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID REFERENCES reporting_frameworks(id),
  indicator_code TEXT NOT NULL,
  indicator_name TEXT NOT NULL,
  description TEXT,
  unit_of_measure TEXT,
  sdg_alignment INT[],
  metric_key TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reporting_frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE framework_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read frameworks" ON reporting_frameworks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Public read indicators" ON framework_indicators FOR SELECT TO authenticated USING (true);

-- AI Multi-Agent tables
CREATE TABLE IF NOT EXISTS ai_agent_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_type TEXT NOT NULL,
  intent TEXT,
  agents_invoked TEXT[],
  synthesis_output JSONB,
  confidence_score NUMERIC,
  approved_by_user BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_agent_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES ai_agent_sessions(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  agent_version TEXT DEFAULT '1.0',
  raw_output TEXT,
  structured_output JSONB,
  confidence_score NUMERIC,
  data_sources TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  session_id UUID REFERENCES ai_agent_sessions(id),
  agent_name TEXT,
  action TEXT,
  input_summary TEXT,
  output_summary TEXT,
  rule_engine_result JSONB,
  human_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sessions" ON ai_agent_sessions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins view all sessions" ON ai_agent_sessions FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Users view own outputs" ON ai_agent_outputs FOR SELECT TO authenticated
  USING (session_id IN (SELECT id FROM ai_agent_sessions WHERE user_id = auth.uid()));

CREATE POLICY "Service role inserts outputs" ON ai_agent_outputs FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins view all outputs" ON ai_agent_outputs FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Users view own audit log" ON ai_audit_log FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role inserts audit" ON ai_audit_log FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins view all audit" ON ai_audit_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'platform_admin'));