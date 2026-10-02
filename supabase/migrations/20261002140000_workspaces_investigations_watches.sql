-- Development-intelligence layer, part 3: personal workspace.
--
-- * collections         - a user's named folders; kind 'investigation' adds a question and a trail.
-- * saved_items         - any entity saved to the personal library or a collection.
-- * investigation_steps - the search -> verify -> analyse -> decide -> act trail of an investigation.
-- * watches             - entities a user follows; a nightly job turns new links into notifications.
-- * create_user_entity()- lets users name issues, communities, interventions, sectors and risks to link to.

CREATE TABLE public.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  kind text NOT NULL DEFAULT 'collection' CHECK (kind IN ('collection', 'investigation')),
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  description text,
  question text,                        -- investigations: the question being investigated
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'concluded', 'archived')),
  conclusion text,                      -- investigations: what the evidence suggests
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX collections_user_idx ON public.collections (user_id, updated_at DESC);

CREATE TABLE public.saved_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  collection_id uuid REFERENCES public.collections(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type = ANY (public.entity_types())),
  entity_id text NOT NULL,
  title text NOT NULL,                  -- snapshot so the library still reads well if the source changes
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- NULLS NOT DISTINCT: the personal library (collection_id NULL) holds an entity once.
CREATE UNIQUE INDEX saved_items_unique ON public.saved_items (user_id, collection_id, entity_type, entity_id) NULLS NOT DISTINCT;
CREATE INDEX saved_items_collection_idx ON public.saved_items (collection_id);

CREATE TABLE public.investigation_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  step_type text NOT NULL CHECK (step_type IN ('question', 'answer', 'evidence', 'note', 'decision', 'action')),
  content text NOT NULL CHECK (length(content) BETWEEN 1 AND 20000),
  entity_type text CHECK (entity_type IS NULL OR entity_type = ANY (public.entity_types())),
  entity_id text,
  ai_session_id uuid REFERENCES public.ai_agent_sessions(id) ON DELETE SET NULL,
  citations jsonb NOT NULL DEFAULT '[]'::jsonb,   -- answers keep the citations Ndovu returned
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((entity_type IS NULL) = (entity_id IS NULL))
);
CREATE INDEX investigation_steps_collection_idx ON public.investigation_steps (collection_id, created_at);

CREATE TABLE public.watches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  entity_type text NOT NULL CHECK (entity_type = ANY (public.entity_types())),
  entity_id text NOT NULL,
  title text NOT NULL,
  last_checked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, entity_type, entity_id)
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investigation_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own collections" ON public.collections FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "Own saved items" ON public.saved_items FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND (collection_id IS NULL OR EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = (SELECT auth.uid())))
  );
CREATE POLICY "Own investigation steps" ON public.investigation_steps FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (SELECT 1 FROM public.collections c WHERE c.id = collection_id AND c.user_id = (SELECT auth.uid()) AND c.kind = 'investigation')
  );
CREATE POLICY "Own watches" ON public.watches FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

REVOKE ALL ON public.collections, public.saved_items, public.investigation_steps, public.watches FROM anon;

CREATE OR REPLACE FUNCTION public.touch_collection()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.collections SET updated_at = now()
  WHERE id = COALESCE(NEW.collection_id, OLD.collection_id);
  RETURN NULL;
END $$;
CREATE TRIGGER saved_items_touch AFTER INSERT OR DELETE ON public.saved_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_collection();
CREATE TRIGGER investigation_steps_touch AFTER INSERT OR DELETE ON public.investigation_steps
  FOR EACH ROW EXECUTE FUNCTION public.touch_collection();

-- Watched entities that gained links since the last check become one notification each.
-- Runs nightly as definer, so messages carry counts only, never titles of linked entities
-- the watcher might not be allowed to see.
CREATE OR REPLACE FUNCTION public.notify_watch_updates()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
  WITH fresh AS (
    SELECT w.id AS watch_id, w.user_id, w.entity_type, w.entity_id, w.title, count(l.id) AS new_links
    FROM public.watches w
    JOIN public.entity_links l
      ON ((l.from_type = w.entity_type AND l.from_id = w.entity_id) OR (l.to_type = w.entity_type AND l.to_id = w.entity_id))
     AND l.created_at > w.last_checked_at
     AND l.source <> 'derived'            -- derived links are rebuilt nightly; they are not news
    GROUP BY w.id
  ), sent AS (
    INSERT INTO public.notifications (user_id, title, message, type, link, metadata)
    SELECT f.user_id,
           'Updates on ' || f.title,
           f.new_links || CASE WHEN f.new_links = 1 THEN ' new connection' ELSE ' new connections' END || ' since you last checked.',
           'watch_update',
           '/explore/' || f.entity_type || '/' || f.entity_id,
           jsonb_build_object('entity_type', f.entity_type, 'entity_id', f.entity_id, 'new_links', f.new_links)
    FROM fresh f
    RETURNING 1
  )
  SELECT count(*) INTO n FROM sent;
  UPDATE public.watches SET last_checked_at = now();
  RETURN n;
END $$;
REVOKE EXECUTE ON FUNCTION public.notify_watch_updates() FROM PUBLIC, anon, authenticated;
SELECT cron.schedule('notify-watch-updates', '40 2 * * *', $$SELECT public.notify_watch_updates();$$);

-- Users may name the softer entity types the platform has no external source for.
CREATE OR REPLACE FUNCTION public.create_user_entity(p_type text, p_title text, p_summary text DEFAULT NULL, p_country text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); new_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
  IF p_type NOT IN ('community', 'issue', 'intervention', 'sector', 'risk') THEN
    RAISE EXCEPTION 'Users can create community, issue, intervention, sector or risk entities only';
  END IF;
  IF length(trim(coalesce(p_title, ''))) NOT BETWEEN 2 AND 200 THEN RAISE EXCEPTION 'Title must be 2-200 characters'; END IF;
  INSERT INTO public.entities (entity_type, title, summary, country_code, source, external_id, created_by)
  VALUES (p_type, regexp_replace(trim(p_title), '\s+', ' ', 'g'), nullif(trim(p_summary), ''), public.iso3(p_country), 'user',
          p_type || ':' || lower(regexp_replace(trim(p_title), '\s+', ' ', 'g')) || ':' || coalesce(public.iso3(p_country), 'any'), uid)
  ON CONFLICT (source, external_id) DO UPDATE SET fetched_at = public.entities.fetched_at
  RETURNING id INTO new_id;
  RETURN new_id;
END $$;
REVOKE EXECUTE ON FUNCTION public.create_user_entity(text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_user_entity(text, text, text, text) TO authenticated;
