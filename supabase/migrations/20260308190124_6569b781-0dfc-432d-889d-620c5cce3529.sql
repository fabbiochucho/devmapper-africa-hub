DROP VIEW IF EXISTS public.dashboard_stats;

CREATE VIEW public.dashboard_stats
WITH (security_invoker = on) AS
SELECT
  (SELECT count(*) FROM reports) AS total_reports,
  (SELECT count(*) FROM change_makers) AS total_change_makers,
  (SELECT count(*) FROM fundraising_campaigns) AS total_campaigns,
  (SELECT coalesce(sum(raised_amount), 0) FROM fundraising_campaigns) AS total_funds_raised,
  (SELECT count(DISTINCT country_code) FROM reports WHERE country_code IS NOT NULL) AS countries_count,
  now() AS last_updated;