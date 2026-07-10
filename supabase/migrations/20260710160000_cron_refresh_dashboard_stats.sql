-- Dashboard stats (mv_dashboard_stats) were stale because
-- trg_refresh_stats_on_campaigns only fired on INSERT/DELETE, not UPDATE -
-- so a donation increasing fundraising_campaigns.raised_amount never
-- triggered a refresh. Add UPDATE to close that gap, and schedule a
-- periodic refresh via pg_cron (already enabled in this project) as a
-- backstop for any other paths that affect the aggregate but don't fire
-- these specific triggers.

DROP TRIGGER IF EXISTS trg_refresh_stats_on_campaigns ON public.fundraising_campaigns;
CREATE TRIGGER trg_refresh_stats_on_campaigns
AFTER INSERT OR UPDATE OR DELETE ON public.fundraising_campaigns
FOR EACH STATEMENT EXECUTE FUNCTION public.trigger_refresh_dashboard_stats();

SELECT cron.schedule(
  'refresh-dashboard-stats',
  '*/15 * * * *',
  $$SELECT public.refresh_dashboard_stats();$$
);
