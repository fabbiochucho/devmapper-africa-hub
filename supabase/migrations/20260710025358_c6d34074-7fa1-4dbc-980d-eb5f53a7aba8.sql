
-- 1. analytics_events: drop overly permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated only analytics" ON public.analytics_events;

-- 2. realtime.messages: scope to actual conversation participants / private topics
DROP POLICY IF EXISTS "Authenticated can write realtime messages" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can read realtime messages" ON realtime.messages;

CREATE POLICY "Users read own realtime topics"
ON realtime.messages FOR SELECT
TO authenticated
USING (
  (SELECT auth.uid()) IS NOT NULL AND (
    (realtime.topic() LIKE 'conversation:%' AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.user_id = (SELECT auth.uid())
        AND cp.conversation_id::text = split_part(realtime.topic(), ':', 2)
    ))
    OR (realtime.topic() = 'user:' || (SELECT auth.uid())::text)
    OR realtime.topic() IN ('public','forum','marketplace','notifications')
  )
);

CREATE POLICY "Users write own realtime topics"
ON realtime.messages FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.uid()) IS NOT NULL AND (
    (realtime.topic() LIKE 'conversation:%' AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.user_id = (SELECT auth.uid())
        AND cp.conversation_id::text = split_part(realtime.topic(), ':', 2)
    ))
    OR (realtime.topic() = 'user:' || (SELECT auth.uid())::text)
  )
);

-- 3. carbon_credit_orders: sellers see orders via safe view (no buyer_notes / payment_reference)
DROP POLICY IF EXISTS "Buyers can view own orders" ON public.carbon_credit_orders;
DROP POLICY IF EXISTS "Buyers and sellers can update orders" ON public.carbon_credit_orders;

CREATE POLICY "Buyers view own orders"
ON public.carbon_credit_orders FOR SELECT
TO authenticated
USING (auth.uid() = buyer_id);

CREATE OR REPLACE VIEW public.carbon_credit_orders_seller_view
WITH (security_invoker = true) AS
SELECT id, listing_id, buyer_id, quantity, price_per_tonne, total_amount, currency,
       status, retirement_date, retirement_certificate_url, created_at, updated_at
FROM public.carbon_credit_orders
WHERE listing_id IN (
  SELECT id FROM public.marketplace_listings WHERE seller_id = auth.uid()
);

GRANT SELECT ON public.carbon_credit_orders_seller_view TO authenticated;

CREATE POLICY "Buyers update own orders"
ON public.carbon_credit_orders FOR UPDATE
TO authenticated
USING (auth.uid() = buyer_id)
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Sellers update fulfilment on listing orders"
ON public.carbon_credit_orders FOR UPDATE
TO authenticated
USING (
  listing_id IN (SELECT id FROM public.marketplace_listings WHERE seller_id = auth.uid())
)
WITH CHECK (
  listing_id IN (SELECT id FROM public.marketplace_listings WHERE seller_id = auth.uid())
);

-- 4. project-files storage: consolidate to org-membership-only access
DROP POLICY IF EXISTS "User folder read project-files" ON storage.objects;
DROP POLICY IF EXISTS "User folder insert project-files" ON storage.objects;
DROP POLICY IF EXISTS "User folder update project-files" ON storage.objects;
DROP POLICY IF EXISTS "User folder delete project-files" ON storage.objects;
DROP POLICY IF EXISTS "Project files are accessible to organization members" ON storage.objects;

CREATE POLICY "Org members can read project files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'project-files' AND EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.user_id = (SELECT auth.uid())
      AND om.organization_id::text = (storage.foldername(name))[1]
  )
);

-- 5. avatars: restrict SELECT to authenticated (blocks anon LIST); public reads still work via signed URLs / storage API by object name for known paths
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images readable by authenticated"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

-- 6. Revoke EXECUTE from anon/authenticated on system-only SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.reset_monthly_quotas() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.refresh_dashboard_stats() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_refresh_dashboard_stats() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_test_role(uuid, app_role, text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_assign_verifier(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_audit_event(uuid, text, uuid, text, text, uuid, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.record_webhook_event(text, text, text, jsonb, text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_webhook_processed(text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_esg_to_targets(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_test_accounts() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_esg_updated_at_column() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_feedback() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_verification() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_donation() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_broadcast() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.initialize_verification_workflow() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.init_certification_workflow() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_conversation_on_message() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_listing_credits_on_order() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_verifier_reputation() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_forum_post_likes_count() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_org_data_share_revoke_only() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.forum_posts_block_contact_info() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.direct_messages_block_contact_info() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_role_assignment() FROM anon, authenticated;

-- 7. Reduce GraphQL/PostgREST schema exposure to anon
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon;

REVOKE ALL ON public.audit_logs FROM anon, authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
REVOKE ALL ON public.webhook_events FROM anon, authenticated;
REVOKE ALL ON public.user_roles FROM anon;
REVOKE ALL ON public.ai_audit_log FROM anon;
REVOKE ALL ON public.ai_agent_outputs FROM anon;
REVOKE ALL ON public.ai_agent_sessions FROM anon;
REVOKE ALL ON public.ai_conversations FROM anon;
REVOKE ALL ON public.direct_messages FROM anon;
REVOKE ALL ON public.conversations FROM anon;
REVOKE ALL ON public.conversation_participants FROM anon;
REVOKE ALL ON public.notifications FROM anon;
REVOKE ALL ON public.notification_preferences FROM anon;
REVOKE ALL ON public.esg_indicators FROM anon;
REVOKE ALL ON public.esg_scenarios FROM anon;
REVOKE ALL ON public.esg_suppliers FROM anon;
REVOKE ALL ON public.esg_supplier_emissions FROM anon;
REVOKE ALL ON public.esg_audit_logs FROM anon;
REVOKE ALL ON public.organization_members FROM anon;
REVOKE ALL ON public.organization_data_shares FROM anon;
REVOKE ALL ON public.billing_events FROM anon;
REVOKE ALL ON public.carbon_credit_orders FROM anon;
REVOKE ALL ON public.carbon_portfolios FROM anon;
REVOKE ALL ON public.portfolio_holdings FROM anon;
REVOKE ALL ON public.retirement_certificates FROM anon;
REVOKE ALL ON public.support_tickets FROM anon;
REVOKE ALL ON public.contact_submissions FROM anon;
REVOKE ALL ON public.verification_ledger FROM anon;
REVOKE ALL ON public.verification_logs FROM anon;
REVOKE ALL ON public.verification_assignments FROM anon;
REVOKE ALL ON public.verification_scores FROM anon;
REVOKE ALL ON public.report_flags FROM anon;
REVOKE ALL ON public.feedback_votes FROM anon;
REVOKE ALL ON public.forum_post_likes FROM anon;
REVOKE ALL ON public.project_affiliations FROM anon;
REVOKE ALL ON public.project_carbon_data FROM anon;
REVOKE ALL ON public.project_dism_scores FROM anon;
REVOKE ALL ON public.project_financial_impact FROM anon;
REVOKE ALL ON public.project_procurement FROM anon;
REVOKE ALL ON public.compliance_scores FROM anon;
REVOKE ALL ON public.carbon_compliance FROM anon;
REVOKE ALL ON public.corporate_targets FROM anon;
REVOKE ALL ON public.certification_applications FROM anon;
REVOKE ALL ON public.evidence_items FROM anon;
REVOKE ALL ON public.regulatory_exposure_profiles FROM anon;
REVOKE ALL ON public.erp_connections FROM anon;
REVOKE ALL ON public.scholarships FROM anon;
REVOKE ALL ON public.entity_locations FROM anon;
REVOKE ALL ON public.admin_broadcasts FROM anon;
REVOKE ALL ON public.analytics_events FROM anon;
