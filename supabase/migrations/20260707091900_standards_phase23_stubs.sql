-- Standards Engine Phase 2/3 scaffolding (PRD Appendix). Intentionally thin
-- per explicit scope: schema + a UI stub wired end-to-end so the data model
-- gets exercised, not deep methodology logic. Lowest priority of this pass.

CREATE TABLE public.sbti_pathways (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sector TEXT NOT NULL,
  target_type TEXT,
  baseline_year INTEGER,
  target_year INTEGER,
  pathway_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.verra_methodology_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_type TEXT NOT NULL,
  methodology_code TEXT NOT NULL,
  description TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.cdp_questionnaire_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  question_code TEXT NOT NULL,
  response JSONB DEFAULT '{}',
  auto_filled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.glec_transport_factors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.lca_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.gpc_city_inventories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- verra_methodology_mappings is a public reference registry (like
-- emission_factors), not org-scoped - readable by anyone authenticated.
ALTER TABLE public.verra_methodology_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read verra methodology mappings"
ON public.verra_methodology_mappings FOR SELECT TO authenticated USING (true);

-- The remaining tables are org-scoped, matching the existing esg_* RLS
-- convention (owner or member can read/write).
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['sbti_pathways', 'cdp_questionnaire_responses', 'glec_transport_factors', 'lca_assessments', 'gpc_city_inventories']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY "Org members can manage %1$s" ON public.%1$I FOR ALL TO authenticated
       USING (
         organization_id IN (SELECT id FROM public.organizations WHERE created_by = (SELECT auth.uid()))
         OR organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid()))
       )
       WITH CHECK (
         organization_id IN (SELECT id FROM public.organizations WHERE created_by = (SELECT auth.uid()))
       )', t
    );
  END LOOP;
END $$;
