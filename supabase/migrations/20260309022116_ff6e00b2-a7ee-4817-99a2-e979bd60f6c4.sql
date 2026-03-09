
DO $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_emails text[] := ARRAY['admin@test.devmapper.africa', 'fabbiochucho@gmail.com'];
BEGIN
  FOREACH v_email IN ARRAY v_emails LOOP
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
    IF v_user_id IS NOT NULL THEN
      INSERT INTO public.user_roles (user_id, role, is_active)
      VALUES (v_user_id, 'admin'::app_role, true)
      ON CONFLICT (user_id, role) DO UPDATE SET is_active = true;

      INSERT INTO public.user_roles (user_id, role, is_active)
      VALUES (v_user_id, 'platform_admin'::app_role, true)
      ON CONFLICT (user_id, role) DO UPDATE SET is_active = true;

      UPDATE public.profiles
      SET full_name = COALESCE(NULLIF(full_name, ''), split_part(v_email, '@', 1)),
          country = COALESCE(NULLIF(country, ''), 'Global')
      WHERE user_id = v_user_id;
    END IF;
  END LOOP;
END $$;
