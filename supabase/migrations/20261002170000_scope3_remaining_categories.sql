-- GHG Protocol Scope 3 categories 8, 10, 11, 13 and 14 have no category-specific factor:
-- the standard's average-data method applies ordinary energy and fuel factors to the
-- energy used (by leased assets, franchises, processing of sold products, or sold
-- products in use). These rows reuse the library's existing cited Scope 1/2 factors -
-- copied by query, not retyped, so value, source and year stay identical - tagged with
-- the Scope 3 category so the calculator can file the emissions correctly.
--
-- Category 15 (investments) is deliberately not seeded: it is calculated with PCAF
-- financed-emissions methods (attribution factor x investee emissions), not a per-unit factor.

WITH targets(category, label, guidance) AS (VALUES
  ('cat8_upstream_leased_assets',   'Category 8 (upstream leased assets)',   'apply to the energy used by assets you lease and do not report in Scope 1/2'),
  ('cat10_processing_sold_products','Category 10 (processing of sold products)', 'apply to the energy your customers use to process your intermediate products'),
  ('cat11_use_of_sold_products',    'Category 11 (use of sold products)',    'apply to the energy or fuel your sold products consume over their lifetime'),
  ('cat13_downstream_leased_assets','Category 13 (downstream leased assets)', 'apply to the energy used by assets you own and lease to others'),
  ('cat14_franchises',              'Category 14 (franchises)',              'apply to the energy used by your franchisees')
),
base AS (
  SELECT ef.* FROM public.emission_factors ef
  WHERE (ef.scope = 2 AND ef.category = 'electricity' AND ef.activity = 'grid_consumption')
     OR (ef.scope = 1 AND ef.category = 'stationary_combustion' AND ef.activity IN ('natural_gas', 'diesel', 'lpg'))
)
INSERT INTO public.emission_factors (scope, category, activity, region, unit, factor_kgco2e, source, source_year, notes)
SELECT 3, t.category,
       CASE WHEN b.activity = 'grid_consumption' THEN 'grid_electricity' ELSE b.activity END,
       b.region, b.unit, b.factor_kgco2e, b.source, b.source_year,
       t.label || ', GHG Protocol average-data method: ' || t.guidance || '. Same physical factor as the library''s Scope '
         || b.scope || ' ' || b.category || '/' || b.activity || ' (' || b.region || ') row - ' || b.source || ' ' || coalesce(b.source_year::text, '') || '.'
FROM targets t CROSS JOIN base b
ON CONFLICT ON CONSTRAINT emission_factors_unique DO NOTHING;
