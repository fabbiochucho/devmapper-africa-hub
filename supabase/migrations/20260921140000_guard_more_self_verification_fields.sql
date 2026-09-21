-- Found during this session's Carbon/ESG/ChangeMaker audit: the same
-- "UPDATE policy has USING but no WITH CHECK" gap already fixed for
-- profiles/evidence_items (20260920110000) and project_carbon_data also
-- exists on four more trust-signal columns. Same guard-trigger fix.

CREATE OR REPLACE FUNCTION public.guard_carbon_assets_verification_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status
     AND NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role))
  THEN
    RAISE EXCEPTION 'Only admins can change carbon asset verification status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_carbon_assets_verification_fields_trigger ON public.carbon_assets;
CREATE TRIGGER guard_carbon_assets_verification_fields_trigger
BEFORE UPDATE ON public.carbon_assets
FOR EACH ROW EXECUTE FUNCTION public.guard_carbon_assets_verification_fields();

CREATE OR REPLACE FUNCTION public.guard_carbon_compliance_verification_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.article6_status IS DISTINCT FROM OLD.article6_status
     AND NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role))
  THEN
    RAISE EXCEPTION 'Only admins can change Article 6 compliance status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_carbon_compliance_verification_fields_trigger ON public.carbon_compliance;
CREATE TRIGGER guard_carbon_compliance_verification_fields_trigger
BEFORE UPDATE ON public.carbon_compliance
FOR EACH ROW EXECUTE FUNCTION public.guard_carbon_compliance_verification_fields();

CREATE OR REPLACE FUNCTION public.guard_esg_indicators_verification_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status
     AND NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role))
  THEN
    RAISE EXCEPTION 'Only admins can change ESG indicator verification status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_esg_indicators_verification_fields_trigger ON public.esg_indicators;
CREATE TRIGGER guard_esg_indicators_verification_fields_trigger
BEFORE UPDATE ON public.esg_indicators
FOR EACH ROW EXECUTE FUNCTION public.guard_esg_indicators_verification_fields();

CREATE OR REPLACE FUNCTION public.guard_changemaker_verification_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified
     AND NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role))
  THEN
    RAISE EXCEPTION 'Only admins can change change-maker verification status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_changemaker_verification_fields_trigger ON public.change_makers;
CREATE TRIGGER guard_changemaker_verification_fields_trigger
BEFORE UPDATE ON public.change_makers
FOR EACH ROW EXECUTE FUNCTION public.guard_changemaker_verification_fields();
