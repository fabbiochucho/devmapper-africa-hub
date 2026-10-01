DROP POLICY IF EXISTS "Anyone authenticated can view verifier profiles" ON public.verifier_profiles;
CREATE POLICY "View certified or own verifier profiles" ON public.verifier_profiles
FOR SELECT TO authenticated
USING (is_certified = true OR user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Authenticated can view reviews" ON public.verifier_reviews;
CREATE POLICY "Parties and admins can view reviews" ON public.verifier_reviews
FOR SELECT TO authenticated
USING (
  reviewer_id = (SELECT auth.uid())
  OR verifier_id = (SELECT auth.uid())
  OR EXISTS (SELECT 1 FROM public.verifier_profiles vp WHERE vp.id = verifier_reviews.verifier_id AND vp.user_id = (SELECT auth.uid()))
  OR public.has_role((SELECT auth.uid()), 'admin'::app_role)
  OR public.has_role((SELECT auth.uid()), 'platform_admin'::app_role)
);