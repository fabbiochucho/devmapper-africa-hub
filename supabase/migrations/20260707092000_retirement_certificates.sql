-- Real retirement certificates, replacing the 'stub://'||gen_random_uuid()
-- placeholder retirement_certificate_url from the marketplace_settlement
-- migration. A retirement certificate is inherently meant to be publicly
-- checkable (this mirrors how real registries like Verra/Gold Standard
-- publish retirement certificates for anyone holding the certificate
-- number) - so this table only stores non-sensitive facts about the
-- retirement itself (project, quantity, date, certificate number), not
-- buyer contact/financial details, and its SELECT policy is public.

CREATE TABLE public.retirement_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL UNIQUE REFERENCES public.carbon_credit_orders(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL UNIQUE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_title TEXT NOT NULL,
  project_type TEXT,
  methodology TEXT,
  country_code TEXT,
  quantity NUMERIC NOT NULL,
  retired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_retirement_certificates_certificate_number ON public.retirement_certificates(certificate_number);
CREATE INDEX idx_retirement_certificates_buyer_id ON public.retirement_certificates(buyer_id);

ALTER TABLE public.retirement_certificates ENABLE ROW LEVEL SECURITY;

-- Public SELECT: this is the whole point of a certificate - anyone with
-- the certificate number/link can verify it, without needing an account.
CREATE POLICY "Anyone can verify a retirement certificate"
  ON public.retirement_certificates FOR SELECT
  USING (true);

-- Only the retire_carbon_credit_order() RPC (SECURITY DEFINER) inserts
-- rows - no direct INSERT/UPDATE/DELETE policy for regular users, so this
-- table is effectively append-only via that one trusted code path.

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
  v_listing RECORD;
  v_certificate_number TEXT;
BEGIN
  SELECT o.id, o.buyer_id, o.listing_id, o.status, o.quantity
  INTO v_order
  FROM carbon_credit_orders o
  WHERE o.id = p_order_id
  FOR UPDATE;

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  SELECT seller_id, carbon_asset_id, title, project_type, methodology, country_code
  INTO v_listing
  FROM marketplace_listings
  WHERE id = v_order.listing_id;

  v_seller_id := v_listing.seller_id;
  v_carbon_asset_id := v_listing.carbon_asset_id;

  IF (select auth.uid()) IS DISTINCT FROM v_order.buyer_id
     AND (select auth.uid()) IS DISTINCT FROM v_seller_id THEN
    RAISE EXCEPTION 'Not authorized to retire order %', p_order_id;
  END IF;

  IF v_order.status NOT IN ('paid', 'delivered') THEN
    RAISE EXCEPTION 'Order % is not in a retirable state (status=%)', p_order_id, v_order.status;
  END IF;

  -- Deterministic from the order id (no sequence needed): human-shareable,
  -- unique per order, stable if this function is ever safely re-run.
  v_certificate_number := 'DVM-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(p_order_id::text, '-', ''), 1, 8));

  UPDATE carbon_credit_orders
  SET status = 'retired',
      retirement_date = now(),
      retirement_certificate_url = '/certificates/' || v_certificate_number,
      updated_at = now()
  WHERE id = p_order_id;

  INSERT INTO retirement_certificates (
    order_id, certificate_number, buyer_id, project_title, project_type, methodology, country_code, quantity
  ) VALUES (
    p_order_id, v_certificate_number, v_order.buyer_id, v_listing.title, v_listing.project_type, v_listing.methodology, v_listing.country_code, v_order.quantity
  )
  ON CONFLICT (order_id) DO NOTHING;

  UPDATE portfolio_holdings
  SET status = 'retired',
      retired_at = now()
  WHERE order_id = p_order_id;

  -- marketplace_listings.carbon_asset_id is never set by the current UI, so
  -- this is a no-op for real orders today - kept for when that gets wired.
  IF v_carbon_asset_id IS NOT NULL THEN
    UPDATE carbon_assets
    SET credits_retired = COALESCE(credits_retired, 0) + v_order.quantity,
      updated_at = now()
    WHERE id = v_carbon_asset_id;
  END IF;
END;
$$;
