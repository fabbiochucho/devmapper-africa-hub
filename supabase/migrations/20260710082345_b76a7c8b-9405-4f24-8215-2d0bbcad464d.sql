
CREATE OR REPLACE FUNCTION public.enforce_carbon_order_listing_snapshot()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing_price NUMERIC;
  v_available NUMERIC;
BEGIN
  SELECT price_per_tonne, available_credits
    INTO v_listing_price, v_available
  FROM public.marketplace_listings
  WHERE id = NEW.listing_id
  FOR SHARE;

  IF v_listing_price IS NULL THEN
    RAISE EXCEPTION 'Listing % not found', NEW.listing_id;
  END IF;

  IF NEW.quantity IS NULL OR NEW.quantity <= 0 THEN
    RAISE EXCEPTION 'Order quantity must be greater than zero';
  END IF;

  IF NEW.quantity > v_available THEN
    RAISE EXCEPTION 'Requested quantity (%) exceeds available credits (%)', NEW.quantity, v_available;
  END IF;

  NEW.price_per_tonne := v_listing_price;
  NEW.total_amount := ROUND((v_listing_price * NEW.quantity)::numeric, 2);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_carbon_order_listing_snapshot_ins ON public.carbon_credit_orders;
CREATE TRIGGER enforce_carbon_order_listing_snapshot_ins
BEFORE INSERT ON public.carbon_credit_orders
FOR EACH ROW EXECUTE FUNCTION public.enforce_carbon_order_listing_snapshot();

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
  THEN
    IF current_setting('request.jwt.claim.role', true) IS DISTINCT FROM 'service_role'
       AND session_user <> 'service_role' THEN
      RAISE EXCEPTION 'Order pricing fields are immutable after creation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS block_carbon_order_price_update_upd ON public.carbon_credit_orders;
CREATE TRIGGER block_carbon_order_price_update_upd
BEFORE UPDATE ON public.carbon_credit_orders
FOR EACH ROW EXECUTE FUNCTION public.block_carbon_order_price_update();

REVOKE ALL ON public.mv_dashboard_stats FROM anon, authenticated;
GRANT SELECT ON public.mv_dashboard_stats TO service_role;
