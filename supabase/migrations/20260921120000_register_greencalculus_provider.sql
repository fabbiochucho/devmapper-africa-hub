-- §7/15 Scope-3 factor coverage: registers the newly-built greencalculus-proxy
-- (backed by a real GREENCALCULUS_API_KEY secret, 16,673 sourced DEFRA/DESNZ+
-- other factors behind an auditable calculation API) in the existing
-- data_providers registry, matching every other connector's entry shape.
INSERT INTO public.data_providers (provider_key, name, provider_type, category, description, endpoint_or_table, requires_api_key, status, license, geographic_coverage)
VALUES (
  'greencalculus',
  'GreenCalculus',
  'edge_function_proxy',
  'emission_factors',
  'Auditable emission-factor calculation API (DEFRA/DESNZ-sourced, source id + cell reference on every response) - used to extend Scope 3 category coverage beyond the local 34-row table with cited, verifiable values',
  'greencalculus-proxy',
  true,
  'active',
  'Free tier: 1,000 calls/month, attribution required',
  'GLOBAL'
)
ON CONFLICT (provider_key) DO NOTHING;
