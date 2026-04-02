
-- =====================================================
-- VERIFIER PROFILES & MARKETPLACE
-- =====================================================
CREATE TABLE public.verifier_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  credentials TEXT[],
  methodologies TEXT[],
  regions TEXT[],
  verification_count INTEGER DEFAULT 0,
  approval_rate NUMERIC(5,2) DEFAULT 0,
  reputation_score NUMERIC(5,2) DEFAULT 0,
  is_certified BOOLEAN DEFAULT false,
  organization_name TEXT,
  profile_image_url TEXT,
  availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'unavailable')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.verifier_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view verifier profiles"
  ON public.verifier_profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage own verifier profile"
  ON public.verifier_profiles FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- VERIFICATION ASSIGNMENTS
-- =====================================================
CREATE TABLE public.verification_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
  verifier_id UUID REFERENCES public.verifier_profiles(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'rejected', 'expired')),
  assignment_type TEXT DEFAULT 'manual' CHECK (assignment_type IN ('manual', 'auto', 'requested')),
  stage TEXT DEFAULT 'field' CHECK (stage IN ('field', 'technical', 'compliance')),
  notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  review_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.verification_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view verification assignments"
  ON public.verification_assignments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Report owners and verifiers can manage assignments"
  ON public.verification_assignments FOR ALL TO authenticated
  USING (
    auth.uid() = assigned_by
    OR verifier_id IN (SELECT id FROM public.verifier_profiles WHERE user_id = auth.uid())
    OR report_id IN (SELECT id FROM public.reports WHERE user_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() = assigned_by
    OR verifier_id IN (SELECT id FROM public.verifier_profiles WHERE user_id = auth.uid())
  );

-- =====================================================
-- VERIFIER REVIEWS (reputation building)
-- =====================================================
CREATE TABLE public.verifier_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verifier_id UUID REFERENCES public.verifier_profiles(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES auth.users(id) NOT NULL,
  assignment_id UUID REFERENCES public.verification_assignments(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.verifier_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view reviews" ON public.verifier_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create reviews" ON public.verifier_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id);

-- =====================================================
-- CARBON MARKETPLACE LISTINGS
-- =====================================================
CREATE TABLE public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID REFERENCES auth.users(id) NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  report_id UUID REFERENCES public.reports(id),
  carbon_asset_id UUID REFERENCES public.carbon_assets(id),
  title TEXT NOT NULL,
  description TEXT,
  project_type TEXT CHECK (project_type IN ('reforestation', 'cookstoves', 'renewable_energy', 'waste_management', 'mangrove', 'soil_carbon', 'other')),
  methodology TEXT,
  vintage_year INTEGER,
  country_code TEXT,
  location TEXT,
  sdg_goals INTEGER[],
  total_credits NUMERIC DEFAULT 0,
  available_credits NUMERIC DEFAULT 0,
  price_per_tonne NUMERIC(12,2),
  currency TEXT DEFAULT 'USD',
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'gold_standard', 'verra')),
  listing_status TEXT DEFAULT 'draft' CHECK (listing_status IN ('draft', 'active', 'paused', 'sold_out', 'expired')),
  co_benefits JSONB DEFAULT '[]',
  images TEXT[],
  documents TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active listings"
  ON public.marketplace_listings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Sellers can manage own listings"
  ON public.marketplace_listings FOR ALL TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- =====================================================
-- CARBON CREDIT ORDERS (purchase flow)
-- =====================================================
CREATE TABLE public.carbon_credit_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES auth.users(id) NOT NULL,
  listing_id UUID REFERENCES public.marketplace_listings(id) NOT NULL,
  quantity NUMERIC NOT NULL,
  price_per_tonne NUMERIC(12,2) NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'delivered', 'retired', 'cancelled', 'refunded')),
  payment_reference TEXT,
  retirement_date TIMESTAMPTZ,
  retirement_certificate_url TEXT,
  buyer_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.carbon_credit_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own orders"
  ON public.carbon_credit_orders FOR SELECT TO authenticated
  USING (
    auth.uid() = buyer_id
    OR listing_id IN (SELECT id FROM public.marketplace_listings WHERE seller_id = auth.uid())
  );

CREATE POLICY "Authenticated can create orders"
  ON public.carbon_credit_orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers and sellers can update orders"
  ON public.carbon_credit_orders FOR UPDATE TO authenticated
  USING (
    auth.uid() = buyer_id
    OR listing_id IN (SELECT id FROM public.marketplace_listings WHERE seller_id = auth.uid())
  );

-- =====================================================
-- CARBON PORTFOLIOS
-- =====================================================
CREATE TABLE public.carbon_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL DEFAULT 'My Portfolio',
  description TEXT,
  target_tonnes NUMERIC,
  budget_usd NUMERIC,
  risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
  impact_focus TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.carbon_portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own portfolios"
  ON public.carbon_portfolios FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.portfolio_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID REFERENCES public.carbon_portfolios(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES public.marketplace_listings(id),
  order_id UUID REFERENCES public.carbon_credit_orders(id),
  quantity NUMERIC NOT NULL,
  purchase_price NUMERIC(12,2),
  current_value NUMERIC(12,2),
  status TEXT DEFAULT 'held' CHECK (status IN ('held', 'retired', 'sold', 'transferred')),
  retired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.portfolio_holdings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own holdings"
  ON public.portfolio_holdings FOR ALL TO authenticated
  USING (
    portfolio_id IN (SELECT id FROM public.carbon_portfolios WHERE user_id = auth.uid())
  )
  WITH CHECK (
    portfolio_id IN (SELECT id FROM public.carbon_portfolios WHERE user_id = auth.uid())
  );

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Auto-assign verifier based on methodology + region match
CREATE OR REPLACE FUNCTION public.auto_assign_verifier(p_report_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_report RECORD;
  v_verifier_id UUID;
BEGIN
  SELECT r.*, c.country_name INTO v_report
  FROM reports r
  LEFT JOIN country_intelligence c ON c.iso2_code = r.country
  WHERE r.id = p_report_id;

  SELECT vp.id INTO v_verifier_id
  FROM verifier_profiles vp
  WHERE vp.availability_status = 'available'
    AND vp.is_certified = true
  ORDER BY vp.reputation_score DESC, vp.verification_count ASC
  LIMIT 1;

  IF v_verifier_id IS NOT NULL THEN
    INSERT INTO verification_assignments (report_id, verifier_id, assignment_type, status)
    VALUES (p_report_id, v_verifier_id, 'auto', 'pending');
  END IF;

  RETURN v_verifier_id;
END;
$$;

-- Update verifier reputation after review
CREATE OR REPLACE FUNCTION public.update_verifier_reputation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_avg_rating NUMERIC;
  v_count INTEGER;
BEGIN
  SELECT AVG(rating), COUNT(*) INTO v_avg_rating, v_count
  FROM verifier_reviews
  WHERE verifier_id = NEW.verifier_id;

  UPDATE verifier_profiles
  SET reputation_score = ROUND(v_avg_rating * 20, 2),
      verification_count = v_count,
      updated_at = now()
  WHERE id = NEW.verifier_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_verifier_reputation
  AFTER INSERT ON public.verifier_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_verifier_reputation();

-- Update listing available_credits on order
CREATE OR REPLACE FUNCTION public.update_listing_credits_on_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'confirmed' OR NEW.status = 'paid' THEN
    UPDATE marketplace_listings
    SET available_credits = available_credits - NEW.quantity,
        listing_status = CASE WHEN available_credits - NEW.quantity <= 0 THEN 'sold_out' ELSE listing_status END,
        updated_at = now()
    WHERE id = NEW.listing_id AND available_credits >= NEW.quantity;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_listing_credits
  AFTER INSERT OR UPDATE ON public.carbon_credit_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_listing_credits_on_order();
