
-- 1) Tighten project_procurement SELECT: remove public-report leakage
DROP POLICY IF EXISTS "Authenticated users can view procurement" ON public.project_procurement;

CREATE POLICY "Owners and affiliates view procurement"
ON public.project_procurement
FOR SELECT
TO authenticated
USING (
  (SELECT auth.uid()) = created_by
  OR public.is_affiliated_with_report((SELECT auth.uid()), report_id)
  OR EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = project_procurement.report_id
      AND r.user_id = (SELECT auth.uid())
  )
);

-- 2) Tighten contact_submissions INSERT with format/length validation
DROP POLICY IF EXISTS "Anyone can submit contact" ON public.contact_submissions;

CREATE POLICY "Anyone can submit valid contact"
ON public.contact_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  length(trim(name)) BETWEEN 1 AND 200
  AND length(trim(message)) BETWEEN 1 AND 5000
  AND email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'
  AND length(email) <= 320
  AND (subject IS NULL OR length(subject) <= 300)
);

-- Explicit default-deny SELECT for non-admins is implicit (no permissive SELECT for them),
-- but add a restrictive policy to be safe against accidental future permissive policies.
CREATE POLICY "Deny non-admin select on contact submissions"
ON public.contact_submissions
AS RESTRICTIVE
FOR SELECT
TO authenticated, anon
USING (
  public.has_role((SELECT auth.uid()), 'admin'::app_role)
  OR public.has_role((SELECT auth.uid()), 'platform_admin'::app_role)
);
