-- CRITICAL (found during security-first RLS audit): both profiles and
-- evidence_items have an "owner can update own row" UPDATE policy with no
-- WITH CHECK - RLS is row-scoped only, so the owner could write ANY
-- column, including trust-signal fields never meant to be self-set:
--   - profiles.is_verified: the actual boolean gating "Verified" badges
--     across UserTable.tsx, ChangeMakersSection's is_verified=true query,
--     campaign-style trust displays - legitimately set only via admin-only
--     VerifyUserDialog.tsx, but RLS never enforced that.
--   - evidence_items.verification_status/verified_by/verified_at: shown
--     as a trust indicator in SPVFVerificationPanel and included in
--     AuditTrailExport (used for SDG certification audit trails) - no
--     frontend path legitimately sets these away from 'pending' (real
--     verification instead goes through project_verifications), but RLS
--     never blocked an uploader from self-setting their own evidence to
--     'verified' directly.
--
-- Fixed via guard triggers (same pattern as
-- block_carbon_order_price_update) rather than WITH CHECK, since WITH
-- CHECK can only restrict row values as a whole, not "this column may
-- change only if that column doesn't" - profiles/evidence_items owners
-- still need to freely edit their other, non-trust-signal columns.

CREATE OR REPLACE FUNCTION public.guard_profile_verification_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (NEW.is_verified IS DISTINCT FROM OLD.is_verified
      OR NEW.regulatory_exposure IS DISTINCT FROM OLD.regulatory_exposure)
     AND NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role))
  THEN
    RAISE EXCEPTION 'Only admins can change verification status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_verification_fields_trigger ON public.profiles;
CREATE TRIGGER guard_profile_verification_fields_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_verification_fields();

CREATE OR REPLACE FUNCTION public.guard_evidence_verification_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (NEW.verification_status IS DISTINCT FROM OLD.verification_status
      OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
      OR NEW.verified_at IS DISTINCT FROM OLD.verified_at)
     AND NOT (
       has_role(auth.uid(), 'admin'::app_role)
       OR has_role(auth.uid(), 'platform_admin'::app_role)
       OR has_role(auth.uid(), 'government_official'::app_role)
       OR has_role(auth.uid(), 'ngo_member'::app_role)
     )
  THEN
    RAISE EXCEPTION 'Only verifiers can change evidence verification status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_evidence_verification_fields_trigger ON public.evidence_items;
CREATE TRIGGER guard_evidence_verification_fields_trigger
BEFORE UPDATE ON public.evidence_items
FOR EACH ROW EXECUTE FUNCTION public.guard_evidence_verification_fields();
