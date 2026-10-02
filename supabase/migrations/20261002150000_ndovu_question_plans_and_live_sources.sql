-- Ndovu Akili routes on the question, and agents read the question and its plan from the
-- session server-side (not from the client).
ALTER TABLE public.ai_agent_sessions
  ADD COLUMN IF NOT EXISTS question text,
  ADD COLUMN IF NOT EXISTS query_plan jsonb;

COMMENT ON COLUMN public.ai_agent_sessions.query_plan IS
  'Orchestrator routing plan: {intent, searchTerms, countries (ISO3), entityTypes, classifiedBy: llm|keywords|role|default}.';

-- Live sources used by search and the intelligence agent. Results are stored in public.entities
-- with their source URL and fetch time.
INSERT INTO public.data_providers (provider_key, name, provider_type, category, description, endpoint_or_table, requires_api_key, status, geographic_coverage, license)
VALUES
  ('openalex', 'OpenAlex', 'edge_function_proxy', 'development_data',
   'Open catalogue of 250M+ scholarly works. Research matching a question is imported with authors, venue, citation count and DOI.',
   'intel (live search) / ndovu-intelligence-agent', false, 'active', 'Global', 'CC0'),
  ('eu_funding_tenders', 'EU Funding & Tenders Portal', 'edge_function_proxy', 'development_data',
   'Open and forthcoming EU calls for proposals (public SEDIA search API). Only calls whose deadline has not passed are imported.',
   'intel (live search) / ndovu-intelligence-agent', false, 'active', 'Global', 'EU Commission reuse policy (Decision 2011/833/EU)'),
  ('hdx', 'Humanitarian Data Exchange (HDX)', 'edge_function_proxy', 'development_data',
   'OCHA-run open data platform (CKAN API). Datasets matching a question are imported with publisher, coverage period and licence; licences vary per dataset.',
   'intel (live search) / ndovu-intelligence-agent', false, 'active', 'Global', 'Varies per dataset (shown on each record)')
ON CONFLICT (provider_key) DO NOTHING;

UPDATE public.data_providers
SET notes = COALESCE(notes || ' ', '') || 'Also searched live for programmes (World Bank projects API) and used for country indicators in Ndovu answers.'
WHERE provider_key = 'worldbank';

UPDATE public.data_providers
SET notes = COALESCE(notes || ' ', '') || 'Also searched live by keyword; matching activities are imported as programmes with their reporting organisation.'
WHERE provider_key = 'iati';
