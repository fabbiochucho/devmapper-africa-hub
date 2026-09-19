-- ============================================================
-- FIX: Signup role selection was silently discarded
-- ============================================================
-- Previously, Auth.tsx tried to update the user's chosen role via a
-- client-side `.from('user_roles').update(...)` call right after signUp().
-- Two independent things made this impossible: (1) user_roles UPDATE is
-- admin-only per RLS (see 20260309003340), and (2) with email confirmation
-- required, there is no active session at that point anyway - auth.uid()
-- is NULL, so even a permissive self-service policy wouldn't have helped.
--
-- Fix: the chosen role now travels in signUp()'s user metadata
-- (auth.users.raw_user_meta_data.selected_role, set client-side), which is
-- available synchronously at insert time regardless of session state. This
-- trigger already runs SECURITY DEFINER unconditionally on every
-- auth.users insert, so it can apply the role directly.
--
-- SECURITY: raw_user_meta_data is client-supplied and NOT trustworthy - a
-- client could set selected_role to 'admin'. The CASE below is an
-- allowlist of the non-privileged roles only; anything else (including a
-- privileged-role attempt, or no selection) falls through to the safe
-- 'citizen_reporter' default. Never cast raw_user_meta_data directly to
-- app_role.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_role public.app_role;
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');

  v_role := CASE NEW.raw_user_meta_data ->> 'selected_role'
    WHEN 'ngo_member' THEN 'ngo_member'::app_role
    WHEN 'government_official' THEN 'government_official'::app_role
    WHEN 'company_representative' THEN 'company_representative'::app_role
    WHEN 'change_maker' THEN 'change_maker'::app_role
    WHEN 'funder' THEN 'funder'::app_role
    ELSE 'citizen_reporter'::app_role
  END;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role);

  RETURN NEW;
END;
$function$;
