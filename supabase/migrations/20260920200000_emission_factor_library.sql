-- Citation trail for project_carbon_data, wired to the emission_factors
-- table (already exists live with 34 real, sourced factors - DEFRA, EPA
-- eGRID, IEA, IPCC AR6, EXIOBASE, Cornell HSI, including per-country
-- African electricity-grid factors - but was never referenced from any
-- frontend code; every carbon entry today is a raw self-reported
-- "Estimated Emissions (tCO2e)" number typed by the user with no
-- calculation and no source).
--
-- Adds the real "Emissions = Activity Data x Emission Factor"
-- calculation with a citable factor behind every number - directly the
-- gap identified when reviewing sustainmetrics.net's emission-factor
-- citation model. estimated_emissions_tco2e stays as the final figure
-- (kept for backward compatibility with existing manually-entered rows
-- and as the fallback for activities with no matching factor), but is
-- now computed (activity_quantity * factor_kgco2e / 1000) client-side
-- whenever a factor is attached, rather than freely typed.
ALTER TABLE public.project_carbon_data
  ADD COLUMN activity_quantity numeric,
  ADD COLUMN activity_unit text,
  ADD COLUMN emission_factor_id uuid REFERENCES public.emission_factors(id),
  ADD COLUMN calculation_method text NOT NULL DEFAULT 'manual_entry'
    CHECK (calculation_method = ANY (ARRAY['activity_based', 'manual_entry']));

COMMENT ON COLUMN public.project_carbon_data.calculation_method IS
  'activity_based: activity_quantity x emission_factors.factor_kgco2e (kg->tCO2e), '
  'with a real citation via emission_factor_id. manual_entry: a raw '
  'self-reported figure with no calculation trail - the pre-existing '
  'behavior, kept for activities with no matching factor in the library.';
