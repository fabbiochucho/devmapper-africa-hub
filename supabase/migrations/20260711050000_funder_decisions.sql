-- #114: Funder Dashboard showed funding-readiness scores and risk flags
-- with no action a funder could actually take on a project. Adds a small
-- table recording each funder's own decision per project (interested/passed,
-- with an optional committed amount) - a personal expression of intent, kept
-- separate from fundraising_campaigns (a shared, project-wide total) so one
-- funder's decision never mutates another stakeholder's shared record.
CREATE TABLE public.funder_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funder_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('interested', 'passed')),
  amount_committed NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (funder_id, report_id)
);

ALTER TABLE public.funder_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Funders manage their own decisions"
ON public.funder_decisions FOR ALL
USING (funder_id = (SELECT auth.uid()))
WITH CHECK (funder_id = (SELECT auth.uid()));

-- Report owners can see funders' interest in their own project (but not
-- edit it) - reciprocal visibility is the whole point of a "decision" a
-- funder makes on someone else's project.
CREATE POLICY "Report owners can view decisions on their own reports"
ON public.funder_decisions FOR SELECT
USING (
  report_id IN (SELECT id FROM public.reports WHERE user_id = (SELECT auth.uid()))
);

CREATE POLICY "Admins can view all funder decisions"
ON public.funder_decisions FOR SELECT
USING (
  has_role((SELECT auth.uid()), 'admin'::app_role)
  OR has_role((SELECT auth.uid()), 'platform_admin'::app_role)
);
