-- Fix critical privilege escalation vulnerability in project_affiliations
-- Remove the self-affiliation bypass that allowed any authenticated user to gain access to any project

DROP POLICY IF EXISTS "Authenticated users can create affiliations" ON public.project_affiliations;

-- New policy: Only report owners can create affiliations for their reports
CREATE POLICY "Report owners can create affiliations for their reports"
ON public.project_affiliations
FOR INSERT
TO public
WITH CHECK (
  auth.uid() IS NOT NULL
  AND report_id IN (
    SELECT id FROM public.reports WHERE user_id = auth.uid()
  )
);

-- Add comment explaining the security fix
COMMENT ON POLICY "Report owners can create affiliations for their reports"
ON public.project_affiliations
IS 'Security fix: Prevents privilege escalation by ensuring only report owners can create affiliations';
