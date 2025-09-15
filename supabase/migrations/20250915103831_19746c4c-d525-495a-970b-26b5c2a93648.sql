-- ESG Schema Integration - Layer on existing SDG platform

-- 1. Extend organizations with ESG capabilities
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS esg_enabled boolean DEFAULT false;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS primary_sector text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS reporting_year integer DEFAULT EXTRACT(year FROM now());

-- 2. ESG Indicators (core carbon/environmental data)
CREATE TABLE public.esg_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  reporting_year integer NOT NULL,
  carbon_scope1_tonnes numeric DEFAULT 0,
  carbon_scope2_tonnes numeric DEFAULT 0,
  carbon_scope3_tonnes numeric DEFAULT 0,
  energy_consumption_kwh numeric DEFAULT 0,
  water_consumption_m3 numeric DEFAULT 0,
  waste_generated_tonnes numeric DEFAULT 0,
  renewable_energy_percentage numeric DEFAULT 0,
  community_investment numeric DEFAULT 0,
  esg_score numeric,
  data_quality text DEFAULT 'estimated',
  verification_status text DEFAULT 'unverified',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, reporting_year)
);

-- 3. ESG Suppliers (for Scope 3 tracking)
CREATE TABLE public.esg_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  country_code text,
  sector text,
  contact_email text,
  annual_spend numeric,
  data_source text DEFAULT 'manual',
  alphaearth_enriched boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. ESG Supplier Emissions (Scope 3 detail)
CREATE TABLE public.esg_supplier_emissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.esg_suppliers(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  reporting_year integer NOT NULL,
  activity_description text,
  emissions_tonnes numeric NOT NULL DEFAULT 0,
  emission_factor numeric,
  emission_factor_source text,
  data_quality text DEFAULT 'reported',
  evidence_url text,
  alphaearth_benchmark_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. ESG Scenarios (what-if modeling)
CREATE TABLE public.esg_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  baseline_year integer NOT NULL,
  target_year integer NOT NULL,
  assumptions jsonb NOT NULL DEFAULT '{}',
  results jsonb DEFAULT '{}',
  status text DEFAULT 'draft',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. AlphaEarth API Cache (for both free GEE and pro API)
CREATE TABLE public.alphaearth_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key text UNIQUE NOT NULL,
  payload jsonb NOT NULL,
  provider text NOT NULL, -- 'gee' or 'alphaearth'
  organization_id uuid REFERENCES public.organizations(id),
  fetched_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '24 hours')
);

-- 7. ESG Audit Trail (extends existing audit concept)
CREATE TABLE public.esg_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  module text NOT NULL, -- 'esg_indicators', 'suppliers', 'scenarios', etc.
  action text NOT NULL,
  table_name text,
  row_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- 8. Extend plan limits for ESG features
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS esg_suppliers_limit integer DEFAULT 10,
ADD COLUMN IF NOT EXISTS esg_scenarios_limit integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS alphaearth_api_calls_limit integer DEFAULT 100;

-- Update plan limits based on plan_type
UPDATE public.organizations 
SET 
  esg_suppliers_limit = CASE 
    WHEN plan_type = 'lite' THEN 10
    WHEN plan_type = 'pro' THEN -1 -- unlimited
    ELSE 10 
  END,
  esg_scenarios_limit = CASE 
    WHEN plan_type = 'lite' THEN 3
    WHEN plan_type = 'pro' THEN -1 -- unlimited
    ELSE 3
  END,
  alphaearth_api_calls_limit = CASE 
    WHEN plan_type = 'lite' THEN 100 -- GEE only
    WHEN plan_type = 'pro' THEN 1000 -- Commercial API
    ELSE 100
  END;

-- Enable RLS on new tables
ALTER TABLE public.esg_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esg_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esg_supplier_emissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esg_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alphaearth_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esg_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ESG tables (following existing patterns)

-- ESG Indicators
CREATE POLICY "Organizations can manage their ESG indicators"
ON public.esg_indicators FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT id FROM public.organizations 
    WHERE created_by = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT id FROM public.organizations 
    WHERE created_by = auth.uid()
  )
);

-- ESG Suppliers  
CREATE POLICY "Organizations can manage their ESG suppliers"
ON public.esg_suppliers FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT id FROM public.organizations 
    WHERE created_by = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT id FROM public.organizations 
    WHERE created_by = auth.uid()
  )
);

-- ESG Supplier Emissions
CREATE POLICY "Organizations can manage their supplier emissions"
ON public.esg_supplier_emissions FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT id FROM public.organizations 
    WHERE created_by = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT id FROM public.organizations 
    WHERE created_by = auth.uid()
  )
);

-- ESG Scenarios
CREATE POLICY "Organizations can manage their ESG scenarios"
ON public.esg_scenarios FOR ALL
TO authenticated
USING (
  organization_id IN (
    SELECT id FROM public.organizations 
    WHERE created_by = auth.uid()
  )
)
WITH CHECK (
  organization_id IN (
    SELECT id FROM public.organizations 
    WHERE created_by = auth.uid()
  )
);

-- AlphaEarth Cache (organization-specific + public benchmarks)
CREATE POLICY "Organizations can access their cache and public data"
ON public.alphaearth_cache FOR SELECT
TO authenticated
USING (
  organization_id IS NULL OR -- public benchmarks
  organization_id IN (
    SELECT id FROM public.organizations 
    WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Organizations can insert their cache data"
ON public.alphaearth_cache FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT id FROM public.organizations 
    WHERE created_by = auth.uid()
  )
);

-- ESG Audit Logs
CREATE POLICY "Organizations can view their ESG audit logs"
ON public.esg_audit_logs FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT id FROM public.organizations 
    WHERE created_by = auth.uid()
  )
);

CREATE POLICY "System can insert ESG audit logs"
ON public.esg_audit_logs FOR INSERT
TO authenticated
WITH CHECK (true); -- Allow system to write audits

-- Indexes for performance
CREATE INDEX idx_esg_indicators_org_year ON public.esg_indicators(organization_id, reporting_year);
CREATE INDEX idx_esg_suppliers_org ON public.esg_suppliers(organization_id);
CREATE INDEX idx_esg_supplier_emissions_supplier ON public.esg_supplier_emissions(supplier_id);
CREATE INDEX idx_esg_scenarios_org ON public.esg_scenarios(organization_id);
CREATE INDEX idx_alphaearth_cache_key ON public.alphaearth_cache(cache_key);
CREATE INDEX idx_alphaearth_cache_expires ON public.alphaearth_cache(expires_at);
CREATE INDEX idx_esg_audit_org_created ON public.esg_audit_logs(organization_id, created_at DESC);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_esg_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_esg_indicators_updated_at
    BEFORE UPDATE ON public.esg_indicators
    FOR EACH ROW EXECUTE FUNCTION public.update_esg_updated_at_column();

CREATE TRIGGER update_esg_suppliers_updated_at
    BEFORE UPDATE ON public.esg_suppliers
    FOR EACH ROW EXECUTE FUNCTION public.update_esg_updated_at_column();

CREATE TRIGGER update_esg_supplier_emissions_updated_at
    BEFORE UPDATE ON public.esg_supplier_emissions
    FOR EACH ROW EXECUTE FUNCTION public.update_esg_updated_at_column();

CREATE TRIGGER update_esg_scenarios_updated_at
    BEFORE UPDATE ON public.esg_scenarios
    FOR EACH ROW EXECUTE FUNCTION public.update_esg_updated_at_column();