-- project_certifications: replace permissive SELECT
DROP POLICY IF EXISTS "Project certifications are viewable by everyone" ON public.project_certifications;
DROP POLICY IF EXISTS "Anyone can view project certifications" ON public.project_certifications;
DROP POLICY IF EXISTS "Public can view project certifications" ON public.project_certifications;

CREATE POLICY "View certifications by report access"
ON public.project_certifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = project_certifications.report_id
      AND (
        r.visibility = 'public'
        OR r.user_id = (SELECT auth.uid())
        OR public.is_affiliated_with_report((SELECT auth.uid()), r.id)
        OR public.has_role((SELECT auth.uid()), 'admin'::app_role)
        OR public.has_role((SELECT auth.uid()), 'platform_admin'::app_role)
      )
  )
);

-- verification_scores: replace permissive SELECT
DROP POLICY IF EXISTS "Verification scores are viewable by everyone" ON public.verification_scores;
DROP POLICY IF EXISTS "Anyone can view verification scores" ON public.verification_scores;
DROP POLICY IF EXISTS "Public can view verification scores" ON public.verification_scores;

CREATE POLICY "View verification scores by report access"
ON public.verification_scores
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.reports r
    WHERE r.id = verification_scores.report_id
      AND (
        r.visibility = 'public'
        OR r.user_id = (SELECT auth.uid())
        OR public.is_affiliated_with_report((SELECT auth.uid()), r.id)
        OR public.has_role((SELECT auth.uid()), 'admin'::app_role)
        OR public.has_role((SELECT auth.uid()), 'platform_admin'::app_role)
      )
  )
);

-- verification_ledger: remove end-user INSERT; restrict to service_role
DROP POLICY IF EXISTS "Report owners can append ledger entries" ON public.verification_ledger;
DROP POLICY IF EXISTS "Users can insert ledger entries" ON public.verification_ledger;
DROP POLICY IF EXISTS "Authenticated users can insert ledger entries" ON public.verification_ledger;

CREATE POLICY "Service role only can insert ledger entries"
ON public.verification_ledger
FOR INSERT
TO service_role
WITH CHECK (true);