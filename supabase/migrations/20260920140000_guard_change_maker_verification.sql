-- RLS audit: "Users can update their own change maker profile" had no
-- WITH CHECK, so a change maker could self-set is_verified=true - the
-- flag ChangeMakersSection.tsx filters on (.eq('is_verified', true)) to
-- show the featured/verified changemakers list. No frontend code writes
-- this column (SubmitChangeMaker.tsx's update payload excludes it).
CREATE OR REPLACE FUNCTION public.guard_change_maker_verification()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.is_verified IS DISTINCT FROM OLD.is_verified
     AND NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role))
  THEN
    RAISE EXCEPTION 'Only admins can change verification status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_change_maker_verification_trigger ON public.change_makers;
CREATE TRIGGER guard_change_maker_verification_trigger
BEFORE UPDATE ON public.change_makers
FOR EACH ROW EXECUTE FUNCTION public.guard_change_maker_verification();
