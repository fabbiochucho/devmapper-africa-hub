DROP POLICY IF EXISTS "Anyone can view active listings" ON public.marketplace_listings;

CREATE POLICY "View active or own listings"
  ON public.marketplace_listings FOR SELECT TO authenticated
  USING (
    (listing_status = 'active' AND COALESCE(verification_status, 'verified') <> 'rejected')
    OR seller_id = (SELECT auth.uid())
    OR public.has_role((SELECT auth.uid()), 'admin')
    OR public.has_role((SELECT auth.uid()), 'platform_admin')
  );