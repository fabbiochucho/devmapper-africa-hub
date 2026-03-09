-- Create materialized view for dashboard stats (replaces expensive COUNT queries)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM reports) as total_reports,
  (SELECT COUNT(*) FROM change_makers) as total_change_makers,
  (SELECT COUNT(*) FROM fundraising_campaigns) as total_campaigns,
  (SELECT COALESCE(SUM(raised_amount), 0) FROM fundraising_campaigns) as total_funds_raised,
  (SELECT COUNT(DISTINCT country_code) FROM reports WHERE country_code IS NOT NULL) as countries_count,
  NOW() as last_updated;

-- Create index on the materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_dashboard_stats_singleton ON mv_dashboard_stats ((true));

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_stats;
END;
$$;

-- Update the get_dashboard_stats function to use the materialized view
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS TABLE(
  total_reports bigint,
  total_change_makers bigint,
  total_campaigns bigint,
  total_funds_raised numeric,
  countries_count bigint,
  last_updated timestamp with time zone
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM mv_dashboard_stats;
$$;

-- Add comment
COMMENT ON MATERIALIZED VIEW mv_dashboard_stats IS 'Pre-computed dashboard statistics to avoid expensive COUNT queries. Refresh periodically via refresh_dashboard_stats().';