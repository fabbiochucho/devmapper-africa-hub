
CREATE OR REPLACE FUNCTION public.block_contact_info_in_text(p_text text)
RETURNS void
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_norm text;
  v_stripped text;
BEGIN
  IF p_text IS NULL OR length(p_text) = 0 THEN
    RETURN;
  END IF;

  v_norm := regexp_replace(p_text, '\s+', ' ', 'g');

  -- Standard email
  IF v_norm ~* '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}' THEN
    RAISE EXCEPTION 'For your safety, email addresses can''t be shared in posts or messages.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Obfuscated email: name (at) domain (dot) com
  IF v_norm ~* '[A-Z0-9._%+-]+\s*[\(\[\{]?\s*(at|@)\s*[\)\]\}]?\s*[A-Z0-9.-]+\s*[\(\[\{]?\s*(dot|\.)\s*[\)\]\}]?\s*[A-Z]{2,}' THEN
    RAISE EXCEPTION 'For your safety, email addresses can''t be shared in posts or messages.'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Strip emails before scanning for phone numbers
  v_stripped := regexp_replace(v_norm, '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}', ' ', 'gi');

  -- Phone: 8+ digits possibly separated by + ( ) . - or spaces
  IF v_stripped ~ '(\+?\d[\s().-]*){7,}\d' THEN
    RAISE EXCEPTION 'For your safety, phone numbers can''t be shared in posts or messages.'
      USING ERRCODE = 'check_violation';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.forum_posts_block_contact_info()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM public.block_contact_info_in_text(NEW.title);
  PERFORM public.block_contact_info_in_text(NEW.content);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.direct_messages_block_contact_info()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  PERFORM public.block_contact_info_in_text(NEW.content);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_forum_posts_block_contact_info ON public.forum_posts;
CREATE TRIGGER trg_forum_posts_block_contact_info
  BEFORE INSERT OR UPDATE OF title, content ON public.forum_posts
  FOR EACH ROW EXECUTE FUNCTION public.forum_posts_block_contact_info();

DROP TRIGGER IF EXISTS trg_direct_messages_block_contact_info ON public.direct_messages;
CREATE TRIGGER trg_direct_messages_block_contact_info
  BEFORE INSERT OR UPDATE OF content ON public.direct_messages
  FOR EACH ROW EXECUTE FUNCTION public.direct_messages_block_contact_info();
