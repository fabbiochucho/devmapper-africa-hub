-- capture_country_stats_snapshot() is a SECURITY DEFINER writer meant to be
-- called only by the weekly cron job, but Postgres grants EXECUTE to
-- PUBLIC by default on function creation - unlike the read-only
-- get_*() aggregate functions in the same migration set, this one was
-- never explicitly GRANTed to anon/authenticated, so it silently kept
-- that default PUBLIC grant, letting any anon caller force a snapshot
-- write via RPC. cron jobs run as the job owner (not PUBLIC), so
-- revoking here does not affect the scheduled job.
REVOKE ALL ON FUNCTION public.capture_country_stats_snapshot() FROM PUBLIC, anon, authenticated;
