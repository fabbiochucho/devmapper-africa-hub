-- Carbon marketplace settlement: retirement RPC + oversell-guard fix.
--
-- update_listing_credits_on_order() silently no-ops when a listing is
-- oversold (its UPDATE ... WHERE available_credits >= NEW.quantity simply
-- matches zero rows) instead of failing. Since this migration is landing
-- alongside the real payment flow that will finally make this trigger fire
-- for the first time, fix the silent data-integrity gap in the same pass.

CREATE OR REPLACE FUNCTION public.update_listing_credits_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_available NUMERIC;
BEGIN
  IF NEW.status = 'confirmed' OR NEW.status = 'paid' THEN
    SELECT available_credits INTO v_available
    FROM marketplace_listings
    WHERE id = NEW.listing_id
    FOR UPDATE;

    IF v_available IS NULL THEN
      RAISE EXCEPTION 'Listing % not found', NEW.listing_id;
    END IF;

    IF v_available < NEW.quantity THEN
      RAISE EXCEPTION 'Listing % oversold: % credits requested, % available',
        NEW.listing_id, NEW.quantity, v_available;
    END IF;

    UPDATE marketplace_listings
    SET available_credits = available_credits - NEW.quantity,
        listing_status = CASE WHEN available_credits - NEW.quantity <= 0 THEN 'sold_out' ELSE listing_status END,
        updated_at = now()
    WHERE id = NEW.listing_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Atomically retires a carbon credit order: flips the order, its portfolio
-- holding, and (when linked) the underlying carbon asset's retired-credits
-- counter. Retirement certificate is a stub reference for this MVP pass -
-- real certificate generation is a follow-up, not implemented here.
CREATE OR REPLACE FUNCTION public.retire_carbon_credit_order(p_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order RECORD;
  v_seller_id uuid;
  v_carbon_asset_id uuid;
BEGIN
  SELECT o.id, o.buyer_id, o.listing_id, o.status
  INTO v_order
  FROM carbon_credit_orders o
  WHERE o.id = p_order_id
  FOR UPDATE;

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  SELECT seller_id, carbon_asset_id INTO v_seller_id, v_carbon_asset_id
  FROM marketplace_listings
  WHERE id = v_order.listing_id;

  IF (select auth.uid()) IS DISTINCT FROM v_order.buyer_id
     AND (select auth.uid()) IS DISTINCT FROM v_seller_id THEN
    RAISE EXCEPTION 'Not authorized to retire order %', p_order_id;
  END IF;

  IF v_order.status NOT IN ('paid', 'delivered') THEN
    RAISE EXCEPTION 'Order % is not in a retirable state (status=%)', p_order_id, v_order.status;
  END IF;

  UPDATE carbon_credit_orders
  SET status = 'retired',
      retirement_date = now(),
      retirement_certificate_url = 'stub://' || gen_random_uuid(),
      updated_at = now()
  WHERE id = p_order_id;

  UPDATE portfolio_holdings
  SET status = 'retired',
      retired_at = now()
  WHERE order_id = p_order_id;

  -- marketplace_listings.carbon_asset_id is never set by the current UI, so
  -- this is a no-op for real orders today - kept for when that gets wired.
  IF v_carbon_asset_id IS NOT NULL THEN
    UPDATE carbon_assets
    SET credits_retired = COALESCE(credits_retired, 0) + (
      SELECT quantity FROM carbon_credit_orders WHERE id = p_order_id
    ),
      updated_at = now()
    WHERE id = v_carbon_asset_id;
  END IF;
END;
$$;
