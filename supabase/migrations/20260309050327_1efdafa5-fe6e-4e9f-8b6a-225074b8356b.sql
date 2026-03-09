-- Fix 1: Revoke direct API access to materialized view mv_dashboard_stats
-- The view is accessed via the get_dashboard_stats() function instead
REVOKE ALL ON public.mv_dashboard_stats FROM anon, authenticated;

-- Fix 2: Tighten notifications INSERT policy
-- Currently allows any authenticated user to insert; restrict to system use (admin/platform_admin)
DROP POLICY IF EXISTS "System and admins can insert notifications" ON public.notifications;

CREATE POLICY "Admins can insert notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'platform_admin')
  );