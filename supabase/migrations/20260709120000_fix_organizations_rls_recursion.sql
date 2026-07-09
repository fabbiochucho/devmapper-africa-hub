-- Fix: infinite recursion between organizations and organization_members RLS.
--
-- Root cause (confirmed live: `GET /rest/v1/organizations` returns Postgres
-- error 42P17 "infinite recursion detected in policy for relation
-- organizations"):
--
--   - organizations."Members can view their organizations" (added in
--     20260514132431) checks membership via a subquery against
--     organization_members.
--   - organization_members."Organization owners can manage members" and
--     "Users can view memberships for their organizations" (added earlier,
--     in 20260309003507) each check ownership via a subquery against
--     organizations.
--
-- Evaluating either table's RLS therefore re-triggers the other's RLS,
-- which re-triggers the first, forever. This breaks every query against
-- both tables, and cascades to anything whose own RLS transitively checks
-- organization membership (most of the ESG module).
--
-- Fix: route both cross-table checks through SECURITY DEFINER helper
-- functions, matching the established pattern already used elsewhere in
-- this codebase (has_role, is_affiliated_with_report,
-- has_active_org_share). A SECURITY DEFINER function's internal query
-- bypasses RLS on the table it reads, so neither helper re-triggers the
-- other table's policy evaluation - the cycle is broken structurally, not
-- just avoided by luck.

CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_org_owner(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = _org_id AND created_by = _user_id
  )
$$;

DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;
CREATE POLICY "Members can view their organizations"
ON public.organizations
FOR SELECT
USING (public.is_org_member((select auth.uid()), id));

DROP POLICY IF EXISTS "Organization owners can manage members" ON public.organization_members;
CREATE POLICY "Organization owners can manage members" ON public.organization_members
FOR ALL USING (public.is_org_owner((select auth.uid()), organization_id));

DROP POLICY IF EXISTS "Users can view memberships for their organizations" ON public.organization_members;
CREATE POLICY "Users can view memberships for their organizations" ON public.organization_members
FOR SELECT USING (
  user_id = (select auth.uid()) OR public.is_org_owner((select auth.uid()), organization_id)
);
