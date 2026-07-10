-- 20260710081725_...sql (this morning's security hardening) correctly
-- revoked anon/authenticated SELECT on mv_dashboard_stats, but
-- get_dashboard_stats() is SECURITY INVOKER and reads that view directly,
-- so every call from the (public, unauthenticated) landing page has been
-- failing with "permission denied for materialized view mv_dashboard_stats"
-- since that migration landed - the impact metrics section has been showing
-- placeholder dashes for all visitors.
--
-- The view only exposes aggregate counts/sums (no row-level or PII data),
-- so making the RPC wrapper SECURITY DEFINER - while leaving the view
-- itself locked down to direct queries - is safe and matches the
-- public-wrapper/private-definer pattern already used elsewhere in this
-- migration set.
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE(total_reports bigint, total_change_makers bigint, total_campaigns bigint, total_funds_raised numeric, countries_count bigint, last_updated timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT * FROM public.mv_dashboard_stats;
$$;
