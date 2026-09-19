-- Feature 3: lightweight monthly country rating. One row per rater per
-- country per calendar month; partial ratings count (at least one of the
-- 8 responsibility-area dimensions must be filled in).
CREATE TABLE public.country_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country_code text NOT NULL,
  rating_period text NOT NULL,
  infrastructure smallint CHECK (infrastructure BETWEEN 1 AND 5),
  water_sanitation smallint CHECK (water_sanitation BETWEEN 1 AND 5),
  health smallint CHECK (health BETWEEN 1 AND 5),
  education smallint CHECK (education BETWEEN 1 AND 5),
  economic_revenue smallint CHECK (economic_revenue BETWEEN 1 AND 5),
  agriculture smallint CHECK (agriculture BETWEEN 1 AND 5),
  civil_registration smallint CHECK (civil_registration BETWEEN 1 AND 5),
  governance smallint CHECK (governance BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(infrastructure, water_sanitation, health, education,
                       economic_revenue, agriculture, civil_registration, governance) > 0),
  UNIQUE (rater_id, country_code, rating_period)
);

COMMENT ON COLUMN public.country_ratings.rating_period IS
  'Always overwritten server-side by set_country_rating_period() to the current '
  'YYYY-MM - never trust a client-supplied value here, the once-a-month cap '
  'depends on this being the real submission month.';

-- Client-supplied rating_period is discarded - this is what makes the
-- once-per-month cap (via the UNIQUE constraint above) unforgeable.
CREATE OR REPLACE FUNCTION public.set_country_rating_period()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.rating_period := to_char(now(), 'YYYY-MM');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_country_rating_period_trigger
BEFORE INSERT ON public.country_ratings
FOR EACH ROW EXECUTE FUNCTION public.set_country_rating_period();

ALTER TABLE public.country_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit their own country ratings"
ON public.country_ratings FOR INSERT
WITH CHECK (auth.uid() = rater_id);

-- Raw individual ratings stay private to the rater and admins - the public
-- only ever sees the aggregate below, never "who rated what".
CREATE POLICY "Raters and admins can view raw country ratings"
ON public.country_ratings FOR SELECT
USING (
  auth.uid() = rater_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'platform_admin'::app_role)
);

REVOKE ALL ON public.country_ratings FROM anon, authenticated;
GRANT SELECT, INSERT ON public.country_ratings TO authenticated;

-- Public aggregate - bypasses RLS to average across all raters without ever
-- exposing individual rater identity, following the same
-- verifier_reviews -> reputation_score aggregate pattern used elsewhere.
CREATE OR REPLACE FUNCTION public.get_country_rating_aggregates()
RETURNS TABLE (
  country_code text,
  rater_count bigint,
  avg_infrastructure numeric,
  avg_water_sanitation numeric,
  avg_health numeric,
  avg_education numeric,
  avg_economic_revenue numeric,
  avg_agriculture numeric,
  avg_civil_registration numeric,
  avg_governance numeric,
  avg_overall numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    country_code,
    count(DISTINCT rater_id) AS rater_count,
    avg(infrastructure) AS avg_infrastructure,
    avg(water_sanitation) AS avg_water_sanitation,
    avg(health) AS avg_health,
    avg(education) AS avg_education,
    avg(economic_revenue) AS avg_economic_revenue,
    avg(agriculture) AS avg_agriculture,
    avg(civil_registration) AS avg_civil_registration,
    avg(governance) AS avg_governance,
    -- Mean of the 8 dimension averages (not a flat average of every
    -- submitted number), so a country isn't skewed by raters who filled in
    -- more dimensions than others.
    (
      coalesce(avg(infrastructure), 0) + coalesce(avg(water_sanitation), 0) +
      coalesce(avg(health), 0) + coalesce(avg(education), 0) +
      coalesce(avg(economic_revenue), 0) + coalesce(avg(agriculture), 0) +
      coalesce(avg(civil_registration), 0) + coalesce(avg(governance), 0)
    ) / nullif(
      (avg(infrastructure) IS NOT NULL)::int + (avg(water_sanitation) IS NOT NULL)::int +
      (avg(health) IS NOT NULL)::int + (avg(education) IS NOT NULL)::int +
      (avg(economic_revenue) IS NOT NULL)::int + (avg(agriculture) IS NOT NULL)::int +
      (avg(civil_registration) IS NOT NULL)::int + (avg(governance) IS NOT NULL)::int,
      0
    ) AS avg_overall
  FROM public.country_ratings
  GROUP BY country_code
$$;

GRANT EXECUTE ON FUNCTION public.get_country_rating_aggregates() TO anon, authenticated;
