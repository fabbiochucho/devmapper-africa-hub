
CREATE TABLE public.standards_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  standard TEXT NOT NULL,
  frameworks TEXT[] DEFAULT '{}',
  confidence_score NUMERIC(3,2) DEFAULT 0.50 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  unit TEXT,
  methodology TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.standards_metadata ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_standards_metadata_org ON public.standards_metadata(organization_id);
CREATE INDEX idx_standards_metadata_entity ON public.standards_metadata(entity_type, entity_id);
CREATE INDEX idx_standards_metadata_standard ON public.standards_metadata(standard);

CREATE POLICY "Org members can view own standards metadata"
ON public.standards_metadata FOR SELECT TO authenticated
USING (organization_id IN (SELECT om.organization_id FROM organization_members om WHERE om.user_id = (SELECT auth.uid())));

CREATE POLICY "Org members can insert standards metadata"
ON public.standards_metadata FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT om.organization_id FROM organization_members om WHERE om.user_id = (SELECT auth.uid())));

CREATE POLICY "Org members can update own standards metadata"
ON public.standards_metadata FOR UPDATE TO authenticated
USING (organization_id IN (SELECT om.organization_id FROM organization_members om WHERE om.user_id = (SELECT auth.uid())));

CREATE POLICY "Org members can delete own standards metadata"
ON public.standards_metadata FOR DELETE TO authenticated
USING (organization_id IN (SELECT om.organization_id FROM organization_members om WHERE om.user_id = (SELECT auth.uid())));

CREATE TABLE public.compliance_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  framework_code TEXT NOT NULL,
  score_percentage NUMERIC(5,2) DEFAULT 0 CHECK (score_percentage >= 0 AND score_percentage <= 100),
  total_indicators INTEGER DEFAULT 0,
  reported_indicators INTEGER DEFAULT 0,
  gaps JSONB DEFAULT '[]',
  assessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assessed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, framework_code)
);

ALTER TABLE public.compliance_scores ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_compliance_scores_org ON public.compliance_scores(organization_id);
CREATE INDEX idx_compliance_scores_framework ON public.compliance_scores(framework_code);

CREATE POLICY "Org members and admins can view compliance scores"
ON public.compliance_scores FOR SELECT TO authenticated
USING (
  organization_id IN (SELECT om.organization_id FROM organization_members om WHERE om.user_id = (SELECT auth.uid()))
  OR public.has_role((SELECT auth.uid()), 'admin'::app_role)
  OR public.has_role((SELECT auth.uid()), 'platform_admin'::app_role)
);

CREATE POLICY "Org members can insert compliance scores"
ON public.compliance_scores FOR INSERT TO authenticated
WITH CHECK (organization_id IN (SELECT om.organization_id FROM organization_members om WHERE om.user_id = (SELECT auth.uid())));

CREATE POLICY "Org members can update own compliance scores"
ON public.compliance_scores FOR UPDATE TO authenticated
USING (organization_id IN (SELECT om.organization_id FROM organization_members om WHERE om.user_id = (SELECT auth.uid())));

CREATE TRIGGER update_standards_metadata_updated_at
BEFORE UPDATE ON public.standards_metadata
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_scores_updated_at
BEFORE UPDATE ON public.compliance_scores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
