import { describe, it, expect, vi } from "vitest";
import { syncErpLineItems, type ErpLineItem } from "../erpEmissionsSync";

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
