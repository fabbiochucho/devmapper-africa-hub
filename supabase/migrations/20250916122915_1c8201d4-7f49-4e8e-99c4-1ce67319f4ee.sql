-- Fix remaining security issues: remove obsolete function and fix search paths

-- Remove the obsolete refresh_dashboard_stats function since we no longer have a materialized view
DROP FUNCTION IF EXISTS public.refresh_dashboard_stats();

-- Update functions that need search_path set for security
CREATE OR REPLACE FUNCTION public.update_forum_post_likes_count()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public  -- Fix missing search_path
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.forum_posts 
    SET likes_count = likes_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.forum_posts 
    SET likes_count = likes_count - 1
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_role_assignment()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public  -- Fix missing search_path
AS $function$
BEGIN
  -- Prevent self-assignment of admin roles unless already admin
  IF NEW.role IN ('platform_admin', 'admin') AND NEW.user_id = auth.uid() THEN
    IF NOT (has_role(auth.uid(), 'platform_admin') OR has_role(auth.uid(), 'admin')) THEN
      RAISE EXCEPTION 'Cannot self-assign admin roles';
    END IF;
  END IF;
  
  -- Ensure only admins can assign admin roles
  IF NEW.role IN ('platform_admin', 'admin') THEN
    IF NOT (has_role(auth.uid(), 'platform_admin') OR has_role(auth.uid(), 'admin')) THEN
      RAISE EXCEPTION 'Only admins can assign admin roles';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;