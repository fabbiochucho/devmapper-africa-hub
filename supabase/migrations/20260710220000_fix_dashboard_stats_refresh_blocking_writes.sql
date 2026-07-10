-- CRITICAL FIX: report/change_maker/campaign submission has been completely
-- broken since whenever trg_refresh_stats_on_reports (etc.) was introduced.
-- refresh_dashboard_stats() calls REFRESH MATERIALIZED VIEW CONCURRENTLY,
-- which requires a unique index on real column(s) of the view -
-- mv_dashboard_stats only has idx_mv_dashboard_stats_singleton, a unique
-- index on the expression (true), which does NOT satisfy that requirement.
-- Every call raises "cannot refresh materialized view concurrently", and
-- because these are AFTER triggers on reports/change_makers/
-- fundraising_campaigns, the exception aborts the entire triggering
-- transaction - so the write itself was rolled back, not just the stats
-- refresh. Confirmed live: reports has had zero new rows since 2026-03-08.
--
-- Fix: drop CONCURRENTLY (mv_dashboard_stats is a single aggregate row over
-- small tables - a brief exclusive lock during refresh is a non-issue), and
-- wrap the refresh in exception handling so that if it ever fails again for
-- any other reason, it logs a warning instead of rolling back the write
-- that triggered it. A denormalized stats cache must never be able to block
-- the primary writes that feed it.
CREATE OR REPLACE FUNCTION public.refresh_dashboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_dashboard_stats;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'refresh_dashboard_stats failed: %', SQLERRM;
END;
$$;
