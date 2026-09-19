-- Feature 4: "Most Improved" trend view - the historical record that
-- doesn't exist anywhere today.
CREATE TABLE public.country_stats_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code text NOT NULL,
  snapshot_date date NOT NULL DEFAULT current_date,
  total_reports integer NOT NULL,
  verified_reports integer NOT NULL,
  avg_rating numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (country_code, snapshot_date)
);

ALTER TABLE public.country_stats_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view country stats snapshots"
ON public.country_stats_snapshots FOR SELECT
USING (true);

-- No client INSERT policy at all - only capture_country_stats_snapshot()
-- (SECURITY DEFINER, called by cron below) ever writes here.
REVOKE ALL ON public.country_stats_snapshots FROM anon, authenticated;
GRANT SELECT ON public.country_stats_snapshots TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.capture_country_stats_snapshot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.country_stats_snapshots (country_code, snapshot_date, total_reports, verified_reports, avg_rating)
  SELECT
    r.country_code,
    current_date,
    count(*),
    count(*) FILTER (WHERE r.is_verified),
    (SELECT ra.avg_overall FROM public.get_country_rating_aggregates() ra WHERE ra.country_code = r.country_code)
  FROM public.reports r
  WHERE r.country_code IS NOT NULL
  GROUP BY r.country_code
  ON CONFLICT (country_code, snapshot_date) DO UPDATE SET
    total_reports = EXCLUDED.total_reports,
    verified_reports = EXCLUDED.verified_reports,
    avg_rating = EXCLUDED.avg_rating;
END;
$$;

SELECT cron.schedule(
  'capture-country-stats-snapshot',
  '0 3 * * 1',
  $$SELECT public.capture_country_stats_snapshot();$$
);

-- Delta-over-time ranking: latest snapshot vs. the oldest snapshot within
-- the trailing window, per country. Countries without at least two
-- snapshots spanning the window can't show a trend yet and are excluded -
-- the frontend renders an explicit "still building trend data" empty
-- state rather than treating that as zero results.
CREATE OR REPLACE FUNCTION public.get_most_improved_countries(p_days int DEFAULT 30)
RETURNS TABLE (
  country_code text,
  earliest_date date,
  earliest_reports integer,
  earliest_verified integer,
  latest_date date,
  latest_reports integer,
  latest_verified integer,
  report_delta integer,
  verified_delta integer
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH latest AS (
    SELECT DISTINCT ON (country_code)
      country_code, snapshot_date, total_reports, verified_reports
    FROM public.country_stats_snapshots
    ORDER BY country_code, snapshot_date DESC
  ),
  earliest AS (
    SELECT DISTINCT ON (country_code)
      country_code, snapshot_date, total_reports, verified_reports
    FROM public.country_stats_snapshots
    WHERE snapshot_date <= current_date - p_days
    ORDER BY country_code, snapshot_date DESC
  )
  SELECT
    l.country_code,
    e.snapshot_date AS earliest_date,
    e.total_reports AS earliest_reports,
    e.verified_reports AS earliest_verified,
    l.snapshot_date AS latest_date,
    l.total_reports AS latest_reports,
    l.verified_reports AS latest_verified,
    l.total_reports - e.total_reports AS report_delta,
    l.verified_reports - e.verified_reports AS verified_delta
  FROM latest l
  JOIN earliest e ON e.country_code = l.country_code AND e.snapshot_date < l.snapshot_date
  ORDER BY report_delta DESC
$$;

GRANT EXECUTE ON FUNCTION public.get_most_improved_countries(int) TO anon, authenticated;
