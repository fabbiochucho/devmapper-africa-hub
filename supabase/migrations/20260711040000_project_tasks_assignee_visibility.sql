-- #87: Kanban task assignment currently silently only worked for people
-- already affiliated with a project (project_affiliations) or on public
-- projects - a genuinely cross-org assignee (someone with an
-- organization_data_shares grant but no project_affiliations row) could be
-- set as assigned_to but would then be unable to even SELECT the task on a
-- private project, since "Project task access via affiliation" only checks
-- is_affiliated_with_report. The existing UPDATE policy already correctly
-- allows assigned_to = auth.uid() through - SELECT was the missing half.
DROP POLICY IF EXISTS "Project task access via affiliation" ON public.project_tasks;
CREATE POLICY "Project task access via affiliation"
ON public.project_tasks FOR SELECT
USING (
  report_id IN (SELECT id FROM public.reports WHERE user_id = (SELECT auth.uid()))
  OR is_affiliated_with_report((SELECT auth.uid()), report_id)
  OR assigned_to = (SELECT auth.uid())
);
