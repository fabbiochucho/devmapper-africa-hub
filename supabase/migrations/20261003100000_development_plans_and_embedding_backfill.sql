-- 1) National development plans as policies (regulatory_frameworks, category 'development_plan').
--    Not obligations: mandatory = false, and rule-engine leaves this category out of exposure scoring.
-- 2) entities_missing_embeddings(): what the intel 'backfill' action embeds (nightly cron, see below).

ALTER TABLE public.regulatory_frameworks DROP CONSTRAINT regulatory_frameworks_category_check;
ALTER TABLE public.regulatory_frameworks ADD CONSTRAINT regulatory_frameworks_category_check
  CHECK (category = ANY (ARRAY['esg', 'climate', 'carbon', 'financial', 'governance', 'labor', 'health', 'ngo',
                               'procurement', 'tax', 'foreign_funding', 'development_plan']));

-- The current plan for each of the 54 AU member states, as of 2026-10. Plans that have
-- lapsed with a successor still being drafted are 'superseded' (BEN, MDG, TGO); 'archived' where
-- nothing newer has been published (ERI, GNB). Drafts not yet adopted (Nigeria MTNDP 2026-2030)
-- are left out. Bodies, dates and URLs only where confirmed; NULL otherwise.
INSERT INTO public.regulatory_frameworks
  (country_code, name, category, regulator_name, mandatory, applicable_entity_types, reporting_frequency, effective_date, enforcement_risk, status, source_url)
SELECT v.country_code, v.name, 'development_plan', v.regulator_name, false, '["government", "ngo", "legal_entity"]'::jsonb,
       NULL, v.effective_date::date, NULL, v.status, v.source_url
FROM (VALUES
  ('DZA', 'Plan d''action du Gouvernement (Government Action Plan)', NULL, NULL, NULL, 'active'),
  ('AGO', 'Plano de Desenvolvimento Nacional (PDN) 2023-2027', 'Ministério da Economia e Planeamento', NULL, NULL, 'active'),
  ('BEN', 'Programme d''Actions du Gouvernement (PAG) 2021-2026', 'Présidence de la République', NULL, 'https://www.gouv.bj/', 'superseded'),
  ('BWA', 'National Development Plan 12 (NDP 12) 2025-2030', 'Ministry of Finance', NULL, NULL, 'active'),
  ('BFA', 'Plan de relance 2026-2030', NULL, NULL, NULL, 'active'),
  ('BDI', 'Vision Burundi pays émergent en 2040, pays développé en 2060', NULL, NULL, NULL, 'active'),
  ('CPV', 'Plano Estratégico de Desenvolvimento Sustentável (PEDS II) 2022-2026 - Ambição 2030', NULL, NULL, NULL, 'active'),
  ('CMR', 'Stratégie Nationale de Développement 2020-2030 (SND30)', 'Ministère de l''Économie, de la Planification et de l''Aménagement du Territoire', NULL, NULL, 'active'),
  ('CAF', 'Plan National de Développement (PND-RCA) 2024-2028', NULL, NULL, NULL, 'active'),
  ('TCD', 'Plan National de Développement « Tchad Connexion 2030 » 2025-2030', NULL, '2025-05-29', NULL, 'active'),
  ('COM', 'Plan Comores Émergent 2030 (PCE)', NULL, NULL, NULL, 'active'),
  ('COD', 'Plan National Stratégique de Développement (PNSD) 2024-2028', 'Ministère du Plan', NULL, NULL, 'active'),
  ('COG', 'Plan National de Développement (PND) 2022-2026', NULL, NULL, NULL, 'active'),
  ('CIV', 'Plan National de Développement (PND) 2026-2030', 'Ministère du Plan et du Développement', '2026-05-07', 'https://www.gouv.ci/', 'active'),
  ('DJI', 'Vision Djibouti 2035', NULL, NULL, NULL, 'active'),
  ('EGY', 'Egypt Vision 2030 (Sustainable Development Strategy)', 'Ministry of Planning, Economic Development and International Cooperation', '2016-02-24', 'https://mped.gov.eg/', 'active'),
  ('GNQ', 'Agenda Guinea Ecuatorial 2035', NULL, NULL, NULL, 'active'),
  ('ERI', 'National Indicative Development Plan (NIDP) 2014-2018', NULL, NULL, NULL, 'archived'),
  ('SWZ', 'National Development Plan 2023/24-2027/28', 'Ministry of Economic Planning and Development', NULL, NULL, 'active'),
  ('ETH', 'Ten Years Development Plan 2021-2030', 'Ministry of Planning and Development', NULL, NULL, 'active'),
  ('GAB', 'Plan National de Croissance et de Développement (PNCD) 2026-2030', NULL, NULL, NULL, 'active'),
  ('GMB', 'Recovery-Focused National Development Plan (RF-NDP) 2023-2027', 'Ministry of Finance and Economic Affairs', NULL, NULL, 'active'),
  ('GHA', 'Medium-Term National Development Policy Framework 2026-2029', 'National Development Planning Commission', NULL, 'https://ndpc.gov.gh/', 'active'),
  ('GIN', 'Simandou 2040', NULL, NULL, NULL, 'active'),
  ('GNB', 'Plano Nacional de Desenvolvimento 2020-2023', NULL, NULL, NULL, 'archived'),
  ('KEN', 'Kenya Vision 2030 (Fourth Medium Term Plan 2023-2027)', 'State Department for Economic Planning', '2008-06-10', 'https://vision2030.go.ke/', 'active'),
  ('LSO', 'National Strategic Development Plan II (extended to 2027/28)', 'Ministry of Development Planning', NULL, NULL, 'active'),
  ('LBR', 'ARREST Agenda for Inclusive Development (AAID) 2025-2029', 'Ministry of Finance and Development Planning', NULL, NULL, 'active'),
  ('LBY', 'Development Plan 2025-2027 (Law No. 3 of 2025)', 'House of Representatives', NULL, NULL, 'active'),
  ('MDG', 'Plan Émergence Madagascar (PEM)', NULL, NULL, NULL, 'superseded'),
  ('MWI', 'Malawi 2063 (MW2063)', 'National Planning Commission', NULL, NULL, 'active'),
  ('MLI', 'Stratégie nationale pour l''émergence et le développement durable (SNEDD) 2024-2033', NULL, NULL, NULL, 'active'),
  ('MRT', 'Stratégie de Croissance Accélérée et de Prospérité Partagée (SCAPP) 2016-2030', NULL, NULL, NULL, 'active'),
  ('MUS', 'Vision 2030', NULL, NULL, NULL, 'active'),
  ('MAR', 'New Development Model (Nouveau Modèle de Développement)', 'Special Commission on the Development Model', '2021-05-25', 'https://www.csmd.ma/', 'active'),
  ('MOZ', 'Estratégia Nacional de Desenvolvimento (ENDE) 2025-2044', NULL, NULL, NULL, 'active'),
  ('NAM', 'Sixth National Development Plan (NDP6) 2025/26-2029/30', 'National Planning Commission', NULL, NULL, 'active'),
  ('NER', 'Programme de Résilience pour la Sauvegarde de la Patrie (PRSP) 2024-2026', NULL, NULL, NULL, 'active'),
  ('NGA', 'Nigeria Agenda 2050', 'Federal Ministry of Budget and Economic Planning', NULL, 'https://nationalplanning.gov.ng/', 'active'),
  ('RWA', 'National Strategy for Transformation (NST2) 2024-2029', 'Ministry of Finance and Economic Planning', NULL, 'https://www.minecofin.gov.rw/', 'active'),
  ('STP', 'Estratégia Nacional de Desenvolvimento Sustentável 2026-2040', NULL, NULL, NULL, 'active'),
  ('SEN', 'Vision Sénégal 2050 - Agenda national de transformation', 'Ministère de l''Économie, du Plan et de la Coopération', NULL, NULL, 'active'),
  ('SYC', 'National Development Strategy 2024-2028', 'Ministry of Finance, National Planning and Trade', NULL, 'https://www.finance.gov.sc/', 'active'),
  ('SLE', 'Medium-Term National Development Plan 2024-2030', 'Ministry of Planning and Economic Development', NULL, NULL, 'active'),
  ('SOM', 'National Transformation Plan (NTP) 2025-2029', 'Ministry of Planning, Investment and Economic Development', '2025-03-17', 'https://mop.gov.so/', 'active'),
  ('ZAF', 'National Development Plan 2030', 'National Planning Commission', NULL, 'https://www.nationalplanningcommission.org.za/', 'active'),
  ('SSD', 'South Sudan Development Plan (SSDP) 2026-2036', 'Ministry of Finance and Planning', NULL, NULL, 'active'),
  ('SDN', 'National Strategic Plan 2007-2031 (Quarter-Century Strategy)', NULL, NULL, NULL, 'active'),
  ('TZA', 'Tanzania Development Vision 2050', 'National Planning Commission', '2025-07-17', NULL, 'active'),
  ('TGO', 'Feuille de route gouvernementale Togo 2020-2025', NULL, NULL, NULL, 'superseded'),
  ('TUN', 'Plan de développement 2026-2030', NULL, '2026-07-17', NULL, 'active'),
  ('UGA', 'Fourth National Development Plan (NDP IV) 2025/26-2029/30', 'National Planning Authority', '2025-07-01', 'https://www.npa.go.ug/', 'active'),
  ('ZMB', 'Eighth National Development Plan (8NDP) 2022-2026', 'Ministry of Finance and National Planning', NULL, NULL, 'active'),
  ('ZWE', 'National Development Strategy 2 (NDS2) 2026-2030', 'Ministry of Finance, Economic Development and Investment Promotion', NULL, NULL, 'active')
) AS v(country_code, name, regulator_name, effective_date, source_url, status)
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
