DROP POLICY IF EXISTS "Authenticated users can read cache" ON public.alphaearth_cache;

CREATE POLICY "Users read org cache or admins read global cache"
ON public.alphaearth_cache
FOR SELECT
TO authenticated
USING (
  (
    organization_id IS NOT NULL
    AND (
      organization_id IN (SELECT id FROM organizations WHERE created_by = (SELECT auth.uid()))
      OR organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = (SELECT auth.uid()))
    )
  )
  OR (
    organization_id IS NULL
    AND public.has_role((SELECT auth.uid()), 'admin')
  )
);