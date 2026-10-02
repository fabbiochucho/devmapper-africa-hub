import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { Badge } from "@/components/ui/badge";
import { entityMeta } from "@/lib/entities";
import { loadDetail } from "@/lib/entityDetail";

const MAX = 4;

/** Side-by-side comparison of up to four entities: /compare?items=project:<id>,programme:<id> */
export default function ComparePage() {
  const [params] = useSearchParams();
  const refs = (params.get("items") ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, MAX)
    .map((s) => { const i = s.indexOf(":"); return { type: s.slice(0, i), id: s.slice(i + 1) }; })
    .filter((r) => r.type && r.id);

  const { data = [], isLoading } = useQuery({
    queryKey: ["compare", refs.map((r) => `${r.type}:${r.id}`).join(",")],
    queryFn: () => Promise.all(refs.map(async (r) => ({ ...r, detail: await loadDetail(r.type, r.id) }))),
    enabled: refs.length > 0,
  });

  // Rows: every fact any column has, in first-seen order.
  const rows: string[] = [];
  for (const c of data) for (const [k, v] of c.detail?.facts ?? []) if (v !== null && v !== undefined && v !== "" && !rows.includes(k)) rows.push(k);
  const value = (c: (typeof data)[number], k: string) => c.detail?.facts.find(([f]) => f === k)?.[1];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      <SEOHead title="Compare" description="Compare projects, programmes, organisations and policies side by side." />
      <Link to="/workspace" className="text-sm text-muted-foreground inline-flex items-center hover:underline"><ArrowLeft className="h-4 w-4 mr-1" />Workspace</Link>
      <h1 className="text-2xl font-bold">Compare</h1>
      {refs.length < 2 ? (
        <p className="text-muted-foreground">Choose two to four items to compare, for example from a collection in your workspace.</p>
      ) : isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b align-top">
                <th className="text-left p-3 w-40" />
                {data.map((c) => (
                  <th key={`${c.type}:${c.id}`} className="text-left p-3 min-w-[14rem] font-normal">
                    <Badge variant="secondary" className="mb-1">{entityMeta(c.type).label}</Badge>
                    <div className="font-semibold">
                      <Link to={c.type === "project" ? `/project/${c.id}` : `/explore/${c.type}/${c.id}`} className="hover:underline">{c.detail?.title ?? "Not available"}</Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b align-top">
                <td className="p-3 text-muted-foreground">Summary</td>
                {data.map((c) => <td key={c.id} className="p-3 text-muted-foreground"><p className="line-clamp-6">{c.detail?.summary ?? "—"}</p></td>)}
              </tr>
              {rows.map((k) => (
                <tr key={k} className="border-b align-top">
                  <td className="p-3 text-muted-foreground">{k}</td>
                  {data.map((c) => <td key={c.id} className="p-3 break-words">{value(c, k) ?? "—"}</td>)}
                </tr>
              ))}
              <tr className="align-top">
                <td className="p-3 text-muted-foreground">Source</td>
                {data.map((c) => (
                  <td key={c.id} className="p-3 text-xs text-muted-foreground">
                    {c.detail?.source?.name ?? "—"}
                    {c.detail?.source?.url && (
                      <a href={c.detail.source.url} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center underline">original <ExternalLink className="h-3 w-3 ml-0.5" /></a>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
