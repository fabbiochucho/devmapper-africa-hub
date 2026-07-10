-- Resolve remaining Supabase security advisor findings for GraphQL exposure,
-- SECURITY DEFINER execution, and public bucket listing.

-- 1) Disable unused pg_graphql to remove GraphQL schema introspection exposure.
DROP EXTENSION IF EXISTS pg_graphql CASCADE;

-- 2) Place privileged SECURITY DEFINER internals in a non-exposed schema.
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;

-- Ensure future functions do not become publicly executable by default.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA private REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA private REVOKE EXECUTE ON FUNCTIONS FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA private REVOKE EXECUTE ON FUNCTIONS FROM authenticated;

-- 3) Internal role and membership helpers used by RLS policies and safe public wrappers.
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND is_active = true
  )
$$;

CREATE OR REPLACE FUNCTION private.is_user_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT private.has_role(target_user_id, 'admin'::public.app_role)
      OR private.has_role(target_user_id, 'platform_admin'::public.app_role)
$$;

CREATE OR REPLACE FUNCTION private.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
  )
$$;

CREATE OR REPLACE FUNCTION private.is_org_owner(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organizations
    WHERE id = _org_id
      AND created_by = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION private.is_affiliated_with_report(_user_id uuid, _report_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_affiliations
    WHERE user_id = _user_id
      AND report_id = _report_id
  )
$$;

CREATE OR REPLACE FUNCTION private.is_conversation_participant(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE user_id = _user_id
      AND conversation_id = _conversation_id
  )
$$;

CREATE OR REPLACE FUNCTION private.has_active_org_share(_user_id uuid, _org_id uuid, _scope text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_data_shares
    WHERE grantee_user_id = _user_id
      AND grantor_org_id = _org_id
      AND _scope = ANY(scope)
      AND expires_at > now()
      AND revoked_at IS NULL
  )
$$;

-- 4) Safe public wrappers are SECURITY INVOKER, so they are not privileged RPC endpoints.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, private, pg_temp
AS $$
  SELECT CASE
    WHEN _user_id IS NOT NULL AND _user_id = (SELECT auth.uid()) THEN private.has_role(_user_id, _role)
    ELSE false
  END
$$;

CREATE OR REPLACE FUNCTION public.is_user_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, private, pg_temp
AS $$
  SELECT CASE
    WHEN target_user_id IS NOT NULL AND target_user_id = (SELECT auth.uid()) THEN private.is_user_admin(target_user_id)
    ELSE false
  END
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, private, pg_temp
AS $$
  SELECT CASE
    WHEN _user_id IS NOT NULL AND _user_id = (SELECT auth.uid()) THEN private.is_org_member(_user_id, _org_id)
    WHEN private.is_user_admin((SELECT auth.uid())) THEN private.is_org_member(_user_id, _org_id)
    ELSE false
  END
$$;

CREATE OR REPLACE FUNCTION public.is_org_owner(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, private, pg_temp
AS $$
  SELECT CASE
    WHEN _user_id IS NOT NULL AND _user_id = (SELECT auth.uid()) THEN private.is_org_owner(_user_id, _org_id)
    WHEN private.is_user_admin((SELECT auth.uid())) THEN private.is_org_owner(_user_id, _org_id)
    ELSE false
  END
$$;

CREATE OR REPLACE FUNCTION public.is_affiliated_with_report(_user_id uuid, _report_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, private, pg_temp
AS $$
  SELECT CASE
    WHEN _user_id IS NOT NULL AND _user_id = (SELECT auth.uid()) THEN private.is_affiliated_with_report(_user_id, _report_id)
    WHEN private.is_user_admin((SELECT auth.uid())) THEN private.is_affiliated_with_report(_user_id, _report_id)
    ELSE false
  END
$$;

CREATE OR REPLACE FUNCTION public.is_conversation_participant(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, private, pg_temp
AS $$
  SELECT CASE
    WHEN _user_id IS NOT NULL AND _user_id = (SELECT auth.uid()) THEN private.is_conversation_participant(_user_id, _conversation_id)
    WHEN private.is_user_admin((SELECT auth.uid())) THEN private.is_conversation_participant(_user_id, _conversation_id)
    ELSE false
  END
$$;

CREATE OR REPLACE FUNCTION public.has_active_org_share(_user_id uuid, _org_id uuid, _scope text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, private, pg_temp
AS $$
  SELECT CASE
    WHEN _user_id IS NOT NULL AND _user_id = (SELECT auth.uid()) THEN private.has_active_org_share(_user_id, _org_id, _scope)
    WHEN private.is_user_admin((SELECT auth.uid())) THEN private.has_active_org_share(_user_id, _org_id, _scope)
    ELSE false
  END
$$;

-- Public data/aggregate RPCs do not need elevated privileges.
CREATE OR REPLACE FUNCTION public.get_agenda2063_for_sdg(p_sdg_goal integer)
RETURNS TABLE(aspiration integer, goal text, description text, data_source text)
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    a.agenda_aspiration,
    a.agenda_goal,
    a.alignment_description,
    a.data_source
  FROM public.agenda2063_links a
  WHERE a.sdg_goal = p_sdg_goal
  ORDER BY a.agenda_aspiration;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE(total_reports bigint, total_change_makers bigint, total_campaigns bigint, total_funds_raised numeric, countries_count bigint, last_updated timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
  SELECT * FROM public.mv_dashboard_stats;
$$;

-- Admin-only test account management now runs as invoker and relies on RLS plus explicit admin checks.
CREATE OR REPLACE FUNCTION public.assign_test_role(p_user_id uuid, p_role public.app_role, p_country text DEFAULT NULL::text, p_organization text DEFAULT NULL::text)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, private, pg_temp
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT private.is_user_admin((SELECT auth.uid())) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can assign test roles';
  END IF;

  INSERT INTO public.user_roles (user_id, role, country, organization, granted_by)
  VALUES (p_user_id, p_role, p_country, p_organization, (SELECT auth.uid()))
  ON CONFLICT (user_id, role) DO UPDATE SET
    country = EXCLUDED.country,
    organization = EXCLUDED.organization,
    is_active = true;

  RETURN 'ok';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_test_accounts()
RETURNS TABLE(user_id uuid, email text, full_name text, roles public.app_role[], organizations text[], countries text[])
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, private, pg_temp
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT private.is_user_admin((SELECT auth.uid())) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can view test accounts';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    p.email,
    p.full_name,
    array_agg(DISTINCT ur.role) AS roles,
    array_agg(DISTINCT ur.organization) FILTER (WHERE ur.organization IS NOT NULL) AS organizations,
    array_agg(DISTINCT ur.country) FILTER (WHERE ur.country IS NOT NULL) AS countries
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id AND ur.is_active = true
  WHERE p.email LIKE '%@test.devmapper.africa'
     OR p.email IN ('abiola.oshunniyi@gmail.com', 'fabbiochucho@gmail.com')
  GROUP BY p.user_id, p.email, p.full_name;
END;
$$;

-- 5) Privileged business actions live internally; public RPC wrappers are non-definer gates.
CREATE OR REPLACE FUNCTION private.retire_carbon_credit_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order RECORD;
  v_seller_id uuid;
  v_carbon_asset_id uuid;
  v_listing RECORD;
  v_certificate_number text;
BEGIN
  SELECT o.id, o.buyer_id, o.listing_id, o.status, o.quantity
  INTO v_order
  FROM public.carbon_credit_orders o
  WHERE o.id = p_order_id
  FOR UPDATE;

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  SELECT seller_id, carbon_asset_id, title, project_type, methodology, country_code
  INTO v_listing
  FROM public.marketplace_listings
  WHERE id = v_order.listing_id;

  v_seller_id := v_listing.seller_id;
  v_carbon_asset_id := v_listing.carbon_asset_id;

  IF (SELECT auth.uid()) IS DISTINCT FROM v_order.buyer_id
     AND (SELECT auth.uid()) IS DISTINCT FROM v_seller_id
     AND NOT private.is_user_admin((SELECT auth.uid())) THEN
    RAISE EXCEPTION 'Not authorized to retire this order';
  END IF;

  IF v_order.status NOT IN ('paid', 'delivered') THEN
    RAISE EXCEPTION 'Order is not in a retirable state';
  END IF;

  v_certificate_number := 'DVM-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(p_order_id::text, '-', ''), 1, 8));

  UPDATE public.carbon_credit_orders
  SET status = 'retired',
      retirement_date = now(),
      retirement_certificate_url = '/certificates/' || v_certificate_number,
      updated_at = now()
  WHERE id = p_order_id;

  INSERT INTO public.retirement_certificates (
    order_id, certificate_number, buyer_id, project_title, project_type, methodology, country_code, quantity
  ) VALUES (
    p_order_id, v_certificate_number, v_order.buyer_id, v_listing.title, v_listing.project_type, v_listing.methodology, v_listing.country_code, v_order.quantity
  )
  ON CONFLICT (order_id) DO NOTHING;

  UPDATE public.portfolio_holdings
  SET status = 'retired', retired_at = now()
  WHERE order_id = p_order_id;

  IF v_carbon_asset_id IS NOT NULL THEN
    UPDATE public.carbon_assets
    SET credits_retired = COALESCE(credits_retired, 0) + v_order.quantity,
        updated_at = now()
    WHERE id = v_carbon_asset_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.retire_carbon_credit_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, private, pg_temp
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  PERFORM private.retire_carbon_credit_order(p_order_id);
END;
$$;

CREATE OR REPLACE FUNCTION private.sync_esg_to_targets(p_org_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_result json;
  v_indicator RECORD;
  v_synced_count integer := 0;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR NOT (
    private.is_org_member((SELECT auth.uid()), p_org_id)
    OR private.is_org_owner((SELECT auth.uid()), p_org_id)
    OR private.is_user_admin((SELECT auth.uid()))
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  FOR v_indicator IN
    SELECT * FROM public.esg_indicators WHERE organization_id = p_org_id
  LOOP
    IF v_indicator.carbon_scope1_tonnes IS NOT NULL THEN
      UPDATE public.corporate_targets
      SET current_value = v_indicator.carbon_scope1_tonnes +
                          COALESCE(v_indicator.carbon_scope2_tonnes, 0) +
                          COALESCE(v_indicator.carbon_scope3_tonnes, 0),
          updated_at = now()
      WHERE company_id IN (SELECT user_id FROM public.organization_members WHERE organization_id = p_org_id)
        AND (title ILIKE '%carbon%' OR title ILIKE '%emission%');
      v_synced_count := v_synced_count + 1;
    END IF;

    IF v_indicator.renewable_energy_percentage IS NOT NULL THEN
      UPDATE public.corporate_targets
      SET current_value = v_indicator.renewable_energy_percentage,
          updated_at = now()
      WHERE company_id IN (SELECT user_id FROM public.organization_members WHERE organization_id = p_org_id)
        AND (title ILIKE '%renewable%' OR title ILIKE '%energy%');
      v_synced_count := v_synced_count + 1;
    END IF;
  END LOOP;

  v_result := json_build_object('synced_count', v_synced_count, 'timestamp', now());
  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_esg_to_targets(p_org_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, private, pg_temp
AS $$
BEGIN
  IF (SELECT auth.uid()) IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN private.sync_esg_to_targets(p_org_id);
END;
$$;

-- 6) Remove caller access from all privileged functions in exposed schemas, then re-grant only safe wrappers.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC, anon, authenticated;

-- Safe non-definer helpers needed by RLS policies and client authorization checks.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_user_admin(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_org_owner(uuid, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_affiliated_with_report(uuid, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_active_org_share(uuid, uuid, text) TO anon, authenticated, service_role;

-- Public/aggregate RPCs.
GRANT EXECUTE ON FUNCTION public.get_agenda2063_for_sdg(integer) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO anon, authenticated, service_role;

-- Authenticated/admin RPCs.
GRANT EXECUTE ON FUNCTION public.assign_test_role(uuid, public.app_role, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_test_accounts() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.retire_carbon_credit_order(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sync_esg_to_targets(uuid) TO authenticated, service_role;

-- Internal functions are not in the exposed API schema; grant only what wrappers/RLS evaluation need.
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_user_admin(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_org_member(uuid, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_org_owner(uuid, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_affiliated_with_report(uuid, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_conversation_participant(uuid, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.has_active_org_share(uuid, uuid, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.retire_carbon_credit_order(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.sync_esg_to_targets(uuid) TO authenticated, service_role;

-- Preserve table privileges needed by the invoker public RPCs.
GRANT SELECT ON public.agenda2063_links TO anon, authenticated;
GRANT SELECT ON public.mv_dashboard_stats TO anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_roles TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO service_role;

-- 7) Tighten avatar metadata listing on the public bucket without changing public URL serving.
DROP POLICY IF EXISTS "Avatar images readable by authenticated" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users and admins can list avatar metadata" ON storage.objects;

CREATE POLICY "Users and admins can list avatar metadata"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (
    (storage.foldername(name))[1] = ((SELECT auth.uid())::text)
    OR public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
    OR public.has_role((SELECT auth.uid()), 'platform_admin'::public.app_role)
  )
);
