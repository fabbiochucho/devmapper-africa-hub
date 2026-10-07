-- Signed-out search failed with "permission denied for table entities": search_entities() and
-- get_entity_links() are granted to anon and run as the caller, but anon had no SELECT on the
-- tables they read. RLS already makes these public ("Entities are public reference data",
-- "See links between visible entities"); this adds the table privilege that RLS sits on top of.
GRANT SELECT ON public.entities, public.entity_links TO anon;
