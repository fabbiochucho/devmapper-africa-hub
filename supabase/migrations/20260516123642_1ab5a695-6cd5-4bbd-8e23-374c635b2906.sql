
DROP POLICY IF EXISTS "Reports are viewable by everyone" ON public.reports;

CREATE POLICY "View reports by visibility, ownership, affiliation, or admin"
ON public.reports
FOR SELECT
USING (
  visibility = 'public'
  OR (SELECT auth.uid()) = user_id
  OR public.is_affiliated_with_report((SELECT auth.uid()), id)
  OR public.has_role((SELECT auth.uid()), 'admin')
  OR public.has_role((SELECT auth.uid()), 'platform_admin')
);
