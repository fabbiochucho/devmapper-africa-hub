-- Fix the remaining function search path issue
CREATE OR REPLACE FUNCTION public.update_esg_updated_at_column()
RETURNS trigger 
LANGUAGE plpgsql 
SET search_path = public  -- Add missing search_path
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;