
-- Citizen project feedback table for crowdsourced accountability
CREATE TABLE public.citizen_project_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  feedback_type TEXT NOT NULL DEFAULT 'progress_confirmation',
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  photo_url TEXT,
  progress_estimate INTEGER CHECK (progress_estimate >= 0 AND progress_estimate <= 100),
  is_issue_report BOOLEAN NOT NULL DEFAULT false,
  issue_severity TEXT CHECK (issue_severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.citizen_project_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can view feedback on public reports
CREATE POLICY "Anyone can view feedback" ON public.citizen_project_feedback
  FOR SELECT USING (true);

-- Authenticated users can submit feedback
CREATE POLICY "Authenticated users can submit feedback" ON public.citizen_project_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own feedback
CREATE POLICY "Users can update own feedback" ON public.citizen_project_feedback
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can manage all feedback
CREATE POLICY "Admins can manage feedback" ON public.citizen_project_feedback
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role));

CREATE INDEX idx_citizen_feedback_report ON public.citizen_project_feedback(report_id);
CREATE INDEX idx_citizen_feedback_type ON public.citizen_project_feedback(feedback_type);

-- Enrich organizations with PRD-V6 actor attributes
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS registration_id TEXT,
  ADD COLUMN IF NOT EXISTS incorporation_country TEXT,
  ADD COLUMN IF NOT EXISTS operating_countries TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sector_code TEXT,
  ADD COLUMN IF NOT EXISTS ownership_structure TEXT,
  ADD COLUMN IF NOT EXISTS revenue_band TEXT,
  ADD COLUMN IF NOT EXISTS compliance_tier TEXT DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS regulatory_exposure JSONB DEFAULT '{}';

-- Enrich profiles with PRD-V6 actor attributes
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS legal_capacity TEXT,
  ADD COLUMN IF NOT EXISTS regulatory_exposure JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sector_classification TEXT,
  ADD COLUMN IF NOT EXISTS verification_tier TEXT DEFAULT 'self_report',
  ADD COLUMN IF NOT EXISTS impact_area TEXT;
