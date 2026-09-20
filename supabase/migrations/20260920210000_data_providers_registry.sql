-- Data provider registry — a modification, not a rebuild.
--
-- DevMapper already has 9 real external-data connectors (7 *-proxy edge
-- functions: alphaearth, climatetrace, gee, iati, sdg, sentinel,
-- worldbank; plus erp-odoo-connector and erp-sap-connector) and one
-- internal reference-data provider (emission_factors, 34 rows: DEFRA,
-- EPA, IEA, IPCC AR6, EXIOBASE, Cornell HSI). None of them share a
-- common registry today - each is just a standalone edge function an
-- admin has to already know exists. This table is the minimal
-- "provider registry" (matching the external-intelligence architecture
-- discussion's registry concept) needed for Ndovu Akili or an admin UI
-- to answer "what data sources do I have" and "what's the status of
-- each" in one place, without touching any of the connectors
-- themselves.
CREATE TABLE public.data_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_key text NOT NULL UNIQUE,
  name text NOT NULL,
  provider_type text NOT NULL CHECK (provider_type = ANY (ARRAY[
    'edge_function_proxy', 'internal_table', 'erp_connector', 'planned'
  ])),
  category text NOT NULL CHECK (category = ANY (ARRAY[
    'emission_factors', 'geospatial', 'climate', 'development_data',
    'esg_disclosure', 'erp_supply_chain', 'sdg_indicators'
  ])),
  description text,
  endpoint_or_table text,
  requires_api_key boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status = ANY (ARRAY['active', 'needs_setup', 'planned', 'disabled'])),
  license text,
  geographic_coverage text DEFAULT 'GLOBAL',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.data_providers IS
  'Catalog of DevMapper''s external/internal data connectors. Registering '
  'a provider here does not grant it any capability - it is a directory '
  'entry, not the connector itself. Ndovu Akili can query this to explain '
  'what sources exist; admins use it to see setup status at a glance.';

ALTER TABLE public.data_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view data providers"
ON public.data_providers FOR SELECT
USING (true);

CREATE POLICY "Admins can manage data providers"
ON public.data_providers FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role));

CREATE TRIGGER update_data_providers_updated_at
BEFORE UPDATE ON public.data_providers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Register what already exists, accurately (status reflects real state,
-- not aspiration).
INSERT INTO public.data_providers (provider_key, name, provider_type, category, description, endpoint_or_table, requires_api_key, status, geographic_coverage) VALUES
  ('emission_factors', 'Emission Factor Library', 'internal_table', 'emission_factors', '34 sourced factors (DEFRA, EPA eGRID, IEA, IPCC AR6, EXIOBASE, Cornell HSI) incl. per-country African electricity grids', 'emission_factors', false, 'active', 'GLOBAL + NG,KE,ZA,EG,GH,MA,ET'),
  ('gee', 'Google Earth Engine (NDVI/vegetation)', 'edge_function_proxy', 'geospatial', 'Satellite vegetation index readings for report locations', 'gee-proxy', true, 'active', 'GLOBAL'),
  ('alphaearth', 'AlphaEarth (carbon benchmarking, ESG supplier enrichment)', 'edge_function_proxy', 'esg_disclosure', 'Sector/country carbon benchmarks and supplier enrichment', 'alphaearth-proxy', true, 'active', 'GLOBAL'),
  ('climatetrace', 'Climate TRACE', 'edge_function_proxy', 'climate', 'Independent facility/sector-level emissions tracking', 'climatetrace-proxy', false, 'active', 'GLOBAL'),
  ('sentinel', 'Sentinel', 'edge_function_proxy', 'geospatial', 'Satellite/geospatial observation provider', 'sentinel-proxy', true, 'active', 'GLOBAL'),
  ('iati', 'IATI Registry', 'edge_function_proxy', 'development_data', 'International Aid Transparency Initiative project/funding data', 'iati-proxy', false, 'active', 'GLOBAL'),
  ('worldbank', 'World Bank Open Data', 'edge_function_proxy', 'development_data', 'Development indicators by country', 'worldbank-proxy', false, 'active', 'GLOBAL'),
  ('sdg_indicators', 'UN SDG Indicators', 'edge_function_proxy', 'sdg_indicators', 'Official SDG indicator reference data', 'sdg-proxy', false, 'active', 'GLOBAL'),
  ('erp_odoo', 'Odoo ERP Connector', 'erp_connector', 'erp_supply_chain', 'Pulls supplier/procurement data from an org''s own Odoo instance', 'erp-odoo-connector', true, 'active', 'GLOBAL'),
  ('erp_sap', 'SAP ERP Connector', 'erp_connector', 'erp_supply_chain', 'Pulls supplier/procurement data from an org''s own SAP instance', 'erp-sap-connector', true, 'active', 'GLOBAL'),
  ('climatiq', 'Climatiq', 'planned', 'emission_factors', 'Broader emission-factor coverage than the local 34-row table for activities not yet in it (recommended from public-apis review)', NULL, true, 'planned', 'GLOBAL'),
  ('carbon_interface', 'Carbon Interface', 'planned', 'emission_factors', 'Alternative emission-factor API for common CO2-emitting activities (recommended from public-apis review)', NULL, true, 'planned', 'GLOBAL'),
  ('sustainmetrics', 'SustainMetrics API', 'planned', 'emission_factors', '18,000+ factors (DEFRA/EPA/ADEME/Ember) - evaluate vs. maintaining the local table by hand', NULL, true, 'planned', 'GLOBAL'),
  ('open_meteo', 'Open-Meteo', 'edge_function_proxy', 'climate', 'Free, no-auth weather/climate data (current + 7-day forecast) for a report''s lat/lng - built and verified live in the same pass as this registry, proving a new provider can be added without touching any other connector', 'open-meteo-proxy', false, 'active', 'GLOBAL');
