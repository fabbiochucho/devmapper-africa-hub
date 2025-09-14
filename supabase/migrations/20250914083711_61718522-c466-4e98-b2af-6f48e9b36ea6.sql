-- Fix security issues and improve database security
-- Fix function search paths for security
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.refresh_dashboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW dashboard_stats;
END;
$$;

-- Secure the materialized view by removing it from the API
REVOKE ALL ON public.dashboard_stats FROM anon, authenticated;

-- Create a secure function to access dashboard stats instead
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE (
  total_reports bigint,
  total_change_makers bigint,
  total_campaigns bigint,
  total_funds_raised numeric,
  countries_count bigint,
  last_updated timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT * FROM dashboard_stats;
END;
$$;

-- Grant access to dashboard stats function
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO anon, authenticated;