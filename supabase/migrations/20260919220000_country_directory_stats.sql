-- Feature 2: country directory. Data volume is tiny today (single digits
-- of report rows) - a plain SECURITY DEFINER aggregation function is
-- correct here, a materialized view would be premature.
CREATE OR REPLACE FUNCTION public.get_country_directory_stats()
RETURNS TABLE (
  country_code text,
  total_reports bigint,
  verified_reports bigint,
  total_budget numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    country_code,
    count(*) AS total_reports,
    count(*) FILTER (WHERE is_verified) AS verified_reports,
    coalesce(sum(cost), 0) AS total_budget
  FROM public.reports
  WHERE country_code IS NOT NULL
  GROUP BY country_code
$$;

GRANT EXECUTE ON FUNCTION public.get_country_directory_stats() TO anon, authenticated;
