
-- ============================================================
-- PHASE 1: Carbon Foundation + Basic Financials
-- ============================================================

CREATE TABLE public.project_carbon_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
  emission_source TEXT,
  scope_types TEXT[],
  estimated_emissions_tco2e NUMERIC,
  reporting_period_start DATE,
  reporting_period_end DATE,
  funding_source TEXT,
  estimated_savings NUMERIC,
  carbon_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  evidence_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.project_carbon_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view carbon data for accessible reports"
  ON public.project_carbon_data FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "Users can insert carbon data for own reports"
  ON public.project_carbon_data FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.reports WHERE id = report_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update carbon data for own reports"
  ON public.project_carbon_data FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.reports WHERE id = report_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete carbon data for own reports"
  ON public.project_carbon_data FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.reports WHERE id = report_id AND user_id = auth.uid())
  );

-- ============================================================
-- PHASE 2: Decarbonisation + Circularity
-- ============================================================

CREATE TABLE public.project_decarbonisation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
  baseline_emissions NUMERIC,
  target_emissions NUMERIC,
  reduction_strategy TEXT,
  target_year INT,
  methane_emissions_tco2e NUMERIC,
  methane_sector TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.project_decarbonisation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view decarbonisation data"
  ON public.project_decarbonisation FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "Users can insert decarbonisation data for own reports"
  ON public.project_decarbonisation FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.reports WHERE id = report_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update decarbonisation data for own reports"
  ON public.project_decarbonisation FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.reports WHERE id = report_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete decarbonisation data for own reports"
  ON public.project_decarbonisation FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.reports WHERE id = report_id AND user_id = auth.uid())
  );

CREATE TABLE public.project_circularity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
  material_input_type TEXT,
  material_input_quantity NUMERIC,
  waste_generated_tonnes NUMERIC,
  waste_recycled_tonnes NUMERIC,
  reuse_percentage NUMERIC,
  circularity_score NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.project_circularity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view circularity data"
  ON public.project_circularity FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "Users can insert circularity data for own reports"
  ON public.project_circularity FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.reports WHERE id = report_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update circularity data for own reports"
  ON public.project_circularity FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.reports WHERE id = report_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete circularity data for own reports"
  ON public.project_circularity FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.reports WHERE id = report_id AND user_id = auth.uid())
  );

-- ============================================================
-- PHASE 3: Carbon Asset Management
-- ============================================================

CREATE TABLE public.carbon_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id),
  report_id UUID REFERENCES public.reports(id),
  credits_generated NUMERIC,
  credits_owned NUMERIC,
  credits_retired NUMERIC,
  methodology TEXT,
  verification_status TEXT DEFAULT 'unverified',
  reference_price_usd NUMERIC,
  estimated_value_usd NUMERIC,
  issuance_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.carbon_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view carbon assets for their org"
  ON public.carbon_assets FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ) OR EXISTS (SELECT 1 FROM public.reports WHERE id = report_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert carbon assets"
  ON public.carbon_assets FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ) OR EXISTS (SELECT 1 FROM public.reports WHERE id = report_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update carbon assets"
  ON public.carbon_assets FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- PHASE 4: Article 6 + Compliance
-- ============================================================

CREATE TABLE public.carbon_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.reports(id),
  organization_id UUID REFERENCES public.organizations(id),
  country_of_origin TEXT,
  jurisdiction TEXT,
  compliance_type TEXT DEFAULT 'voluntary',
  itmo_eligible BOOLEAN DEFAULT FALSE,
  article6_status TEXT,
  er_credits_issued NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.carbon_compliance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view compliance data"
  ON public.carbon_compliance FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "Users can insert compliance data"
  ON public.carbon_compliance FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ) OR EXISTS (SELECT 1 FROM public.reports WHERE id = report_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update compliance data"
  ON public.carbon_compliance FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    ) OR EXISTS (SELECT 1 FROM public.reports WHERE id = report_id AND user_id = auth.uid())
  );

CREATE TABLE public.carbon_transfer_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carbon_asset_id UUID REFERENCES public.carbon_assets(id) ON DELETE CASCADE,
  from_entity TEXT,
  to_entity TEXT,
  credits_transferred NUMERIC,
  transfer_date TIMESTAMPTZ,
  ownership_proof TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.carbon_transfer_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view transfer logs for their assets"
  ON public.carbon_transfer_logs FOR SELECT TO authenticated
  USING (
    carbon_asset_id IN (
      SELECT id FROM public.carbon_assets WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert transfer logs"
  ON public.carbon_transfer_logs FOR INSERT TO authenticated
  WITH CHECK (
    carbon_asset_id IN (
      SELECT id FROM public.carbon_assets WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- PHASE 5: Profitable Sustainability (Financial Impact)
-- ============================================================

CREATE TABLE public.project_financial_impact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE NOT NULL,
  operational_cost_savings NUMERIC,
  revenue_generated NUMERIC,
  carbon_credit_value NUMERIC,
  efficiency_gains_pct NUMERIC,
  roi_percentage NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.project_financial_impact ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view financial impact data"
  ON public.project_financial_impact FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY "Users can insert financial impact for own reports"
  ON public.project_financial_impact FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.reports WHERE id = report_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update financial impact for own reports"
  ON public.project_financial_impact FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.reports WHERE id = report_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete financial impact for own reports"
  ON public.project_financial_impact FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.reports WHERE id = report_id AND user_id = auth.uid())
  );

-- Triggers for updated_at
CREATE TRIGGER update_project_carbon_data_updated_at BEFORE UPDATE ON public.project_carbon_data FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_project_decarbonisation_updated_at BEFORE UPDATE ON public.project_decarbonisation FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_project_circularity_updated_at BEFORE UPDATE ON public.project_circularity FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_carbon_assets_updated_at BEFORE UPDATE ON public.carbon_assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_carbon_compliance_updated_at BEFORE UPDATE ON public.carbon_compliance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_project_financial_impact_updated_at BEFORE UPDATE ON public.project_financial_impact FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
