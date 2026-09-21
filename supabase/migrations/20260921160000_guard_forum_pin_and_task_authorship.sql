-- Found during this session's Forum/PM audit.

-- 1. forum_posts.is_pinned: UPDATE policy has USING but no WITH CHECK, so
-- any post author can pin their own post directly via the API, bypassing
-- the admin-only intent enforced only client-side in Forum.tsx.
CREATE OR REPLACE FUNCTION public.guard_forum_post_pin()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.is_pinned IS DISTINCT FROM OLD.is_pinned
     AND NOT (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role))
  THEN
    RAISE EXCEPTION 'Only admins can pin or unpin forum posts';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_forum_post_pin_trigger ON public.forum_posts;
CREATE TRIGGER guard_forum_post_pin_trigger
BEFORE UPDATE ON public.forum_posts
FOR EACH ROW EXECUTE FUNCTION public.guard_forum_post_pin();

-- 2. project_tasks: neither of the two overlapping permissive INSERT
-- policies checks that the caller-supplied created_by actually matches
-- the caller (unlike the sibling project_updates policy) - a collaborator
-- could attribute a task to a teammate's UUID via a direct API call.
--
-- "Project owners can manage tasks" is FOR ALL (INSERT+UPDATE+DELETE
-- share one WITH CHECK), so simply appending "AND created_by = auth.uid()"
-- to it would also block legitimate UPDATEs by an affiliate who isn't the
-- task's original creator (their only other UPDATE path,
-- "Task assignees and owners can update", doesn't cover a general
-- affiliate - only assignee/creator/report-owner). Splitting it into a
-- dedicated INSERT policy (with the fix) and UPDATE policy (unchanged)
-- avoids that regression; DELETE is already covered by its own
-- "Project owners can delete tasks" policy, so dropping it from here
-- doesn't remove any capability.
DROP POLICY IF EXISTS "Project owners can manage tasks" ON public.project_tasks;

CREATE POLICY "Project owners can insert tasks"
ON public.project_tasks FOR INSERT
WITH CHECK (
  ((report_id IN (SELECT reports.id FROM reports WHERE reports.user_id = auth.uid()))
   OR is_affiliated_with_report(auth.uid(), report_id))
  AND created_by = auth.uid()
);

CREATE POLICY "Project owners can update tasks"
ON public.project_tasks FOR UPDATE
USING (
  (report_id IN (SELECT reports.id FROM reports WHERE reports.user_id = auth.uid()))
  OR is_affiliated_with_report(auth.uid(), report_id)
);

ALTER POLICY "Affiliated users can create tasks" ON public.project_tasks
WITH CHECK (
  ((report_id IN (SELECT reports.id FROM reports WHERE reports.user_id = auth.uid()))
   OR is_affiliated_with_report(auth.uid(), report_id))
  AND created_by = auth.uid()
);
