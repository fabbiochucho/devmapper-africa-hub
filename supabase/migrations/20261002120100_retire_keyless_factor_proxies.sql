-- climatiq-proxy and carbon-interface-proxy were deployed but never called and have no API key.
-- They are removed from the codebase (restore from git history when a key exists);
-- GreenCalculus (configured) is now the external factor source behind the carbon calculator.
UPDATE public.data_providers
SET status = 'planned',
    endpoint_or_table = NULL,
    notes = 'Proxy removed 2026-10-02 (no API key, no caller). Restore from git history and add the API key secret to enable.'
WHERE provider_key IN ('climatiq', 'carbon_interface');

UPDATE public.data_providers
SET notes = COALESCE(notes || ' ', '') || 'Used by the carbon calculator to search and import cited factors not in the local library.'
WHERE provider_key = 'greencalculus';
