-- Fix Security Definer View issue by replacing materialized view with secure function

-- Drop the existing SECURITY DEFINER function that accesses the materialized view
DROP FUNCTION IF EXISTS public.get_dashboard_stats();

-- Drop the materialized view that bypasses RLS
DROP MATERIALIZED VIEW IF EXISTS public.dashboard_stats;

-- Create a new function that respects RLS policies (SECURITY INVOKER is default)
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE(
  total_reports bigint,
  total_change_makers bigint, 
  total_campaigns bigint,
  total_funds_raised numeric,
  countries_count bigint,
  last_updated timestamp with time zone
) 
LANGUAGE sql 
SECURITY INVOKER  -- This ensures the function runs with caller's privileges, respecting RLS
STABLE
SET search_path = public
AS $$
  SELECT 
    (SELECT count(*) FROM reports) as total_reports,
    (SELECT count(*) FROM change_makers) as total_change_makers,
    (SELECT count(*) FROM fundraising_campaigns) as total_campaigns,
    (SELECT coalesce(sum(raised_amount), 0) FROM fundraising_campaigns) as total_funds_raised,
    (SELECT count(DISTINCT country_code) FROM reports WHERE country_code IS NOT NULL) as countries_count,
    now() as last_updated;
$$;

-- Create a simple view for backward compatibility (no SECURITY DEFINER)
CREATE OR REPLACE VIEW public.dashboard_stats AS
SELECT * FROM public.get_dashboard_stats();

-- Grant appropriate permissions
GRANT SELECT ON public.dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;