-- CRITICAL (RLS audit, same bug class as the two prior fixes today):
-- "Users can update their own reports" has no WITH CHECK, so any report
-- owner could self-write is_verified (the platform's core trust signal -
-- read everywhere: StatsSection, SdgDashboardView, FunderDashboard,
-- MyProjects badges, ChangeMaker analytics, funding-readiness scoring),
-- escalation_status (a workflow-progress indicator shown on
-- MyReportsTracker), and verification_count. Confirmed no frontend code
-- or trigger legitimately writes any of these three columns today - they
-- have no functioning write path at all yet, only this RLS hole.
CREATE OR REPLACE FUNCTION public.guard_report_trust_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (NEW.is_verified IS DISTINCT FROM OLD.is_verified
      OR NEW.escalation_status IS DISTINCT FROM OLD.escalation_status
      OR NEW.verification_count IS DISTINCT FROM OLD.verification_count)
     AND NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role))
  THEN
    RAISE EXCEPTION 'Only admins can change report verification status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_report_trust_fields_trigger ON public.reports;
CREATE TRIGGER guard_report_trust_fields_trigger
BEFORE UPDATE ON public.reports
FOR EACH ROW EXECUTE FUNCTION public.guard_report_trust_fields();
