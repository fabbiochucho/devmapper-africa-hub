-- ============================================================
-- FIX: Lovable security scan findings (4 of 5 - public_profiles'
-- security_invoker gap is tracked separately, needs a design decision
-- since it's load-bearing for cross-user profile search).
-- ============================================================

-- ------------------------------------------------------------
-- 1. increment_campaign_raised_amount: no auth check at all, and no
--    REVOKE was ever issued after CREATE FUNCTION, so it inherited the
--    default PUBLIC execute grant - anon could call it directly via
--    supabase.rpc(...) and arbitrarily inflate/deflate any campaign's
--    displayed fundraising total with zero connection to a real payment.
--    It is only ever legitimately called from flutterwave-webhook/
--    paystack-webhook using the service-role client after verifying a
--    real payment - restrict execution to that role.
-- ------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.increment_campaign_raised_amount(uuid, numeric) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_campaign_raised_amount(uuid, numeric) TO service_role;

-- ------------------------------------------------------------
-- 2. match_report_embeddings: trusted a caller-supplied requesting_user_id
--    instead of checking auth.uid(), and was GRANTed to `authenticated`
--    directly - so any signed-in user could pass another user's UUID
--    (trivially obtainable from the public_profiles view) or an admin's
--    UUID to read that user's private reports. Its only real caller is
--    supabase/functions/_shared/agent-utils.ts's fetchSimilarReports(),
--    invoked via the service-role client after the calling edge function
--    has already validated the JWT and derived requesting_user_id from
--    it (see report-embeddings/index.ts) - so restricting execution to
--    service_role closes the bypass without touching that legitimate path.
-- ------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.match_report_embeddings(extensions.vector, int, uuid) FROM PUBLIC, authenticated;
GRANT EXECUTE ON FUNCTION public.match_report_embeddings(extensions.vector, int, uuid) TO service_role;

-- ------------------------------------------------------------
-- 3. block_carbon_order_price_update: already blocks a seller from
--    changing listing_id/price_per_tonne/quantity/total_amount on a
--    buyer's order via the "Sellers update fulfilment on listing orders"
--    policy, but buyer_notes was left out of the guarded-field list - a
--    seller could still silently overwrite a buyer's notes on any order
--    tied to their own listing. buyer_notes is buyer-authored context
--    for the seller to read, not a field either party should revise
--    after the order is placed, so it joins the same immutable-after-
--    creation set as the pricing fields.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.block_carbon_order_price_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.listing_id IS DISTINCT FROM OLD.listing_id
     OR NEW.price_per_tonne IS DISTINCT FROM OLD.price_per_tonne
     OR NEW.quantity IS DISTINCT FROM OLD.quantity
     OR NEW.total_amount IS DISTINCT FROM OLD.total_amount
     OR NEW.buyer_notes IS DISTINCT FROM OLD.buyer_notes
  THEN
    IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role'
       AND session_user <> 'service_role' THEN
      RAISE EXCEPTION 'Order pricing and buyer-notes fields are immutable after creation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------
-- 4. list_users_by_role was only ever meant for `authenticated` (see its
--    original migration), but Postgres's implicit PUBLIC execute grant
--    on newly-created functions was never revoked, so anon could call it
--    too. Low incremental risk today (it only returns full_name/
--    organization, already exposed via public_profiles), but tightening
--    to match original intent as defense-in-depth.
-- ------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.list_users_by_role(app_role) FROM PUBLIC;
