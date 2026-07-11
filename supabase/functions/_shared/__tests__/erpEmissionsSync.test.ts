import { describe, it, expect, vi } from "vitest";
import { syncErpLineItems, matchEmissionFactorKeyword, type ErpLineItem } from "../erpEmissionsSync";

/**
 * Minimal fluent mock of the Supabase query builder, keyed by table name.
 * Only implements the chains erpEmissionsSync.ts actually calls.
 */
function makeMockSupabase(opts: {
  existingSupplier?: { id: string } | null;
  emissionFactor?: { factor_kgco2e: number; source: string } | null;
}) {
  const inserted: Record<string, any[]> = { esg_suppliers: [], esg_supplier_emissions: [] };

  const supabase = {
    from(table: string) {
      if (table === "esg_suppliers") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: opts.existingSupplier ?? null }),
              }),
            }),
          }),
          insert: (rows: any[]) => {
            inserted.esg_suppliers.push(...rows);
            return {
              select: () => ({
                single: async () => ({ data: { id: "new-supplier-id" }, error: null }),
              }),
            };
          },
        };
      }
      if (table === "emission_factors") {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                limit: () => ({
                  maybeSingle: async () => ({ data: opts.emissionFactor ?? null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "esg_supplier_emissions") {
        return {
          insert: async (rows: any[]) => {
            inserted.esg_supplier_emissions.push(...rows);
            return { data: rows, error: null };
          },
        };
      }
      throw new Error(`Unexpected table in mock: ${table}`);
    },
  };

  return { supabase, inserted };
}

function makeLine(overrides: Partial<ErpLineItem> = {}): ErpLineItem {
  return {
    vendorName: "Acme Fuel Co",
    description: "Diesel fuel purchase",
    amount: 100,
    categoryHint: "fuel",
    ...overrides,
  };
}

describe("matchEmissionFactorKeyword", () => {
  it("matches Scope 1 fuel purchases (owned fleet/combustion)", () => {
    expect(matchEmissionFactorKeyword("Diesel fuel top-up")).toEqual({ category: "stationary_combustion", activity: "diesel" });
    expect(matchEmissionFactorKeyword("Heavy Truck fuel purchase")).toEqual({ category: "mobile_combustion", activity: "heavy_truck" });
  });

  it("matches Scope 3 category 4 (upstream transport) for third-party carrier services", () => {
    expect(matchEmissionFactorKeyword("Logistics service - Q1 invoice")).toEqual({ category: "cat4_upstream_transport", activity: "road_freight_avg" });
    expect(matchEmissionFactorKeyword("Air Freight charges")).toEqual({ category: "cat4_upstream_transport", activity: "air_freight_long" });
    expect(matchEmissionFactorKeyword("Ocean Freight - container booking")).toEqual({ category: "cat4_upstream_transport", activity: "sea_freight_container" });
  });

  it("matches Scope 3 category 5 (waste) and distinguishes recycling from landfill disposal", () => {
    expect(matchEmissionFactorKeyword("Recycling services - monthly")).toEqual({ category: "cat5_waste", activity: "recycling_mixed" });
    expect(matchEmissionFactorKeyword("Waste Disposal Ltd invoice")).toEqual({ category: "cat5_waste", activity: "landfill_mixed" });
  });

  it("matches Scope 3 category 6 (business travel) for airline/hotel vendor spend", () => {
    expect(matchEmissionFactorKeyword("Airfare - conference trip")).toEqual({ category: "cat6_business_travel", activity: "flight_short_haul_eco" });
    expect(matchEmissionFactorKeyword("Hotel accommodation invoice")).toEqual({ category: "cat6_business_travel", activity: "hotel_stay_avg" });
  });

  it("matches Scope 3 category 7 (employee commute) for commute benefit line items", () => {
    expect(matchEmissionFactorKeyword("Mileage Reimbursement - Sales team")).toEqual({ category: "cat7_employee_commute", activity: "car_avg" });
    expect(matchEmissionFactorKeyword("Monthly Bus Pass subsidy")).toEqual({ category: "cat7_employee_commute", activity: "public_bus" });
  });

  it("falls back to the Scope 3 category 1 catch-all for generic purchased goods", () => {
    expect(matchEmissionFactorKeyword("Office Supplies purchase order")).toEqual({ category: "cat1_purchased_goods", activity: "generic_goods_spend" });
  });

  it("returns null when nothing matches", () => {
    expect(matchEmissionFactorKeyword("Office furniture")).toBeNull();
  });
});

describe("syncErpLineItems", () => {
  it("matches a diesel line item to the stationary_combustion/diesel factor and estimates emissions", async () => {
    const { supabase, inserted } = makeMockSupabase({
      existingSupplier: null,
      emissionFactor: { factor_kgco2e: 2.68, source: "DEFRA 2024" },
    });

    const result = await syncErpLineItems(supabase as any, "org-1", "odoo", [makeLine({ amount: 100 })]);

    expect(result.processed).toBe(1);
    expect(result.matched).toBe(1);
    expect(result.errors).toHaveLength(0);
    expect(inserted.esg_supplier_emissions[0].emissions_tonnes).toBeCloseTo((100 * 2.68) / 1000);
    expect(inserted.esg_supplier_emissions[0].data_quality).toBe("estimated");
  });

  it("leaves emissions at zero and marks data_quality unverified when no keyword matches", async () => {
    const { supabase, inserted } = makeMockSupabase({ existingSupplier: null, emissionFactor: null });

    const result = await syncErpLineItems(supabase as any, "org-1", "odoo", [
      makeLine({ description: "Office furniture", categoryHint: "furniture" }),
    ]);

    expect(result.matched).toBe(0);
    expect(result.processed).toBe(1);
    expect(inserted.esg_supplier_emissions[0].emissions_tonnes).toBe(0);
    expect(inserted.esg_supplier_emissions[0].data_quality).toBe("unverified");
    expect(inserted.esg_supplier_emissions[0].emission_factor_source).toBe("unmatched");
  });

  it("creates a new supplier when none exists for the vendor name", async () => {
    const { supabase, inserted } = makeMockSupabase({ existingSupplier: null, emissionFactor: null });

    await syncErpLineItems(supabase as any, "org-1", "sap", [makeLine({ vendorName: "New Vendor Ltd" })]);

    expect(inserted.esg_suppliers).toHaveLength(1);
    expect(inserted.esg_suppliers[0]).toMatchObject({
      organization_id: "org-1",
      name: "New Vendor Ltd",
      data_source: "erp_sap",
    });
  });

  it("reuses an existing supplier without inserting a duplicate", async () => {
    const { supabase, inserted } = makeMockSupabase({ existingSupplier: { id: "existing-id" }, emissionFactor: null });

    await syncErpLineItems(supabase as any, "org-1", "odoo", [makeLine()]);

    expect(inserted.esg_suppliers).toHaveLength(0);
  });

  it("matches electricity-related keywords to the electricity/grid_consumption factor", async () => {
    const { supabase, inserted } = makeMockSupabase({
      existingSupplier: { id: "s1" },
      emissionFactor: { factor_kgco2e: 0.45, source: "Grid emission factor" },
    });

    await syncErpLineItems(supabase as any, "org-1", "odoo", [
      makeLine({ description: "Monthly power bill", categoryHint: "utilities", amount: 500 }),
    ]);

    expect(inserted.esg_supplier_emissions[0].emissions_tonnes).toBeCloseTo((500 * 0.45) / 1000);
  });

  it("matches a Scope 3 upstream-transport line item (third-party logistics vendor) end to end", async () => {
    const { supabase, inserted } = makeMockSupabase({
      existingSupplier: { id: "s1" },
      emissionFactor: { factor_kgco2e: 0.1057, source: "DEFRA" },
    });

    await syncErpLineItems(supabase as any, "org-1", "sap", [
      makeLine({ vendorName: "Global Logistics Co", description: "Logistics service - Q1 invoice", categoryHint: "freight", amount: 2000 }),
    ]);

    expect(inserted.esg_supplier_emissions[0].emissions_tonnes).toBeCloseTo((2000 * 0.1057) / 1000);
    expect(inserted.esg_supplier_emissions[0].data_quality).toBe("estimated");
  });

  it("continues processing remaining line items after one fails", async () => {
    const { supabase } = makeMockSupabase({ existingSupplier: { id: "s1" }, emissionFactor: null });
    // Force a failure on the second line by making esg_supplier_emissions insert throw once.
    let callCount = 0;
    const originalFrom = supabase.from.bind(supabase);
    supabase.from = ((table: string) => {
      if (table === "esg_supplier_emissions") {
        callCount++;
        if (callCount === 1) {
          return { insert: async () => { throw new Error("insert failed"); } };
        }
      }
      return originalFrom(table);
    }) as typeof supabase.from;

    const result = await syncErpLineItems(supabase as any, "org-1", "odoo", [
      makeLine({ vendorName: "Vendor A" }),
      makeLine({ vendorName: "Vendor B" }),
    ]);

    expect(result.processed).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("Vendor A");
  });
});
