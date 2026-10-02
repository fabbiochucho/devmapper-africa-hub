-- 1) National development plans as policies (regulatory_frameworks, category 'development_plan').
--    Not obligations: mandatory = false, and rule-engine leaves this category out of exposure scoring.
-- 2) entities_missing_embeddings(): what the intel 'backfill' action embeds (nightly cron, see below).

ALTER TABLE public.regulatory_frameworks DROP CONSTRAINT regulatory_frameworks_category_check;
ALTER TABLE public.regulatory_frameworks ADD CONSTRAINT regulatory_frameworks_category_check
  CHECK (category = ANY (ARRAY['esg', 'climate', 'carbon', 'financial', 'governance', 'labor', 'health', 'ngo',
                               'procurement', 'tax', 'foreign_funding', 'development_plan']));

-- Adopted plans only (as of 2026-10). Drafts (Nigeria MTNDP 2026-2030, Ghana MTNDPF 2026-2029) are left
-- out until adopted.
INSERT INTO public.regulatory_frameworks
  (country_code, name, category, regulator_name, mandatory, applicable_entity_types, reporting_frequency, effective_date, enforcement_risk, status, source_url)
SELECT v.country_code, v.name, 'development_plan', v.regulator_name, false, '["government", "ngo", "legal_entity"]'::jsonb,
       NULL, v.effective_date::date, NULL, 'active', v.source_url
FROM (VALUES
  ('KEN', 'Kenya Vision 2030 (Fourth Medium Term Plan 2023-2027)', 'State Department for Economic Planning', '2008-06-10', 'https://vision2030.go.ke/'),
  ('NGA', 'Nigeria Agenda 2050', 'Federal Ministry of Budget and Economic Planning', NULL, 'https://nationalplanning.gov.ng/'),
  ('ZAF', 'National Development Plan 2030', 'National Planning Commission', NULL, 'https://www.nationalplanningcommission.org.za/'),
  ('EGY', 'Egypt Vision 2030 (Sustainable Development Strategy)', 'Ministry of Planning, Economic Development and International Cooperation', '2016-02-24', 'https://mped.gov.eg/'),
  ('ETH', 'Ten Years Development Plan 2021-2030', 'Ministry of Planning and Development', NULL, NULL),
  ('RWA', 'National Strategy for Transformation (NST2) 2024-2029', 'Ministry of Finance and Economic Planning', NULL, 'https://www.minecofin.gov.rw/'),
  ('SEN', 'Vision Sénégal 2050 - Agenda national de transformation', 'Ministère de l''Économie, du Plan et de la Coopération', NULL, NULL),
  ('CIV', 'Plan National de Développement (PND) 2026-2030', 'Ministère du Plan et du Développement', '2026-05-07', 'https://www.gouv.ci/'),
  ('MAR', 'New Development Model (Nouveau Modèle de Développement)', 'Special Commission on the Development Model', '2021-05-25', 'https://www.csmd.ma/'),
  ('TZA', 'Tanzania Development Vision 2050', 'National Planning Commission', '2025-07-17', NULL),
  ('UGA', 'Fourth National Development Plan (NDP IV) 2025/26-2029/30', 'National Planning Authority', '2025-07-01', 'https://www.npa.go.ug/')
) AS v(country_code, name, regulator_name, effective_date, source_url)
WHERE NOT EXISTS (SELECT 1 FROM public.regulatory_frameworks rf WHERE rf.country_code = v.country_code AND rf.name = v.name);

-- Types indexEntity() can read source text for (see _shared/intel.ts entitySourceText).
-- ponytail: random order so a few permanently failing rows can't starve the batch; fine at this scale.
CREATE OR REPLACE FUNCTION public.entities_missing_embeddings(p_limit int DEFAULT 50)
RETURNS TABLE (entity_type text, entity_id text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.entity_type, c.entity_id FROM (
    SELECT 'project'::text AS entity_type, id::text AS entity_id FROM public.reports
    UNION ALL SELECT 'organization', id::text FROM public.organizations
    UNION ALL SELECT 'framework', id::text FROM public.reporting_frameworks
    UNION ALL SELECT 'policy', id::text FROM public.regulatory_frameworks
    UNION ALL SELECT e.entity_type, e.id::text FROM public.entities e
  ) c
  WHERE NOT EXISTS (SELECT 1 FROM public.entity_embeddings ee
                    WHERE ee.entity_type = c.entity_type AND ee.entity_id = c.entity_id)
  ORDER BY random()
  LIMIT LEAST(GREATEST(p_limit, 1), 500)
$$;
REVOKE EXECUTE ON FUNCTION public.entities_missing_embeddings(int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.entities_missing_embeddings(int) TO service_role;

-- Nightly jobs that call edge functions. They read the service-role key from Vault
-- (secret 'service_role_key', created out of band - never committed).
SELECT cron.schedule('backfill-entity-embeddings', '50 2 * * *', $$
  SELECT net.http_post(
    url := 'https://ptfrzwsivtetvmdotfui.supabase.co/functions/v1/intel',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization',
      'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')),
    body := '{"action": "backfill", "limit": 100}'::jsonb,
    timeout_milliseconds := 120000)
$$);

SELECT cron.schedule('email-digest', '0 6 * * *', $$
  SELECT net.http_post(
    url := 'https://ptfrzwsivtetvmdotfui.supabase.co/functions/v1/email-digest',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization',
      'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000)
$$);
