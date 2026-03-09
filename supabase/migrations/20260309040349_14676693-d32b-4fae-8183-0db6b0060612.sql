-- Procurement/contractor tracking table
CREATE TABLE IF NOT EXISTS public.project_procurement (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  contractor_name TEXT NOT NULL,
  contract_type TEXT NOT NULL DEFAULT 'goods',
  contract_value NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'tendering',
  procurement_method TEXT NOT NULL DEFAULT 'open_tender',
  scope TEXT,
  evidence_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_procurement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliated users can view procurement"
  ON public.project_procurement FOR SELECT
  USING (
    auth.uid() = created_by
    OR public.is_affiliated_with_report(auth.uid(), report_id)
    OR EXISTS (SELECT 1 FROM public.reports WHERE id = report_id AND visibility = 'public')
  );

CREATE POLICY "Project owners can manage procurement"
  ON public.project_procurement FOR ALL
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE TRIGGER update_procurement_updated_at
  BEFORE UPDATE ON public.project_procurement
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DISM impact scores persistence table
CREATE TABLE IF NOT EXISTS public.project_dism_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL UNIQUE REFERENCES public.reports(id) ON DELETE CASCADE,
  sdg_alignment NUMERIC NOT NULL DEFAULT 0,
  impact_scale NUMERIC NOT NULL DEFAULT 0,
  impact_depth NUMERIC NOT NULL DEFAULT 0,
  outcome_effectiveness NUMERIC NOT NULL DEFAULT 0,
  sustainability NUMERIC NOT NULL DEFAULT 0,
  evidence_verification NUMERIC NOT NULL DEFAULT 0,
  governance_ethics NUMERIC NOT NULL DEFAULT 0,
  innovation_replicability NUMERIC NOT NULL DEFAULT 0,
  total_score NUMERIC GENERATED ALWAYS AS (
    sdg_alignment + impact_scale + impact_depth + outcome_effectiveness +
    sustainability + evidence_verification + governance_ethics + innovation_replicability
  ) STORED,
  scored_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.project_dism_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view DISM scores for public projects"
  ON public.project_dism_scores FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.reports WHERE id = report_id AND visibility = 'public')
    OR auth.uid() = scored_by
    OR public.is_affiliated_with_report(auth.uid(), report_id)
  );

CREATE POLICY "Affiliated users can upsert DISM scores"
  ON public.project_dism_scores FOR INSERT
  WITH CHECK (
    auth.uid() = scored_by
    AND public.is_affiliated_with_report(auth.uid(), report_id)
  );

CREATE POLICY "Score owners can update their scores"
  ON public.project_dism_scores FOR UPDATE
  USING (auth.uid() = scored_by);

CREATE TRIGGER update_dism_scores_updated_at
  BEFORE UPDATE ON public.project_dism_scores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_procurement_report_id ON public.project_procurement(report_id);
CREATE INDEX idx_dism_scores_report_id ON public.project_dism_scores(report_id);