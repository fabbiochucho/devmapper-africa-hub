
-- SPVF: Evidence Items table for structured evidence tracking
CREATE TABLE public.evidence_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL CHECK (evidence_type IN ('photo', 'document', 'satellite', 'financial', 'survey', 'testimonial', 'inspection')),
  file_url TEXT,
  title TEXT NOT NULL,
  description TEXT,
  uploaded_by UUID NOT NULL,
  verification_stage TEXT CHECK (verification_stage IN ('registration', 'baseline', 'design', 'implementation', 'output', 'outcome', 'impact')),
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.evidence_items ENABLE ROW LEVEL SECURITY;

-- Anyone can view evidence for transparency
CREATE POLICY "Evidence items are viewable by everyone"
  ON public.evidence_items FOR SELECT
  USING (true);

-- Report owners and affiliates can add evidence
CREATE POLICY "Report owners and affiliates can add evidence"
  ON public.evidence_items FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by
    AND (
      report_id IN (SELECT id FROM reports WHERE user_id = auth.uid())
      OR is_affiliated_with_report(auth.uid(), report_id)
    )
  );

-- Uploaders can update their evidence
CREATE POLICY "Uploaders can update their evidence"
  ON public.evidence_items FOR UPDATE
  USING (auth.uid() = uploaded_by);

-- Report owners can delete evidence
CREATE POLICY "Report owners can delete evidence"
  ON public.evidence_items FOR DELETE
  USING (report_id IN (SELECT id FROM reports WHERE user_id = auth.uid()));

-- SPVF: Verification Scores table for SIS (SDG Impact Score)
CREATE TABLE public.verification_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  sdg_alignment_score NUMERIC DEFAULT 0 CHECK (sdg_alignment_score >= 0 AND sdg_alignment_score <= 100),
  evidence_strength_score NUMERIC DEFAULT 0 CHECK (evidence_strength_score >= 0 AND evidence_strength_score <= 100),
  implementation_integrity_score NUMERIC DEFAULT 0 CHECK (implementation_integrity_score >= 0 AND implementation_integrity_score <= 100),
  output_delivery_score NUMERIC DEFAULT 0 CHECK (output_delivery_score >= 0 AND output_delivery_score <= 100),
  outcome_achievement_score NUMERIC DEFAULT 0 CHECK (outcome_achievement_score >= 0 AND outcome_achievement_score <= 100),
  sustainability_score NUMERIC DEFAULT 0 CHECK (sustainability_score >= 0 AND sustainability_score <= 100),
  community_validation_score NUMERIC DEFAULT 0 CHECK (community_validation_score >= 0 AND community_validation_score <= 100),
  total_sis NUMERIC GENERATED ALWAYS AS (
    (sdg_alignment_score * 0.15)
    + (evidence_strength_score * 0.20)
    + (implementation_integrity_score * 0.15)
    + (output_delivery_score * 0.15)
    + (outcome_achievement_score * 0.20)
    + (sustainability_score * 0.10)
    + (community_validation_score * 0.05)
  ) STORED,
  certification_rating TEXT GENERATED ALWAYS AS (
    CASE
      WHEN (sdg_alignment_score * 0.15 + evidence_strength_score * 0.20 + implementation_integrity_score * 0.15 + output_delivery_score * 0.15 + outcome_achievement_score * 0.20 + sustainability_score * 0.10 + community_validation_score * 0.05) >= 90 THEN 'platinum'
      WHEN (sdg_alignment_score * 0.15 + evidence_strength_score * 0.20 + implementation_integrity_score * 0.15 + output_delivery_score * 0.15 + outcome_achievement_score * 0.20 + sustainability_score * 0.10 + community_validation_score * 0.05) >= 80 THEN 'gold'
      WHEN (sdg_alignment_score * 0.15 + evidence_strength_score * 0.20 + implementation_integrity_score * 0.15 + output_delivery_score * 0.15 + outcome_achievement_score * 0.20 + sustainability_score * 0.10 + community_validation_score * 0.05) >= 70 THEN 'silver'
      WHEN (sdg_alignment_score * 0.15 + evidence_strength_score * 0.20 + implementation_integrity_score * 0.15 + output_delivery_score * 0.15 + outcome_achievement_score * 0.20 + sustainability_score * 0.10 + community_validation_score * 0.05) >= 60 THEN 'bronze'
      ELSE 'unverified'
    END
  ) STORED,
  scored_by UUID,
  scored_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(report_id)
);

ALTER TABLE public.verification_scores ENABLE ROW LEVEL SECURITY;

-- Scores are publicly viewable for transparency
CREATE POLICY "Verification scores are viewable by everyone"
  ON public.verification_scores FOR SELECT
  USING (true);

-- Verifiers and admins can insert/update scores
CREATE POLICY "Verifiers can manage scores"
  ON public.verification_scores FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'platform_admin'::app_role)
    OR auth.uid() = scored_by
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'platform_admin'::app_role)
    OR auth.uid() = scored_by
  );

-- SPVF: Project Certifications table
CREATE TABLE public.project_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  score_id UUID REFERENCES public.verification_scores(id),
  rating TEXT NOT NULL CHECK (rating IN ('platinum', 'gold', 'silver', 'bronze', 'unverified')),
  certificate_number TEXT UNIQUE,
  certified_by UUID,
  certified_by_name TEXT,
  certification_body TEXT,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_certifications ENABLE ROW LEVEL SECURITY;

-- Certifications are publicly viewable
CREATE POLICY "Certifications are viewable by everyone"
  ON public.project_certifications FOR SELECT
  USING (true);

-- Only admins can issue certifications
CREATE POLICY "Only admins can manage certifications"
  ON public.project_certifications FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'platform_admin'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'platform_admin'::app_role)
  );

-- SPVF: Verification Workflow Stages tracking
CREATE TABLE public.verification_workflow_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('registration', 'baseline', 'design', 'implementation', 'output', 'outcome', 'impact')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  assigned_verifier UUID,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(report_id, stage)
);

ALTER TABLE public.verification_workflow_stages ENABLE ROW LEVEL SECURITY;

-- Workflow stages are publicly viewable
CREATE POLICY "Workflow stages are viewable by everyone"
  ON public.verification_workflow_stages FOR SELECT
  USING (true);

-- Report owners, verifiers, and admins can manage stages
CREATE POLICY "Authorized users can manage workflow stages"
  ON public.verification_workflow_stages FOR ALL
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'platform_admin'::app_role)
    OR auth.uid() = assigned_verifier
    OR report_id IN (SELECT id FROM reports WHERE user_id = auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'platform_admin'::app_role)
    OR auth.uid() = assigned_verifier
    OR report_id IN (SELECT id FROM reports WHERE user_id = auth.uid())
  );

-- Function to auto-initialize 7-stage workflow on project creation
CREATE OR REPLACE FUNCTION public.initialize_verification_workflow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.verification_workflow_stages (report_id, stage, status)
  VALUES
    (NEW.id, 'registration', 'completed'),
    (NEW.id, 'baseline', 'pending'),
    (NEW.id, 'design', 'pending'),
    (NEW.id, 'implementation', 'pending'),
    (NEW.id, 'output', 'pending'),
    (NEW.id, 'outcome', 'pending'),
    (NEW.id, 'impact', 'pending');
  
  -- Initialize verification score record
  INSERT INTO public.verification_scores (report_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_report_created_init_workflow
  AFTER INSERT ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_verification_workflow();
