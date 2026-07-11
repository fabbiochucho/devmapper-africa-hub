// deno-lint-ignore-file no-explicit-any

export interface ErpLineItem {
  vendorName: string;
  description: string;
  amount: number;
  /** Best-effort category hint (product/account code, item group, etc.) used for emission-factor matching. */
  categoryHint: string;
}

export interface ErpSyncResult {
  processed: number;
  matched: number;
  errors: string[];
}

/**
 * Keyword -> (category, activity) lookup built from the actual seeded rows
 * in emission_factors (migration 20260514131308). Scope 1 entries (fuel,
 * electricity) come first because they describe the org buying fuel/power
 * for its OWN combustion/vehicles; the Scope 3 entries below them describe
 * paying a third party for goods or a transport/travel/waste SERVICE, and
 * use distinct enough phrases (e.g. "logistics service" vs "freight truck")
 * that the two shouldn't collide on a real ERP line item's account
 * description or category hint.
 */
const KEYWORD_TO_FACTOR: Array<{ keywords: string[]; category: string; activity: string }> = [
  // Scope 1: fuel/electricity purchased for the org's own combustion or fleet.
  { keywords: ['diesel'], category: 'stationary_combustion', activity: 'diesel' },
  { keywords: ['natural gas', 'natgas', 'methane'], category: 'stationary_combustion', activity: 'natural_gas' },
  { keywords: ['lpg', 'propane', 'butane'], category: 'stationary_combustion', activity: 'lpg' },
  { keywords: ['coal'], category: 'stationary_combustion', activity: 'coal_industrial' },
  { keywords: ['electricity', 'power bill', 'grid'], category: 'electricity', activity: 'grid_consumption' },
  { keywords: ['district heat', 'steam', 'heating'], category: 'heat_steam', activity: 'district_heat' },
  { keywords: ['petrol', 'gasoline'], category: 'mobile_combustion', activity: 'petrol_car_avg' },
  { keywords: ['heavy truck', 'freight truck', 'lorry'], category: 'mobile_combustion', activity: 'heavy_truck' },
  // Scope 3 category 4: paying a third-party carrier/logistics provider.
  { keywords: ['air freight', 'air cargo'], category: 'cat4_upstream_transport', activity: 'air_freight_long' },
  { keywords: ['sea freight', 'ocean freight', 'container shipping'], category: 'cat4_upstream_transport', activity: 'sea_freight_container' },
  { keywords: ['road freight', 'trucking service', 'freight forwarding', 'logistics service', 'courier'], category: 'cat4_upstream_transport', activity: 'road_freight_avg' },
  // Scope 3 category 5: paying for waste disposal/recycling services.
  { keywords: ['recycling', 'recycled waste'], category: 'cat5_waste', activity: 'recycling_mixed' },
  { keywords: ['waste disposal', 'landfill', 'refuse collection', 'garbage collection'], category: 'cat5_waste', activity: 'landfill_mixed' },
  // Scope 3 category 6: business travel purchased through a vendor (airline, hotel, travel agency).
  { keywords: ['hotel', 'lodging', 'accommodation'], category: 'cat6_business_travel', activity: 'hotel_stay_avg' },
  { keywords: ['flight', 'airfare', 'air ticket', 'airline ticket'], category: 'cat6_business_travel', activity: 'flight_short_haul_eco' },
  // Scope 3 category 7: employee commute benefits/reimbursements paid through the ERP.
  { keywords: ['bus pass', 'bus fare'], category: 'cat7_employee_commute', activity: 'public_bus' },
  { keywords: ['train ticket', 'rail pass', 'subway', 'metro pass'], category: 'cat7_employee_commute', activity: 'rail' },
  { keywords: ['mileage reimbursement', 'car allowance', 'employee commute'], category: 'cat7_employee_commute', activity: 'car_avg' },
  // Scope 3 category 1: catch-all for purchased goods/services with no more specific match above.
  { keywords: ['goods', 'materials', 'supplies', 'merchandise', 'raw material'], category: 'cat1_purchased_goods', activity: 'generic_goods_spend' },
];

export function matchEmissionFactorKeyword(text: string): { category: string; activity: string } | null {
  const lower = text.toLowerCase();
  for (const entry of KEYWORD_TO_FACTOR) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return { category: entry.category, activity: entry.activity };
    }
  }
  return null;
}

/**
 * Shared "find/create supplier -> match emission factor -> write
 * esg_supplier_emissions" pipeline used by both the Odoo and SAP connectors,
 * so the matching logic (and its limitations) only live in one place.
 */
export async function syncErpLineItems(
  supabase: any,
  organizationId: string,
  provider: 'odoo' | 'sap',
  lineItems: ErpLineItem[],
): Promise<ErpSyncResult> {
  let processed = 0;
  let matched = 0;
  const errors: string[] = [];

  for (const line of lineItems) {
    try {
      let { data: supplier } = await supabase
        .from('esg_suppliers')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('name', line.vendorName)
        .maybeSingle();

      if (!supplier) {
        const { data: newSupplier, error: supplierError } = await supabase
          .from('esg_suppliers')
          .insert([{ organization_id: organizationId, name: line.vendorName, data_source: `erp_${provider}` }])
          .select('id')
          .single();
        if (supplierError || !newSupplier) throw new Error(supplierError?.message || 'Failed to create supplier');
        supplier = newSupplier;
      }

      const keywordMatch = matchEmissionFactorKeyword(`${line.categoryHint} ${line.description}`);
      const { data: factor } = keywordMatch
        ? await supabase
            .from('emission_factors')
            .select('factor_kgco2e, source')
            .eq('category', keywordMatch.category)
            .eq('activity', keywordMatch.activity)
            .limit(1)
            .maybeSingle()
        : { data: null };

      const estimatedTonnes = factor ? (line.amount * factor.factor_kgco2e) / 1000 : 0;
      if (factor) matched++;

      await supabase.from('esg_supplier_emissions').insert([{
        supplier_id: supplier.id,
        organization_id: organizationId,
        reporting_year: new Date().getFullYear(),
        activity_description: line.description || null,
        emissions_tonnes: estimatedTonnes,
        emission_factor: factor?.factor_kgco2e ?? null,
        emission_factor_source: factor?.source ?? 'unmatched',
        data_quality: factor ? 'estimated' : 'unverified',
      }]);

      processed++;
    } catch (lineError) {
      errors.push(`${line.vendorName}: ${lineError instanceof Error ? lineError.message : 'unknown error'}`);
    }
  }

  return { processed, matched, errors };
}
