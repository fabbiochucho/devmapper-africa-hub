-- Add unique constraint on user_roles if not exists
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);

-- Ensure profile exists for the user
INSERT INTO public.profiles (user_id, email, full_name)
VALUES ('cab07640-4a93-467d-9764-5d2b99702b64', 'fabbiochucho@gmail.com', 'Fabbio Chuchi')
ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email;

-- Delete existing roles first to avoid conflicts, then insert fresh
DELETE FROM public.user_roles WHERE user_id = 'cab07640-4a93-467d-9764-5d2b99702b64';

-- Assign all admin roles
INSERT INTO public.user_roles (user_id, role, is_active)
VALUES 
  ('cab07640-4a93-467d-9764-5d2b99702b64', 'admin', true),
  ('cab07640-4a93-467d-9764-5d2b99702b64', 'platform_admin', true),
  ('cab07640-4a93-467d-9764-5d2b99702b64', 'country_admin', true),
  ('cab07640-4a93-467d-9764-5d2b99702b64', 'citizen_reporter', true);