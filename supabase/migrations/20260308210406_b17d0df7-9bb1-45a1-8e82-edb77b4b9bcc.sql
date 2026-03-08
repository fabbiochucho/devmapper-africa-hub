
-- Project progress updates table
CREATE TABLE public.project_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  update_text text NOT NULL,
  progress_percent integer DEFAULT 0,
  evidence_url text,
  photos jsonb DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Multi-level verification table
CREATE TABLE public.project_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  verifier_id uuid NOT NULL,
  verification_level text NOT NULL DEFAULT 'self_report',
  status text NOT NULL DEFAULT 'pending',
  comments text,
  evidence_url text,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Budget tracking table
CREATE TABLE public.project_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  budget_allocated numeric DEFAULT 0,
  budget_spent numeric DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  funding_source text,
  donor_organization text,
  transparency_score integer DEFAULT 0,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Impact indicators table
CREATE TABLE public.project_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  indicator_name text NOT NULL,
  baseline_value numeric DEFAULT 0,
  current_value numeric DEFAULT 0,
  target_value numeric,
  unit text,
  sdg_goal integer,
  agenda2063_aspiration text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_project_updates_report ON public.project_updates(report_id);
CREATE INDEX idx_project_verifications_report ON public.project_verifications(report_id);
CREATE INDEX idx_project_budgets_report ON public.project_budgets(report_id);
CREATE INDEX idx_project_indicators_report ON public.project_indicators(report_id);

-- RLS
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_indicators ENABLE ROW LEVEL SECURITY;

-- project_updates policies
CREATE POLICY "Anyone can view updates on public reports" ON public.project_updates FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create updates" ON public.project_updates FOR INSERT WITH CHECK (
  auth.uid() = created_by AND (
    report_id IN (SELECT id FROM reports WHERE user_id = auth.uid())
    OR public.is_affiliated_with_report(auth.uid(), report_id)
  )
);
CREATE POLICY "Update owners can edit their updates" ON public.project_updates FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Report owners can delete updates" ON public.project_updates FOR DELETE USING (
  report_id IN (SELECT id FROM reports WHERE user_id = auth.uid())
);

-- project_verifications policies
CREATE POLICY "Anyone can view verifications" ON public.project_verifications FOR SELECT USING (true);
CREATE POLICY "Authenticated users can submit verifications" ON public.project_verifications FOR INSERT WITH CHECK (auth.uid() = verifier_id);
CREATE POLICY "Verifiers can update their own verifications" ON public.project_verifications FOR UPDATE USING (auth.uid() = verifier_id);

-- project_budgets policies
CREATE POLICY "Anyone can view budgets of public reports" ON public.project_budgets FOR SELECT USING (true);
CREATE POLICY "Report owners and affiliates can manage budgets" ON public.project_budgets FOR INSERT WITH CHECK (
  auth.uid() = created_by AND (
    report_id IN (SELECT id FROM reports WHERE user_id = auth.uid())
    OR public.is_affiliated_with_report(auth.uid(), report_id)
  )
);
CREATE POLICY "Budget creators can update" ON public.project_budgets FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Report owners can delete budgets" ON public.project_budgets FOR DELETE USING (
  report_id IN (SELECT id FROM reports WHERE user_id = auth.uid())
);

-- project_indicators policies
CREATE POLICY "Anyone can view indicators" ON public.project_indicators FOR SELECT USING (true);
CREATE POLICY "Report owners and affiliates can manage indicators" ON public.project_indicators FOR INSERT WITH CHECK (
  auth.uid() = created_by AND (
    report_id IN (SELECT id FROM reports WHERE user_id = auth.uid())
    OR public.is_affiliated_with_report(auth.uid(), report_id)
  )
);
CREATE POLICY "Indicator creators can update" ON public.project_indicators FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Report owners can delete indicators" ON public.project_indicators FOR DELETE USING (
  report_id IN (SELECT id FROM reports WHERE user_id = auth.uid())
);
