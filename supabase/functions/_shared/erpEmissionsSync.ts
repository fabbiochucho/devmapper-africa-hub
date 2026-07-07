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
 * in emission_factors (migration 20260514131308). This only covers Scope 1
 * fuel/electricity purchases, because that's genuinely all that's seeded
 * today - emission_factors has no Scope 3 procurement categories (raw
 * materials, professional services, IT equipment, etc.) yet. That's a real
 * data gap, not a matching-algorithm gap: no string-matching improvement
 * here can match a line item to a category that doesn't exist in the
 * reference table. A production rollout needs Scope 3 category/activity
 * rows added to emission_factors before ERP procurement lines outside
 * fuel/electricity/heat can ever match.
 */
const KEYWORD_TO_FACTOR: Array<{ keywords: string[]; category: string; activity: string }> = [
  { keywords: ['diesel'], category: 'stationary_combustion', activity: 'diesel' },
  { keywords: ['natural gas', 'natgas', 'methane'], category: 'stationary_combustion', activity: 'natural_gas' },
  { keywords: ['lpg', 'propane', 'butane'], category: 'stationary_combustion', activity: 'lpg' },
  { keywords: ['coal'], category: 'stationary_combustion', activity: 'coal_industrial' },
  { keywords: ['electricity', 'power bill', 'grid'], category: 'electricity', activity: 'grid_consumption' },
  { keywords: ['district heat', 'steam', 'heating'], category: 'heat_steam', activity: 'district_heat' },
  { keywords: ['petrol', 'gasoline'], category: 'mobile_combustion', activity: 'petrol_car_avg' },
  { keywords: ['heavy truck', 'freight truck', 'lorry'], category: 'mobile_combustion', activity: 'heavy_truck' },
];

function matchEmissionFactorKeyword(text: string): { category: string; activity: string } | null {
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
