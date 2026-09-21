-- Roadmap follow-up: "wire Climatiq or Carbon Interface as a fallback
-- provider" and "add 2-3 more African grid-electricity factors."

-- 1. climatiq-proxy and carbon-interface-proxy are now fully built (real,
-- confirmed request/response shapes), just waiting on API keys neither of
-- which this session has - same "not yet activated" honest-degradation
-- pattern as iati-proxy. Flips their registry rows from 'planned' (no code
-- exists) to 'needs_setup' (code exists, needs a secret) and points them
-- at the real function names.
UPDATE public.data_providers
SET status = 'needs_setup', endpoint_or_table = 'climatiq-proxy'
WHERE provider_key = 'climatiq';

UPDATE public.data_providers
SET status = 'needs_setup', endpoint_or_table = 'carbon-interface-proxy'
WHERE provider_key = 'carbon_interface';

-- 2. Three more African grid-electricity factors, sourced live from
-- GreenCalculus (Ember Yearly Electricity Data 2025, data year 2024).
-- IMPORTANT: the source itself explicitly flags these as full-LIFECYCLE
-- intensity figures (includes upstream fuel supply chain + plant
-- manufacture; excludes T&D losses and net imports), NOT a GHG Protocol
-- Scope 2 location-based factor - and confirms no genuine location-based
-- factor has been sourced for these countries at all (the location_based
-- key was formally vacated for each). Rather than silently mix a
-- different kind of metric into the existing IEA-sourced Scope 2
-- 'electricity' category (which would misrepresent what the number
-- means), these get their own distinct category so the calculator UI can
-- label them accurately.
INSERT INTO public.emission_factors (scope, category, activity, region, unit, factor_kgco2e, source, source_year, notes) VALUES
  (3, 'electricity_lifecycle_estimate', 'grid_consumption', 'RW', 'kWh', 0.35398, 'Ember Yearly Electricity Data', 2024,
   'NOT a GHG Protocol Scope 2 location-based factor - full lifecycle intensity (fuel supply chain + plant manufacture + combustion), excludes T&D losses/imports. No genuine Scope 2 location-based factor exists yet for Rwanda in any source checked. Via GreenCalculus. Verify: https://verify.greencalculus.com/grid.rwa.electricity.lifecycle_intensity@2026.194'),
  (3, 'electricity_lifecycle_estimate', 'grid_consumption', 'SN', 'kWh', 0.53997, 'Ember Yearly Electricity Data', 2024,
   'NOT a GHG Protocol Scope 2 location-based factor - full lifecycle intensity (fuel supply chain + plant manufacture + combustion), excludes T&D losses/imports. No genuine Scope 2 location-based factor exists yet for Senegal in any source checked. Via GreenCalculus. Verify: https://verify.greencalculus.com/grid.sen.electricity.lifecycle_intensity@2026.194'),
  (3, 'electricity_lifecycle_estimate', 'grid_consumption', 'CI', 'kWh', 0.40501, 'Ember Yearly Electricity Data', 2024,
   'NOT a GHG Protocol Scope 2 location-based factor - full lifecycle intensity (fuel supply chain + plant manufacture + combustion), excludes T&D losses/imports. No genuine Scope 2 location-based factor exists yet for Cote d''Ivoire in any source checked. Via GreenCalculus. Verify: https://verify.greencalculus.com/grid.civ.electricity.lifecycle_intensity@2026.194')
ON CONFLICT (scope, category, activity, region, source) DO NOTHING;
