-- Development-intelligence layer, part 1: connect entities and search across them.
--
-- * entities         - catalogue of externally sourced entities (programmes, research,
--                      funding opportunities, external organisations, policies, ...),
--                      each with its provider, source URL and fetch time.
-- * entity_links     - one typed edge table relating any entity to any other
--                      ("project funded_by organization", "policy applies_in country").
-- * entity_embeddings- semantic vectors for any entity type (supersedes report_embeddings,
--                      whose rows are copied in).
-- * search_entities() / get_entity_links() / entity_label() - read APIs, all
--                      SECURITY INVOKER so existing RLS decides what each caller sees.
-- * refresh_derived_links() - rebuilds links implied by existing columns, nightly.

-- Entity types the platform can link. First-party types map to existing tables;
-- the rest live in public.entities.
CREATE OR REPLACE FUNCTION public.entity_types()
RETURNS text[] LANGUAGE sql IMMUTABLE AS $$
  SELECT ARRAY[
    'project', 'organization', 'person', 'country', 'sdg', 'indicator', 'framework',
    'policy', 'campaign', 'programme', 'research', 'dataset', 'funding_opportunity',
    'community', 'issue', 'intervention', 'sector', 'risk', 'evidence'
  ]
$$;

-- Canonical country id: ISO3. reports.country_code mixes ISO2 and ISO3.
CREATE OR REPLACE FUNCTION public.iso3(code text)
RETURNS text LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT ci.country_code FROM public.country_intelligence ci WHERE upper(ci.iso2_code) = upper(code) LIMIT 1),
    upper(NULLIF(trim(code), ''))
  )
$$;

-- ---------------------------------------------------------------- entities
CREATE TABLE public.entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type = ANY (ARRAY[
    'organization', 'policy', 'programme', 'research', 'dataset', 'funding_opportunity',
    'community', 'issue', 'intervention', 'sector', 'risk'])),
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 500),
  summary text,
  country_code text,                -- ISO3 when the source gives one
  source text NOT NULL,             -- data_providers.provider_key (e.g. 'iati', 'openalex') or 'user'
  external_id text NOT NULL,        -- the provider's own id, so re-imports update in place
  source_url text,
  published_at date,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  search tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(summary, '')), 'B')
  ) STORED,
  UNIQUE (source, external_id)
);
CREATE INDEX entities_search_idx ON public.entities USING gin (search);
CREATE INDEX entities_type_country_idx ON public.entities (entity_type, country_code);

ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Entities are public reference data" ON public.entities FOR SELECT USING (true);
CREATE POLICY "Admins manage entities" ON public.entities FOR ALL TO authenticated
  USING (has_role((SELECT auth.uid()), 'admin') OR has_role((SELECT auth.uid()), 'platform_admin'))
  WITH CHECK (has_role((SELECT auth.uid()), 'admin') OR has_role((SELECT auth.uid()), 'platform_admin'));
-- Connectors write with the service role (bypasses RLS).

COMMENT ON TABLE public.entities IS
  'Externally sourced development entities with provenance (source, source_url, fetched_at). First-party entities (projects, organisations, people, frameworks) stay in their own tables.';

-- --------------------------------------------------------------- visibility
-- Whether the caller can see an entity. SECURITY INVOKER: the subqueries run under
-- the caller's RLS, so a private report stays invisible here too.
CREATE OR REPLACE FUNCTION public.entity_visible(p_type text, p_id text)
RETURNS boolean LANGUAGE plpgsql STABLE SET search_path = public AS $$
BEGIN
  CASE p_type
    WHEN 'project' THEN
      RETURN EXISTS (SELECT 1 FROM public.reports WHERE id::text = p_id);
    WHEN 'person' THEN
      RETURN EXISTS (SELECT 1 FROM public.public_profiles WHERE user_id::text = p_id);
    WHEN 'organization' THEN
      RETURN EXISTS (SELECT 1 FROM public.organizations WHERE id::text = p_id)
          OR EXISTS (SELECT 1 FROM public.entities WHERE id::text = p_id);
    WHEN 'campaign' THEN
      RETURN EXISTS (SELECT 1 FROM public.fundraising_campaigns WHERE id::text = p_id);
    ELSE
      RETURN true;
  END CASE;
END $$;

-- Display title and in-app path for any entity the caller can see (NULL title otherwise).
CREATE OR REPLACE FUNCTION public.entity_label(p_type text, p_id text, OUT title text, OUT path text)
LANGUAGE plpgsql STABLE SET search_path = public AS $$
BEGIN
  path := '/explore/' || p_type || '/' || p_id;
  CASE p_type
    WHEN 'project' THEN
      SELECT r.title INTO title FROM public.reports r WHERE r.id::text = p_id;
      path := '/project/' || p_id;
    WHEN 'person' THEN
      SELECT pp.full_name INTO title FROM public.public_profiles pp WHERE pp.user_id::text = p_id;
    WHEN 'organization' THEN
      SELECT o.name INTO title FROM public.organizations o WHERE o.id::text = p_id;
      IF title IS NULL THEN
        SELECT e.title INTO title FROM public.entities e WHERE e.id::text = p_id;
      END IF;
    WHEN 'country' THEN
      SELECT ci.country_name INTO title FROM public.country_intelligence ci WHERE ci.country_code = p_id;
      title := COALESCE(title, p_id);
    WHEN 'sdg' THEN
      title := 'SDG ' || p_id;
    WHEN 'framework' THEN
      SELECT rf.name INTO title FROM public.reporting_frameworks rf WHERE rf.id::text = p_id;
    WHEN 'indicator' THEN
      SELECT fi.indicator_name INTO title FROM public.framework_indicators fi WHERE fi.id::text = p_id;
    WHEN 'campaign' THEN
      SELECT c.title INTO title FROM public.fundraising_campaigns c WHERE c.id::text = p_id;
    WHEN 'policy' THEN
      SELECT rg.name INTO title FROM public.regulatory_frameworks rg WHERE rg.id::text = p_id;
      IF title IS NULL THEN
        SELECT e.title INTO title FROM public.entities e WHERE e.id::text = p_id;
      END IF;
    ELSE
      SELECT e.title INTO title FROM public.entities e WHERE e.id::text = p_id;
  END CASE;
END $$;

-- ------------------------------------------------------------- entity_links
CREATE TABLE public.entity_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_type text NOT NULL CHECK (from_type = ANY (public.entity_types())),
  from_id text NOT NULL,
  to_type text NOT NULL CHECK (to_type = ANY (public.entity_types())),
  to_id text NOT NULL,
  relation text NOT NULL CHECK (relation ~ '^[a-z_]{2,40}$'),
  source text NOT NULL,             -- 'derived', 'user', or a provider_key
  source_ref text,                  -- URL or record id backing the link
  confidence numeric(3, 2) NOT NULL DEFAULT 1 CHECK (confidence BETWEEN 0 AND 1),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (from_type, from_id, to_type, to_id, relation),
  CHECK (NOT (from_type = to_type AND from_id = to_id))
);
CREATE INDEX entity_links_from_idx ON public.entity_links (from_type, from_id);
CREATE INDEX entity_links_to_idx ON public.entity_links (to_type, to_id);

ALTER TABLE public.entity_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "See links between visible entities" ON public.entity_links FOR SELECT
  USING (public.entity_visible(from_type, from_id) AND public.entity_visible(to_type, to_id));
CREATE POLICY "Users add their own links" ON public.entity_links FOR INSERT TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid()) AND source = 'user'
    AND public.entity_visible(from_type, from_id) AND public.entity_visible(to_type, to_id)
  );
CREATE POLICY "Users remove their own links" ON public.entity_links FOR DELETE TO authenticated
  USING (created_by = (SELECT auth.uid()) AND source = 'user');
CREATE POLICY "Admins manage links" ON public.entity_links FOR ALL TO authenticated
  USING (has_role((SELECT auth.uid()), 'admin') OR has_role((SELECT auth.uid()), 'platform_admin'))
  WITH CHECK (has_role((SELECT auth.uid()), 'admin') OR has_role((SELECT auth.uid()), 'platform_admin'));

-- Links touching one entity, with the other side resolved for display.
CREATE OR REPLACE FUNCTION public.get_entity_links(p_type text, p_id text, p_limit int DEFAULT 100)
RETURNS TABLE (
  link_id uuid, direction text, relation text, other_type text, other_id text,
  other_title text, other_path text, source text, source_ref text, confidence numeric
)
LANGUAGE sql STABLE SET search_path = public AS $$
  WITH l AS (
    SELECT id, 'out'::text AS direction, relation, to_type AS other_type, to_id AS other_id, source, source_ref, confidence
    FROM public.entity_links WHERE from_type = p_type AND from_id = p_id
    UNION ALL
    SELECT id, 'in', relation, from_type, from_id, source, source_ref, confidence
    FROM public.entity_links WHERE to_type = p_type AND to_id = p_id
  )
  SELECT l.id, l.direction, l.relation, l.other_type, l.other_id, lbl.title, lbl.path, l.source, l.source_ref, l.confidence
  FROM l CROSS JOIN LATERAL public.entity_label(l.other_type, l.other_id) lbl
  WHERE lbl.title IS NOT NULL
  ORDER BY l.confidence DESC, l.relation, lbl.title
  LIMIT LEAST(p_limit, 500)
$$;

-- --------------------------------------------------------------- search
-- Keyword search across every entity type the caller can see. RLS on each
-- underlying table applies (SECURITY INVOKER).
CREATE OR REPLACE FUNCTION public.search_entities(
  q text, p_types text[] DEFAULT NULL, p_country text DEFAULT NULL, p_limit int DEFAULT 40
)
RETURNS TABLE (
  entity_type text, entity_id text, title text, snippet text, country_code text,
  source text, source_url text, path text, rank real
)
LANGUAGE sql STABLE SET search_path = public AS $$
  WITH params AS (
    SELECT websearch_to_tsquery('simple', q) AS tsq,
           '%' || replace(replace(replace(trim(q), '\', '\\'), '%', '\%'), '_', '\_') || '%' AS pat,
           public.iso3(p_country) AS cc
  ),
  hits AS (
    SELECT 'project'::text AS entity_type, r.id::text AS entity_id, r.title, left(r.description, 240) AS snippet,
           public.iso3(r.country_code) AS country_code, 'devmapper'::text AS source, NULL::text AS source_url,
           '/project/' || r.id AS path,
           ts_rank(to_tsvector('simple', r.title || ' ' || coalesce(r.description, '')), p.tsq)
             + CASE WHEN r.title ILIKE p.pat THEN 0.5 ELSE 0 END AS rank
    FROM public.reports r, params p
    WHERE to_tsvector('simple', r.title || ' ' || coalesce(r.description, '') || ' ' || coalesce(r.location, '')) @@ p.tsq
       OR r.title ILIKE p.pat OR r.location ILIKE p.pat

    UNION ALL
    SELECT 'organization', o.id::text, o.name, o.primary_sector, public.iso3(o.incorporation_country), 'devmapper', NULL,
           '/explore/organization/' || o.id, 0.6
    FROM public.organizations o, params p
    WHERE o.name ILIKE p.pat OR o.primary_sector ILIKE p.pat

    UNION ALL
    SELECT 'person', pp.user_id::text, pp.full_name, pp.organization, public.iso3(pp.country), 'devmapper', NULL,
           '/explore/person/' || pp.user_id, 0.4
    FROM public.public_profiles pp, params p
    WHERE pp.full_name ILIKE p.pat OR pp.organization ILIKE p.pat

    UNION ALL
    SELECT 'framework', rf.id::text, rf.name, concat_ws(' · ', rf.code, rf.category, rf.version), NULL, 'devmapper', NULL,
           '/explore/framework/' || rf.id, 0.5
    FROM public.reporting_frameworks rf, params p
    WHERE rf.name ILIKE p.pat OR rf.code ILIKE p.pat OR rf.category ILIKE p.pat

    UNION ALL
    SELECT 'policy', rg.id::text, rg.name, concat_ws(' · ', rg.regulator_name, rg.category, rg.status), public.iso3(rg.country_code),
           'devmapper', rg.source_url, '/explore/policy/' || rg.id, 0.5
    FROM public.regulatory_frameworks rg, params p
    WHERE rg.name ILIKE p.pat OR rg.regulator_name ILIKE p.pat OR rg.category ILIKE p.pat

    UNION ALL
    SELECT 'indicator', fi.id::text, fi.indicator_name, left(fi.description, 240), NULL, 'devmapper', NULL,
           '/explore/indicator/' || fi.id, 0.4
    FROM public.framework_indicators fi, params p
    WHERE fi.indicator_name ILIKE p.pat OR fi.indicator_code ILIKE p.pat

    UNION ALL
    SELECT 'campaign', c.id::text, c.title, left(c.description, 240), NULL, 'devmapper', NULL, '/fundraising', 0.5
    FROM public.fundraising_campaigns c, params p
    WHERE c.title ILIKE p.pat OR c.description ILIKE p.pat

    UNION ALL
    SELECT 'country', ci.country_code, ci.country_name, concat_ws(' · ', ci.esg_regulatory_status, ci.climate_disclosure_status),
           ci.country_code, 'devmapper', NULL, '/explore/country/' || ci.country_code, 0.9
    FROM public.country_intelligence ci, params p
    WHERE ci.country_name ILIKE p.pat OR ci.country_code ILIKE trim(q) OR ci.iso2_code ILIKE trim(q)

    UNION ALL
    SELECT e.entity_type, e.id::text, e.title, left(e.summary, 240), e.country_code, e.source, e.source_url,
           '/explore/' || e.entity_type || '/' || e.id, ts_rank(e.search, p.tsq)
    FROM public.entities e, params p
    WHERE e.search @@ p.tsq OR e.title ILIKE p.pat
  )
  SELECT h.entity_type, h.entity_id, h.title, h.snippet, h.country_code, h.source, h.source_url, h.path, h.rank::real
  FROM hits h, params p
  WHERE length(trim(q)) >= 2
    AND (p_types IS NULL OR h.entity_type = ANY (p_types))
    AND (p.cc IS NULL OR h.country_code = p.cc)
  ORDER BY h.rank DESC, h.title
  LIMIT LEAST(GREATEST(p_limit, 1), 200)
$$;

-- --------------------------------------------------------- derived links
-- Links implied by data already in the platform. Rebuilt wholesale so a changed
-- column (e.g. a report's SDG) never leaves a stale link behind.
CREATE OR REPLACE FUNCTION public.refresh_derived_links()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  DELETE FROM public.entity_links WHERE source = 'derived';

  INSERT INTO public.entity_links (from_type, from_id, to_type, to_id, relation, source, source_ref, confidence, created_by)
  SELECT DISTINCT ON (from_type, from_id, to_type, to_id, relation) *
  FROM (
    SELECT 'project', r.id::text, 'sdg', r.sdg_goal::text, 'addresses', 'derived', 'reports.sdg_goal', 1.0, NULL::uuid
      FROM public.reports r WHERE r.sdg_goal BETWEEN 1 AND 17
    UNION ALL
    SELECT 'project', r.id::text, 'country', public.iso3(r.country_code), 'located_in', 'derived', 'reports.country_code', 1.0, NULL
      FROM public.reports r WHERE public.iso3(r.country_code) IS NOT NULL
    UNION ALL
    SELECT 'project', r.id::text, 'organization', o.id::text, 'funded_by', 'derived', 'reports.funder', 0.6, NULL
      FROM public.reports r JOIN public.organizations o ON lower(trim(o.name)) = lower(trim(r.funder))
      WHERE r.funder IS NOT NULL
    UNION ALL
    SELECT 'campaign', c.id::text, 'project', c.report_id::text, 'funds', 'derived', 'fundraising_campaigns.report_id', 1.0, NULL
      FROM public.fundraising_campaigns c WHERE c.report_id IS NOT NULL
    UNION ALL
    SELECT 'campaign', c.id::text, 'sdg', g::text, 'addresses', 'derived', 'fundraising_campaigns.sdg_goals', 1.0, NULL
      FROM public.fundraising_campaigns c, unnest(c.sdg_goals) g WHERE g BETWEEN 1 AND 17
    UNION ALL
    SELECT 'organization', o.id::text, 'country', public.iso3(cc), 'operates_in', 'derived', 'organizations.operating_countries', 1.0, NULL
      FROM public.organizations o, unnest(coalesce(o.operating_countries, '{}') || o.incorporation_country) cc
      WHERE public.iso3(cc) IS NOT NULL
    UNION ALL
    SELECT 'organization', o.id::text, 'project', pa.report_id::text, coalesce(nullif(regexp_replace(lower(pa.relationship_type), '[^a-z]+', '_', 'g'), ''), 'partner_on'),
           'derived', 'project_affiliations', 0.9, NULL
      FROM public.project_affiliations pa JOIN public.organizations o ON lower(trim(o.name)) = lower(trim(pa.organization_name))
    UNION ALL
    SELECT 'person', pa.user_id::text, 'project', pa.report_id::text, coalesce(nullif(regexp_replace(lower(pa.relationship_type), '[^a-z]+', '_', 'g'), ''), 'partner_on'),
           'derived', 'project_affiliations', 1.0, NULL
      FROM public.project_affiliations pa WHERE pa.user_id IS NOT NULL
    UNION ALL
    SELECT 'policy', rg.id::text, 'country', public.iso3(rg.country_code), 'applies_in', 'derived', 'regulatory_frameworks.country_code', 1.0, NULL
      FROM public.regulatory_frameworks rg WHERE public.iso3(rg.country_code) IS NOT NULL
    UNION ALL
    SELECT 'indicator', fi.id::text, 'framework', fi.framework_id::text, 'part_of', 'derived', 'framework_indicators.framework_id', 1.0, NULL
      FROM public.framework_indicators fi WHERE fi.framework_id IS NOT NULL
    UNION ALL
    SELECT e.entity_type, e.id::text, 'country', e.country_code, 'located_in', 'derived', 'entities.country_code', 1.0, NULL
      FROM public.entities e WHERE e.country_code IS NOT NULL
  ) s(from_type, from_id, to_type, to_id, relation, source, source_ref, confidence, created_by)
  WHERE length(relation) BETWEEN 2 AND 40
  ON CONFLICT (from_type, from_id, to_type, to_id, relation) DO NOTHING;

  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;
REVOKE EXECUTE ON FUNCTION public.refresh_derived_links() FROM PUBLIC, anon, authenticated;

SELECT public.refresh_derived_links();
SELECT cron.schedule('refresh-derived-entity-links', '20 2 * * *', $$SELECT public.refresh_derived_links();$$);

-- ------------------------------------------------------- entity_embeddings
CREATE TABLE public.entity_embeddings (
  entity_type text NOT NULL CHECK (entity_type = ANY (public.entity_types())),
  entity_id text NOT NULL,
  embedding extensions.vector(1536) NOT NULL,
  source_text text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (entity_type, entity_id)
);
ALTER TABLE public.entity_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "See embeddings of visible entities" ON public.entity_embeddings FOR SELECT
  USING (public.entity_visible(entity_type, entity_id));
-- Written only by the entity-embeddings edge function (service role).

INSERT INTO public.entity_embeddings (entity_type, entity_id, embedding, source_text, updated_at)
SELECT 'project', report_id::text, embedding, source_text, updated_at FROM public.report_embeddings
ON CONFLICT DO NOTHING;

-- Semantic search over visible entities (SECURITY INVOKER: caller's RLS applies).
CREATE OR REPLACE FUNCTION public.match_entity_embeddings(
  query_embedding extensions.vector(1536), match_count int DEFAULT 8, p_types text[] DEFAULT NULL
)
RETURNS TABLE (entity_type text, entity_id text, title text, path text, source_text text, similarity float)
LANGUAGE sql STABLE SET search_path = public, extensions AS $$
  SELECT ee.entity_type, ee.entity_id, lbl.title, lbl.path, ee.source_text, 1 - (ee.embedding <=> query_embedding)
  FROM public.entity_embeddings ee
  CROSS JOIN LATERAL public.entity_label(ee.entity_type, ee.entity_id) lbl
  WHERE (p_types IS NULL OR ee.entity_type = ANY (p_types)) AND lbl.title IS NOT NULL
  ORDER BY ee.embedding <=> query_embedding
  LIMIT LEAST(GREATEST(match_count, 1), 50)
$$;

-- report_embeddings / match_report_embeddings are left in place (no longer called);
-- remove them separately once entity_embeddings is confirmed in production.

GRANT EXECUTE ON FUNCTION public.search_entities(text, text[], text, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_entity_links(text, text, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.entity_label(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_entity_embeddings(extensions.vector, int, text[]) TO authenticated;

-- Register the catalogue in the provider registry so admins see it.
INSERT INTO public.data_providers (provider_key, name, provider_type, category, description, endpoint_or_table, requires_api_key, status, geographic_coverage)
VALUES ('devmapper_entities', 'DevMapper entity catalogue', 'internal_table', 'development_data',
        'Externally sourced programmes, research, funding opportunities and organisations, each stored with its source and fetch time, and linked to projects and countries through entity_links.',
        'entities', false, 'active', 'Global')
ON CONFLICT (provider_key) DO NOTHING;
