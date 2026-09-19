-- Pin search_path on the rating_period trigger function, matching every
-- other function added this session - closes its share of the "Function
-- Search Path Mutable" linter finding.
CREATE OR REPLACE FUNCTION public.set_country_rating_period()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.rating_period := to_char(now(), 'YYYY-MM');
  RETURN NEW;
END;
$$;
