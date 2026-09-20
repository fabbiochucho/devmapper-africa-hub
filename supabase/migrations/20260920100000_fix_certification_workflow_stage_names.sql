-- CRITICAL BUG: init_certification_workflow() (fired AFTER INSERT ON
-- certification_applications) inserted verbose stage names
-- ('baseline_verification', 'design_validation', etc.) that don't match
-- verification_workflow_stages_stage_check's short vocabulary
-- ('registration', 'baseline', 'design', 'implementation', 'output',
-- 'outcome', 'impact' - the same keys VERIFICATION_STAGES in
-- src/lib/spvf-engine.ts already uses for its stage labels/UI). The very
-- first non-'registration' stage insert violated the check constraint and
-- aborted the whole transaction - every certification application
-- submission has been failing silently ever since this trigger was added.
CREATE OR REPLACE FUNCTION public.init_certification_workflow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  stages text[] := ARRAY['registration', 'baseline', 'design', 'implementation', 'output', 'outcome', 'impact'];
  s text;
BEGIN
  FOREACH s IN ARRAY stages LOOP
    INSERT INTO public.verification_workflow_stages (report_id, stage, status)
    VALUES (NEW.report_id, s, 'pending')
    ON CONFLICT DO NOTHING;
  END LOOP;

  INSERT INTO public.verification_scores (report_id)
  VALUES (NEW.report_id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;
