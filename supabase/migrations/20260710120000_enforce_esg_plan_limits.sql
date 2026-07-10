-- Enforce esg_suppliers_limit / esg_scenarios_limit at the database layer.
-- Previously these columns existed and were rendered in the UI, but nothing
-- stopped a direct insert from exceeding the org's plan limit. -1 means unlimited.

CREATE OR REPLACE FUNCTION public.enforce_esg_suppliers_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit integer;
  v_count integer;
BEGIN
  SELECT esg_suppliers_limit INTO v_limit
  FROM public.organizations
  WHERE id = NEW.organization_id;

  IF v_limit IS NOT NULL AND v_limit >= 0 THEN
    SELECT count(*) INTO v_count
    FROM public.esg_suppliers
    WHERE organization_id = NEW.organization_id;

    IF v_count >= v_limit THEN
      RAISE EXCEPTION 'ESG supplier limit reached for this organization plan (limit: %)', v_limit
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_esg_suppliers_limit_trigger
BEFORE INSERT ON public.esg_suppliers
FOR EACH ROW EXECUTE FUNCTION public.enforce_esg_suppliers_limit();

CREATE OR REPLACE FUNCTION public.enforce_esg_scenarios_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit integer;
  v_count integer;
BEGIN
  SELECT esg_scenarios_limit INTO v_limit
  FROM public.organizations
  WHERE id = NEW.organization_id;

  IF v_limit IS NOT NULL AND v_limit >= 0 THEN
    SELECT count(*) INTO v_count
    FROM public.esg_scenarios
    WHERE organization_id = NEW.organization_id;

    IF v_count >= v_limit THEN
      RAISE EXCEPTION 'ESG scenario limit reached for this organization plan (limit: %)', v_limit
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_esg_scenarios_limit_trigger
BEFORE INSERT ON public.esg_scenarios
FOR EACH ROW EXECUTE FUNCTION public.enforce_esg_scenarios_limit();

-- These run as row-level triggers on INSERT; they don't need to be callable
-- directly by clients (mirrors the REVOKE pattern used for other trigger
-- functions in 20260710025359_security_hardening_rls_and_grants.sql).
REVOKE EXECUTE ON FUNCTION public.enforce_esg_suppliers_limit() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_esg_scenarios_limit() FROM anon, authenticated;
