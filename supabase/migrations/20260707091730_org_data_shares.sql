-- Verifier audit access: a scoped, time-boxed grant letting one org
-- (typically a verifier/auditor) read specific ESG data tables belonging to
-- another org for a single engagement. Follows the same shape as the
-- existing project_affiliations + is_affiliated_with_report() pattern
-- (supabase/migrations/20260308174949_a949ea82-84d2-4c3c-98ff-d1a828289c39.sql):
-- a grant table plus a SECURITY DEFINER boolean helper, reused as an
-- *additive* policy alongside the existing owner/member policies - nothing
-- existing is narrowed or replaced.

CREATE TABLE public.organization_data_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grantor_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  -- FK'd to auth.users (matches verifier_profiles.user_id's convention) so a
  -- grant can't outlive/reference a deleted account. Cascades on delete -
  -- the grant is meaningless once the grantee's account is gone.
  grantee_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope TEXT[] NOT NULL,
  purpose TEXT,
  -- Nullable + SET NULL (unlike grantee_user_id): losing the granter's
  -- account shouldn't silently revoke the verifier's still-valid access,
  -- it should just lose the audit trail of who created it.
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (expires_at > created_at AND expires_at <= created_at + interval '1 year')
);

CREATE INDEX idx_org_data_shares_grantor ON public.organization_data_shares(grantor_org_id);
CREATE INDEX idx_org_data_shares_grantee ON public.organization_data_shares(grantee_user_id);

ALTER TABLE public.organization_data_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org owners can view grants they issued"
ON public.organization_data_shares FOR SELECT
TO authenticated
USING (
  grantor_org_id IN (SELECT id FROM public.organizations WHERE created_by = (SELECT auth.uid()))
);

CREATE POLICY "Grantees can view active grants made to them"
ON public.organization_data_shares FOR SELECT
TO authenticated
USING (grantee_user_id = (SELECT auth.uid()));

CREATE POLICY "Org owners can create grants"
ON public.organization_data_shares FOR INSERT
TO authenticated
WITH CHECK (
  grantor_org_id IN (SELECT id FROM public.organizations WHERE created_by = (SELECT auth.uid()))
  AND granted_by = (SELECT auth.uid())
);

CREATE POLICY "Org owners can revoke grants they issued"
ON public.organization_data_shares FOR UPDATE
TO authenticated
USING (
  grantor_org_id IN (SELECT id FROM public.organizations WHERE created_by = (SELECT auth.uid()))
)
WITH CHECK (
  grantor_org_id IN (SELECT id FROM public.organizations WHERE created_by = (SELECT auth.uid()))
);

-- RLS is row-level only, so the UPDATE policy above can't itself restrict
-- *which* columns change. The app only ever updates revoked_at
-- (revokeDataShare() in src/lib/org-data-shares.ts), but that's an
-- application-layer guarantee, not a database one - enforce it at the
-- database layer too so this can't quietly become a re-grant/re-scope
-- backdoor if the client code ever changes.
CREATE OR REPLACE FUNCTION public.enforce_org_data_share_revoke_only()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.grantor_org_id IS DISTINCT FROM OLD.grantor_org_id
    OR NEW.grantee_user_id IS DISTINCT FROM OLD.grantee_user_id
    OR NEW.scope IS DISTINCT FROM OLD.scope
    OR NEW.purpose IS DISTINCT FROM OLD.purpose
    OR NEW.granted_by IS DISTINCT FROM OLD.granted_by
    OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'organization_data_shares rows are immutable except for revoked_at';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_enforce_org_data_share_revoke_only
  BEFORE UPDATE ON public.organization_data_shares
  FOR EACH ROW EXECUTE FUNCTION public.enforce_org_data_share_revoke_only();

CREATE OR REPLACE FUNCTION public.has_active_org_share(_user_id uuid, _org_id uuid, _scope text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_data_shares
    WHERE grantee_user_id = _user_id
      AND grantor_org_id = _org_id
      AND _scope = ANY(scope)
      AND expires_at > now()
      AND revoked_at IS NULL
  )
$$;

-- Additive SELECT policies: OR'd together with the existing owner/member
-- policies on each table (Postgres combines multiple permissive policies
-- with OR), so nothing already granted is narrowed.

CREATE POLICY "Verifier grant holders can read esg_indicators"
ON public.esg_indicators FOR SELECT
TO authenticated
USING (public.has_active_org_share((SELECT auth.uid()), organization_id, 'esg_indicators'));

CREATE POLICY "Verifier grant holders can read esg_suppliers"
ON public.esg_suppliers FOR SELECT
TO authenticated
USING (public.has_active_org_share((SELECT auth.uid()), organization_id, 'esg_suppliers'));

CREATE POLICY "Verifier grant holders can read esg_supplier_emissions"
ON public.esg_supplier_emissions FOR SELECT
TO authenticated
USING (public.has_active_org_share((SELECT auth.uid()), organization_id, 'esg_supplier_emissions'));

CREATE POLICY "Verifier grant holders can read compliance_scores"
ON public.compliance_scores FOR SELECT
TO authenticated
USING (public.has_active_org_share((SELECT auth.uid()), organization_id, 'compliance_scores'));

CREATE POLICY "Verifier grant holders can read standards_metadata"
ON public.standards_metadata FOR SELECT
TO authenticated
USING (public.has_active_org_share((SELECT auth.uid()), organization_id, 'standards_metadata'));
