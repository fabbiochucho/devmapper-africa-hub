-- Fix mutable search_path on is_user_admin
CREATE OR REPLACE FUNCTION public.is_user_admin(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = target_user_id AND ur.role = 'admin'
  );
$$;

-- Fix mutable search_path on validate_role_assignment
CREATE OR REPLACE FUNCTION public.validate_role_assignment()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  calling_uid uuid;
  caller_is_admin boolean;
BEGIN
  IF NEW.role IS DISTINCT FROM 'admin' THEN
    RETURN NEW;
  END IF;

  BEGIN
    calling_uid := (SELECT auth.uid());
  EXCEPTION WHEN others THEN
    calling_uid := NULL;
  END;

  IF current_setting('is_superuser', true) IS NOT NULL AND current_setting('is_superuser') = 'on' THEN
    RETURN NEW;
  END IF;

  IF calling_uid IS NULL THEN
    RETURN NEW;
  END IF;

  caller_is_admin := public.is_user_admin(calling_uid);

  IF NOT caller_is_admin THEN
    RAISE EXCEPTION 'Only admins can assign admin roles';
  END IF;

  RETURN NEW;
END;
$function$;