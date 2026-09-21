-- Found during this session's Forum audit: Forum.tsx's handleReply only
-- incremented forum_posts.replies_count (via a non-atomic client
-- read-then-write, racy under concurrent replies) and discarded the reply
-- text entirely - "Reply posted!" toasted success while nothing was ever
-- saved or visible to anyone, including the person who wrote it.
CREATE TABLE public.forum_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.forum_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Forum replies are viewable by everyone"
ON public.forum_replies FOR SELECT
USING (true);

CREATE POLICY "Users can create forum replies"
ON public.forum_replies FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own replies"
ON public.forum_replies FOR UPDATE
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors and admins can delete replies"
ON public.forum_replies FOR DELETE
USING (
  auth.uid() = author_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'platform_admin'::app_role)
);

CREATE INDEX idx_forum_replies_post ON public.forum_replies(post_id, created_at);

CREATE TRIGGER update_forum_replies_updated_at
BEFORE UPDATE ON public.forum_replies
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Maintain forum_posts.replies_count server-side (atomic, race-free)
-- instead of the client doing read-current-count-then-write-count+1.
CREATE OR REPLACE FUNCTION public.sync_forum_post_replies_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_posts SET replies_count = replies_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_posts SET replies_count = GREATEST(replies_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER sync_forum_post_replies_count_trigger
AFTER INSERT OR DELETE ON public.forum_replies
FOR EACH ROW EXECUTE FUNCTION public.sync_forum_post_replies_count();
