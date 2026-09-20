-- RLS audit: "Users can update carbon data for own reports" had no
-- WITH CHECK, so a report owner could self-set carbon_verified=true,
-- verified_by, and verified_at on their own project_carbon_data - the
-- same self-verification pattern already fixed on evidence_items.
CREATE OR REPLACE FUNCTION public.guard_carbon_data_verification()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (NEW.carbon_verified IS DISTINCT FROM OLD.carbon_verified
      OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
      OR NEW.verified_at IS DISTINCT FROM OLD.verified_at)
     AND NOT (
       has_role(auth.uid(), 'admin'::app_role)
       OR has_role(auth.uid(), 'platform_admin'::app_role)
       OR has_role(auth.uid(), 'government_official'::app_role)
       OR has_role(auth.uid(), 'ngo_member'::app_role)
     )
  THEN
    RAISE EXCEPTION 'Only verifiers can change carbon data verification status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_carbon_data_verification_trigger ON public.project_carbon_data;
CREATE TRIGGER guard_carbon_data_verification_trigger
BEFORE UPDATE ON public.project_carbon_data
FOR EACH ROW EXECUTE FUNCTION public.guard_carbon_data_verification();
