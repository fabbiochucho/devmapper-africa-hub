import { describe, it, expect } from "vitest";
import { buildReportHtml, reportsInRange, reportsToCsv } from "../reportExport";
import type { ReportListItem } from "@/hooks/useReportsList";

const r = (o: Partial<ReportListItem>): ReportListItem => ({
  id: "1", title: "Borehole", description: null, sdg_goal: 6, location: "Kisumu", country_code: "KE",
  project_status: "active", verification_count: 2, is_verified: true, submitted_at: "2026-03-10T12:00:00Z",
  cost: 1000, cost_currency: "KES", lat: null, lng: null, ...o,
} as ReportListItem);

describe("reportExport", () => {
  it("quotes CSV cells and neutralises formula injection", () => {
    const csv = reportsToCsv([r({ title: '=HYPERLINK("x")' })]);
    expect(csv.split("\n")[1]).toContain(`"'=HYPERLINK(""x"")"`);
  });

  it("filters by whole-day date range", () => {
    const rows = [r({ id: "a", submitted_at: "2026-03-10T23:30:00" }), r({ id: "b", submitted_at: "2026-03-11T00:10:00" })];
    expect(reportsInRange(rows, new Date(2026, 2, 10), new Date(2026, 2, 10)).map((x) => x.id)).toEqual(["a"]);
  });

  it("builds summary counts and escapes HTML", () => {
    const html = buildReportHtml("Summary", [r({}), r({ id: "2", country_code: "<b>" })], new Date(2026, 0, 1), new Date(2026, 11, 31));
    expect(html).toContain("2 reports submitted");
    expect(html).toContain("&lt;b&gt;");
    expect(html).not.toContain("<b>");
  });

  it("does not add budgets across currencies", () => {
    const html = buildReportHtml("Financial", [r({}), r({ id: "2", cost: 5, cost_currency: "USD" })], new Date(2026, 0, 1), new Date(2026, 11, 31));
    expect(html).toContain("<td>KES</td><td>1</td><td>1,000</td>");
    expect(html).toContain("<td>USD</td><td>1</td><td>5</td>");
  });
});
