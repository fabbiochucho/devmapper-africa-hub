-- Assign correct roles to test accounts
-- First, clear existing roles for test accounts to avoid duplicates
DELETE FROM public.user_roles 
WHERE user_id IN (
  SELECT user_id FROM public.profiles 
  WHERE email LIKE '%@test.devmapper.africa'
);

-- Get user_ids and insert correct roles based on email prefix
INSERT INTO public.user_roles (user_id, role, is_active)
SELECT 
  p.user_id,
  CASE 
    WHEN p.email = 'ngo@test.devmapper.africa' THEN 'ngo_member'::public.app_role
    WHEN p.email = 'government@test.devmapper.africa' THEN 'government_official'::public.app_role
    WHEN p.email = 'corporate@test.devmapper.africa' THEN 'company_representative'::public.app_role
    WHEN p.email = 'changemaker@test.devmapper.africa' THEN 'change_maker'::public.app_role
    WHEN p.email = 'citizen@test.devmapper.africa' THEN 'citizen_reporter'::public.app_role
    WHEN p.email = 'admin@test.devmapper.africa' THEN 'admin'::public.app_role
  END,
  true
FROM public.profiles p
WHERE p.email IN (
  'ngo@test.devmapper.africa',
  'government@test.devmapper.africa',
  'corporate@test.devmapper.africa',
  'changemaker@test.devmapper.africa',
  'citizen@test.devmapper.africa',
  'admin@test.devmapper.africa'
);

-- Also add citizen_reporter as a secondary role for the changemaker (citizen can be changemaker too)
INSERT INTO public.user_roles (user_id, role, is_active)
SELECT p.user_id, 'citizen_reporter'::public.app_role, true
FROM public.profiles p
WHERE p.email = 'changemaker@test.devmapper.africa'
ON CONFLICT (user_id, role) DO NOTHING;

-- Add change_maker as a secondary role for citizen reporter (citizen can also be changemaker)
INSERT INTO public.user_roles (user_id, role, is_active)
SELECT p.user_id, 'change_maker'::public.app_role, true
FROM public.profiles p
WHERE p.email = 'citizen@test.devmapper.africa'
ON CONFLICT (user_id, role) DO NOTHING;