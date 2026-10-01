import { describe, it, expect } from "vitest";
import { buildSupplierContext } from "../supplierContext";

// Fluent mock covering only the chains buildSupplierContext calls.
function mockSupabase(supplierCount: number, emissionSupplierIds: string[]) {
  const suppliers = Array.from({ length: supplierCount }, (_, i) => ({ id: `s${i}`, name: `Supplier ${i}`, sector: "logistics", country_code: "GH" }));
  const emissions = emissionSupplierIds.map((supplier_id, i) => ({ supplier_id, emissions_tonnes: i, data_quality: "reported", reporting_year: 2026 }));
  return {
    from(table: string) {
      const rows = table === "esg_suppliers" ? suppliers : emissions;
      const q: any = {
        select: (_c: string, opts?: { head?: boolean }) => (opts?.head ? Promise.resolve({ count: rows.length }) : q),
        range: (a: number, b: number) => Promise.resolve({ data: rows.slice(a, b + 1) }),
        order: () => q,
        in: (_c: string, ids: string[]) => Promise.resolve({ data: suppliers.filter((s) => ids.includes(s.id)) }),
        limit: (n: number) => Promise.resolve({ data: [...rows].reverse().slice(0, n) }),
      };
      return q;
    },
  };
}

describe("buildSupplierContext", () => {
  it("computes completeness over every supplier, paging past the 1000-row limit", async () => {
    // 10,000 suppliers; 2,500 emission rows spanning 2,000 distinct suppliers (some repeat years)
    const ids = [...Array.from({ length: 2000 }, (_, i) => `s${i}`), ...Array.from({ length: 500 }, (_, i) => `s${i}`)];
    const ctx = await buildSupplierContext(mockSupabase(10000, ids));
    expect(ctx.total).toBe(10000);
    expect(ctx.withData).toBe(2000);
    expect(ctx.completeness).toBe(20);
    expect(ctx.contextStr).toContain("2500 emission records");
  });

  it("handles an organisation with no suppliers", async () => {
    const ctx = await buildSupplierContext(mockSupabase(0, []));
    expect(ctx.completeness).toBe(0);
    expect(ctx.contextStr).toContain("0 suppliers");
  });
});
