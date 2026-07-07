-- ERP connector settings (PRD #92). Odoo gets a real sync implementation;
-- SAP is a selectable provider that stays permanently 'not_connected' with
-- "coming soon" UI copy - no SAP connector code in this pass.

CREATE TABLE public.erp_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('odoo', 'sap')),
  base_url TEXT NOT NULL,
  api_key_secret_name TEXT,
  sync_status TEXT NOT NULL DEFAULT 'not_connected' CHECK (sync_status IN ('not_connected', 'connected', 'syncing', 'error')),
  last_synced_at TIMESTAMPTZ,
  last_error TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_erp_connections_org ON public.erp_connections(organization_id);

ALTER TABLE public.erp_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view erp connections"
ON public.erp_connections FOR SELECT
TO authenticated
USING (
  organization_id IN (SELECT id FROM public.organizations WHERE created_by = (SELECT auth.uid()))
  OR organization_id IN (SELECT organization_id FROM public.organization_members WHERE user_id = (SELECT auth.uid()))
);

CREATE POLICY "Org owners can manage erp connections"
ON public.erp_connections FOR ALL
TO authenticated
USING (organization_id IN (SELECT id FROM public.organizations WHERE created_by = (SELECT auth.uid())))
WITH CHECK (organization_id IN (SELECT id FROM public.organizations WHERE created_by = (SELECT auth.uid())));
