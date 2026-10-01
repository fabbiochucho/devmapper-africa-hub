// Context for the Ndovu supplier agent. Totals and the completeness score are exact over
// every supplier the caller can see (RLS scopes to their org); only the record lists sent
// to the model are samples. Previously both queries were a bare .limit(50), so a
// 10,000-supplier import was judged on 50 arbitrary rows.

const PAGE = 1000; // PostgREST max rows per request
const TOP_N = 50;  // emitters sent to the model
const GAP_N = 25;  // suppliers-without-data sent to the model

// deno-lint-ignore no-explicit-any
export async function buildSupplierContext(supabase: any): Promise<{ contextStr: string; completeness: number; total: number; withData: number }> {
  const { count: supplierCount } = await supabase.from("esg_suppliers").select("id", { count: "exact", head: true });

  // ponytail: pages every emissions row's supplier_id to count distinct suppliers with data;
  // fine to ~100k rows, move to a SQL view/RPC if orgs grow past that.
  const withData = new Set<string>();
  let emissionRows = 0;
  for (let from = 0; ; from += PAGE) {
    const { data } = await supabase.from("esg_supplier_emissions").select("supplier_id").range(from, from + PAGE - 1);
    if (!data?.length) break;
    emissionRows += data.length;
    for (const r of data) if (r.supplier_id) withData.add(r.supplier_id);
    if (data.length < PAGE) break;
  }
  const total = supplierCount ?? 0;
  const completeness = total ? Math.round((withData.size / total) * 100) : 0;

  const { data: top } = await supabase.from("esg_supplier_emissions")
    .select("supplier_id, emissions_tonnes, data_quality, reporting_year")
    .order("emissions_tonnes", { ascending: false, nullsFirst: false }).limit(TOP_N);
  const topIds = [...new Set((top ?? []).map((r: { supplier_id: string }) => r.supplier_id))];
  const { data: topSuppliers } = topIds.length
    ? await supabase.from("esg_suppliers").select("id, name, sector, country_code").in("id", topIds)
    : { data: [] };
  const names = new Map((topSuppliers ?? []).map((s: { id: string }) => [s.id, s]));

  const { data: someSuppliers } = await supabase.from("esg_suppliers").select("id, name, sector, country_code").limit(PAGE);
  const gaps = (someSuppliers ?? []).filter((s: { id: string }) => !withData.has(s.id)).slice(0, GAP_N);

  let contextStr = `Supplier totals (exact): ${total} suppliers, ${withData.size} with emissions data, ${total - withData.size} without; ${emissionRows} emission records.\n`;
  contextStr += `Scope 3 completeness score (exact): ${completeness}%\n`;
  contextStr += `Top ${top?.length ?? 0} emission records (sample, highest first): ${JSON.stringify((top ?? []).map((r: { supplier_id: string }) => ({ ...r, supplier: names.get(r.supplier_id) ?? null })))}\n`;
  contextStr += `Suppliers without emissions data (sample of ${gaps.length}): ${JSON.stringify(gaps)}\n`;

  return { contextStr, completeness, total, withData: withData.size };
}
