import type { ReportListItem } from "@/hooks/useReportsList";

export type ReportKind = "Summary" | "Detailed" | "Financial";

const csvCell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  // Quote everything; neutralise spreadsheet formula injection.
  return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};

export function reportsToCsv(reports: ReportListItem[]): string {
  const head = ["Project ID", "Title", "SDG", "Location", "Country", "Status", "Verifications", "Verified", "Cost", "Currency", "Submitted"];
  const rows = reports.map((r) =>
    [r.id, r.title, r.sdg_goal, r.location, r.country_code, r.project_status, r.verification_count ?? 0, r.is_verified ? "yes" : "no", r.cost, r.cost_currency, r.submitted_at]
      .map(csvCell)
      .join(","),
  );
  return [head.map(csvCell).join(","), ...rows].join("\n");
}

const countBy = (reports: ReportListItem[], key: (r: ReportListItem) => string) => {
  const m = new Map<string, number>();
  for (const r of reports) m.set(key(r), (m.get(key(r)) ?? 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const table = (head: string[], rows: unknown[][]) =>
  `<table><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;

/** Reports submitted within [from, to] (inclusive, whole days). */
export function reportsInRange(reports: ReportListItem[], from: Date, to: Date): ReportListItem[] {
  const start = new Date(from); start.setHours(0, 0, 0, 0);
  const end = new Date(to); end.setHours(23, 59, 59, 999);
  return reports.filter((r) => {
    const t = new Date(r.submitted_at).getTime();
    return t >= start.getTime() && t <= end.getTime();
  });
}

/** A self-contained HTML report built only from the given rows. */
export function buildReportHtml(kind: ReportKind, reports: ReportListItem[], from: Date, to: Date): string {
  const range = `${from.toISOString().slice(0, 10)} to ${to.toISOString().slice(0, 10)}`;
  const verified = reports.filter((r) => r.is_verified).length;
  let body = `<p>${reports.length} reports submitted ${esc(range)}; ${verified} verified.</p>`;
  if (kind === "Summary") {
    body +=
      `<h2>By SDG</h2>${table(["SDG", "Reports"], countBy(reports, (r) => `SDG ${r.sdg_goal}`))}` +
      `<h2>By status</h2>${table(["Status", "Reports"], countBy(reports, (r) => r.project_status))}` +
      `<h2>By country</h2>${table(["Country", "Reports"], countBy(reports, (r) => r.country_code || "Unknown"))}`;
  } else if (kind === "Detailed") {
    body += table(
      ["Title", "SDG", "Location", "Status", "Verifications", "Submitted"],
      reports.map((r) => [r.title, r.sdg_goal, r.location, r.project_status, r.verification_count ?? 0, r.submitted_at.slice(0, 10)]),
    );
  } else {
    const byCurrency = new Map<string, { n: number; total: number }>();
    for (const r of reports) {
      if (!r.cost) continue;
      const c = r.cost_currency || "USD";
      const e = byCurrency.get(c) ?? { n: 0, total: 0 };
      byCurrency.set(c, { n: e.n + 1, total: e.total + r.cost });
    }
    body += `<h2>Reported budgets by currency</h2>${table(
      ["Currency", "Projects with a budget", "Total"],
      [...byCurrency.entries()].map(([c, v]) => [c, v.n, v.total.toLocaleString()]),
    )}<p>Totals are not converted between currencies.</p>`;
  }
  return `<!doctype html><meta charset="utf-8"><title>DevMapper ${kind} Report</title><style>body{font-family:system-ui,sans-serif;max-width:900px;margin:2rem auto;padding:0 1rem;color:#1c1f1a}table{border-collapse:collapse;width:100%;margin:.5rem 0 1.5rem}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;font-size:14px}th{background:#f4f4f0}</style><h1>DevMapper ${kind} Report</h1><p>Generated ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC · Source: DevMapper reports database</p>${body}`;
}

export function downloadFile(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type: `${type};charset=utf-8` }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
