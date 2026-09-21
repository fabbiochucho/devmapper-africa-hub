-- §7/15 Scope 3 category expansion. These 5 rows extend coverage into three
-- categories the local table had none for (cat2 capital goods, cat9
-- downstream transport & distribution, cat12 end-of-life treatment of sold
-- products). Values were pulled live from the newly-registered
-- greencalculus-proxy (real DEFRA/DESNZ, GLEC Framework, EXIOBASE and
-- USEEIO factors, each independently verifiable at the proof_url recorded
-- in notes) - not transcribed from a secondary source or invented, per this
-- session's rule against fabricating factor values.
INSERT INTO public.emission_factors (scope, category, activity, region, unit, factor_kgco2e, source, source_year, notes) VALUES
  (3, 'cat9_downstream_transport', 'freight_road_hgv_general', 'GLOBAL', 'tonne-km', 0.1,
   'GLEC Framework v3.2', 2026,
   'Generic average-laden road HGV freight factor (WTW, AR6-100), Smart Freight Centre GLEC Framework v3.2. Same physical factor as upstream road freight - applies here to downstream distribution to customers. Via GreenCalculus (retrieved 2026-07-02). Verify: https://verify.greencalculus.com/freight.road_hgv.tonne_km@2026.194'),

  (3, 'cat2_capital_goods', 'machinery_equipment_avg', 'GLOBAL', 'EUR (2019 basic price)', 0.485,
   'EXIOBASE v3.8', 2019,
   'Spend-based GHG intensity for electrical machinery & apparatus, EXIOBASE 3.8.2 multi-regional input-output database (200 products x 49 regions). Coarse spend-category proxy for capital equipment purchases - use only where a supplier-specific figure is unavailable. Via GreenCalculus. Verify: https://verify.greencalculus.com/spend_based.exiobase.sectors.electrical_machinery@2026.194'),

  (3, 'cat2_capital_goods', 'construction_machinery', 'US', 'USD (2024 purchaser price)', 0.186492,
   'USEEIO Supply Chain Factors v1.4.0', 2024,
   'Spend-based GHG intensity, US NAICS-6 333120 Construction Machinery Manufacturing, EPA USEEIO v2.6.0 (recomputed on AR5-100 for consistency with the other spend-based rows in this table). Via GreenCalculus. Verify: https://verify.greencalculus.com/spend_based.us.naics6.333120.construction_machinery_manufacturing@2026.194'),

  (3, 'cat12_end_of_life', 'commercial_industrial_waste_landfill', 'GB', 'tonne', 520.58023,
   'DEFRA', 2026,
   'UK commercial & industrial waste, landfill disposal, gate-to-grave (UK Govt GHG Conversion Factors 2026, DESNZ). Same physical factor already used for cat5 operational waste - applies here when the waste is a sold product reaching end-of-life. Via GreenCalculus. Verify: https://verify.greencalculus.com/waste_disposal.gbr.refuse.commercial_and_industrial_waste.landfill@2026.194'),

  (3, 'cat12_end_of_life', 'commercial_industrial_waste_recycled', 'GB', 'tonne', 4.65358,
   'DEFRA', 2026,
   'UK commercial & industrial waste, closed-loop recycling, transport-to-facility only (UK Govt GHG Conversion Factors 2026, DESNZ). Via GreenCalculus. Verify: https://verify.greencalculus.com/waste_disposal.gbr.refuse.commercial_and_industrial_waste.closed_loop@2026.194')
ON CONFLICT (scope, category, activity, region, source) DO NOTHING;
