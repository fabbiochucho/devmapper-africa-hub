
-- 1. Ensure RLS is enabled on all target tables (idempotent)
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'verifier_profiles','verification_assignments','reporting_frameworks',
    'framework_indicators','ai_agent_sessions','ai_agent_outputs','ai_audit_log',
    'carbon_assets','carbon_compliance','carbon_credit_orders','carbon_portfolios',
    'carbon_transfer_logs','marketplace_listings','portfolio_holdings','project_carbon_data'
  ])
  LOOP
    IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
               WHERE n.nspname='public' AND c.relname=t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END $$;

-- 2. Admin SELECT safety-net policies (idempotent via drop-if-exists)
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'verifier_profiles','verification_assignments','reporting_frameworks',
    'framework_indicators','ai_agent_sessions','ai_agent_outputs','ai_audit_log',
    'carbon_assets','carbon_compliance','carbon_credit_orders','carbon_portfolios',
    'carbon_transfer_logs','marketplace_listings','portfolio_holdings','project_carbon_data'
  ])
  LOOP
    IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
               WHERE n.nspname='public' AND c.relname=t) THEN
      EXECUTE format('DROP POLICY IF EXISTS "Admins select all %I" ON public.%I', t, t);
      EXECUTE format(
        'CREATE POLICY "Admins select all %I" ON public.%I FOR SELECT TO authenticated USING (public.has_role((SELECT auth.uid()), ''admin''::app_role) OR public.has_role((SELECT auth.uid()), ''platform_admin''::app_role))',
        t, t
      );
    END IF;
  END LOOP;
END $$;

-- 3. Storage policies: user-folder scoping for 'project-files' and 'documents'
--    Path convention: <auth.uid()>/rest/of/path

-- project-files (add user-scoped policies alongside existing org-based ones)
DROP POLICY IF EXISTS "User folder read project-files" ON storage.objects;
CREATE POLICY "User folder read project-files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'project-files'
  AND (
    (SELECT auth.uid())::text = (storage.foldername(name))[1]
    OR public.has_role((SELECT auth.uid()), 'admin'::app_role)
    OR public.has_role((SELECT auth.uid()), 'platform_admin'::app_role)
  )
);

DROP POLICY IF EXISTS "User folder insert project-files" ON storage.objects;
CREATE POLICY "User folder insert project-files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'project-files'
  AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "User folder update project-files" ON storage.objects;
CREATE POLICY "User folder update project-files"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'project-files'
  AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "User folder delete project-files" ON storage.objects;
CREATE POLICY "User folder delete project-files"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'project-files'
  AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
);

-- documents: enforce user-folder + admin read-all
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'documents'
  AND (
    (SELECT auth.uid())::text = (storage.foldername(name))[1]
    OR public.has_role((SELECT auth.uid()), 'admin'::app_role)
    OR public.has_role((SELECT auth.uid()), 'platform_admin'::app_role)
  )
);

DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'documents'
  AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'documents'
  AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
);
