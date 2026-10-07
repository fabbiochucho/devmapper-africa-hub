-- Search snippets showed raw codes such as "development_plan"; show "development plan" instead.
-- Same function as live, with only the snippet expressions changed.
CREATE OR REPLACE FUNCTION public.search_entities(q text, p_types text[] DEFAULT NULL::text[], p_country text DEFAULT NULL::text, p_limit integer DEFAULT 40)
 RETURNS TABLE(entity_type text, entity_id text, title text, snippet text, country_code text, source text, source_url text, path text, rank real)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
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
    SELECT 'framework', rf.id::text, rf.name, concat_ws(' · ', rf.code, replace(rf.category, '_', ' '), rf.version), NULL, 'devmapper', NULL,
           '/explore/framework/' || rf.id, 0.5
    FROM public.reporting_frameworks rf, params p
    WHERE rf.name ILIKE p.pat OR rf.code ILIKE p.pat OR rf.category ILIKE p.pat

    UNION ALL
    SELECT 'policy', rg.id::text, rg.name, concat_ws(' · ', rg.regulator_name, replace(rg.category, '_', ' '), rg.status), public.iso3(rg.country_code),
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
    SELECT 'country', ci.country_code, ci.country_name, concat_ws(' · ', replace(ci.esg_regulatory_status, '_', ' '), replace(ci.climate_disclosure_status, '_', ' ')),
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
$function$;
