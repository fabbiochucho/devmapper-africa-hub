
-- Add missing columns to reports table for full project data
ALTER TABLE public.reports 
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS sponsor text,
  ADD COLUMN IF NOT EXISTS funder text,
  ADD COLUMN IF NOT EXISTS contractor text,
  ADD COLUMN IF NOT EXISTS cost_currency text DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS usd_exchange_rate numeric;

-- Create project_affiliations table
CREATE TABLE public.project_affiliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  relationship_type text NOT NULL,
  organization_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, user_id, relationship_type)
);

ALTER TABLE public.project_affiliations ENABLE ROW LEVEL SECURITY;

-- Security definer function to check affiliation
CREATE OR REPLACE FUNCTION public.is_affiliated_with_report(_user_id uuid, _report_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_affiliations
    WHERE user_id = _user_id AND report_id = _report_id
  )
$$;

-- RLS policies for project_affiliations
CREATE POLICY "Users can view their own affiliations"
  ON public.project_affiliations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Report owners can view affiliations on their reports"
  ON public.project_affiliations FOR SELECT
  USING (report_id IN (SELECT id FROM public.reports WHERE user_id = auth.uid()));

CREATE POLICY "Authenticated users can create affiliations"
  ON public.project_affiliations FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      report_id IN (SELECT id FROM public.reports WHERE user_id = auth.uid())
      OR auth.uid() = user_id
    )
  );

CREATE POLICY "Report owners can update affiliations"
  ON public.project_affiliations FOR UPDATE
  USING (report_id IN (SELECT id FROM public.reports WHERE user_id = auth.uid()));

CREATE POLICY "Report owners can delete affiliations"
  ON public.project_affiliations FOR DELETE
  USING (report_id IN (SELECT id FROM public.reports WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all affiliations"
  ON public.project_affiliations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role));

-- Create project_milestones table
CREATE TABLE public.project_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  target_date date,
  completion_percentage integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  evidence_url text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_milestones
CREATE POLICY "Anyone can view milestones of public reports"
  ON public.project_milestones FOR SELECT
  USING (true);

CREATE POLICY "Report owners and affiliates can insert milestones"
  ON public.project_milestones FOR INSERT
  WITH CHECK (
    report_id IN (SELECT id FROM public.reports WHERE user_id = auth.uid())
    OR public.is_affiliated_with_report(auth.uid(), report_id)
  );

CREATE POLICY "Report owners and affiliates can update milestones"
  ON public.project_milestones FOR UPDATE
  USING (
    report_id IN (SELECT id FROM public.reports WHERE user_id = auth.uid())
    OR public.is_affiliated_with_report(auth.uid(), report_id)
  );

CREATE POLICY "Report owners can delete milestones"
  ON public.project_milestones FOR DELETE
  USING (
    report_id IN (SELECT id FROM public.reports WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all milestones"
  ON public.project_milestones FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role));

-- Trigger for updated_at on milestones
CREATE TRIGGER update_project_milestones_updated_at
  BEFORE UPDATE ON public.project_milestones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
