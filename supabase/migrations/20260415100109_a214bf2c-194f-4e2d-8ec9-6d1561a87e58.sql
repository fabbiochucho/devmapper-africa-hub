-- Fix: Restrict project_decarbonisation SELECT to report owners and affiliates
DROP POLICY IF EXISTS "Authenticated users can view decarbonisation data" ON public.project_decarbonisation;

CREATE POLICY "Users can view own or affiliated decarbonisation data"
ON public.project_decarbonisation
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = project_decarbonisation.report_id
    AND (
      r.user_id = (SELECT auth.uid())
      OR public.is_affiliated_with_report((SELECT auth.uid()), r.id)
    )
  )
  OR public.has_role((SELECT auth.uid()), 'admin')
);