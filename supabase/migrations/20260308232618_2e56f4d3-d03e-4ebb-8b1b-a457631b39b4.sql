
-- Certification application requests table
CREATE TABLE public.certification_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL,
  organization_id uuid REFERENCES public.organizations(id),
  requested_tier text NOT NULL DEFAULT 'bronze' CHECK (requested_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'evidence_collection', 'ai_verification', 'human_verification', 'scoring', 'governance_review', 'approved', 'rejected', 'withdrawn')),
  project_description text,
  expected_outcomes text,
  budget_usd numeric,
  geographic_scope text,
  sdg_goals integer[] NOT NULL DEFAULT '{}',
  evidence_summary text,
  reviewer_notes text,
  reviewed_by uuid,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(report_id)
);

ALTER TABLE public.certification_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own certification applications"
  ON public.certification_applications FOR SELECT
  USING (auth.uid() = applicant_id);

CREATE POLICY "Admins can view all certification applications"
  ON public.certification_applications FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "Users can submit certification applications"
  ON public.certification_applications FOR INSERT
  WITH CHECK (auth.uid() = applicant_id AND report_id IN (SELECT id FROM reports WHERE user_id = auth.uid()));

CREATE POLICY "Admins can update certification applications"
  ON public.certification_applications FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role));

CREATE POLICY "Applicants can update own applications"
  ON public.certification_applications FOR UPDATE
  USING (auth.uid() = applicant_id);

-- Hash-chain verification ledger (blockchain alternative)
CREATE TABLE public.verification_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.reports(id),
  event_type text NOT NULL,
  actor_id uuid,
  payload jsonb NOT NULL DEFAULT '{}',
  prev_hash text,
  entry_hash text NOT NULL,
  sequence_number bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.verification_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verification ledger is viewable by everyone"
  ON public.verification_ledger FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can append to ledger"
  ON public.verification_ledger FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX idx_verification_ledger_report ON public.verification_ledger(report_id, sequence_number);
CREATE INDEX idx_verification_ledger_hash ON public.verification_ledger(entry_hash);

-- Trigger to auto-initialize workflow stages when certification application is submitted
CREATE OR REPLACE FUNCTION public.init_certification_workflow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stages text[] := ARRAY['registration', 'baseline_verification', 'design_validation', 'implementation_verification', 'output_verification', 'outcome_impact_verification', 'certification_rating'];
  s text;
BEGIN
  FOREACH s IN ARRAY stages LOOP
    INSERT INTO public.verification_workflow_stages (report_id, stage, status)
    VALUES (NEW.report_id, s, 'pending')
    ON CONFLICT DO NOTHING;
  END LOOP;

  INSERT INTO public.verification_scores (report_id)
  VALUES (NEW.report_id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_init_certification_workflow
  AFTER INSERT ON public.certification_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.init_certification_workflow();
