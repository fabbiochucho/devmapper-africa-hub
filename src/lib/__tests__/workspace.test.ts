import { describe, it, expect, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { answerToStep, investigationToHtml, type Collection, type InvestigationStep } from "../workspace";

const answer = {
  summary: "Three organisations run programmes in Kano.",
  keyInsights: [{ text: "IATI lists 2 active programmes", sources: ["1", "2"], basis: "sourced" }],
  risks: [{ text: "Funding may lapse", sources: [], basis: "inference" }],
  recommendedActions: [],
  missingData: ["2025 budgets"],
  evidence: [
    { id: "1", label: "Programme (IATI): Kano Nutrition", source: "iati", path: "/explore/programme/x", url: "https://d-portal.org/a", retrievedAt: "2026-10-02T00:00:00Z" },
    { id: "2", label: "Organisation: Save the Children", source: "devmapper", path: "/explore/organization/y", retrievedAt: "2026-10-02T00:00:00Z" },
  ],
};

describe("answerToStep", () => {
  it("keeps citations and labels inferences in the readable text", () => {
    const s = answerToStep(answer);
    expect(s.content).toContain("- IATI lists 2 active programmes [1, 2]");
    expect(s.content).toContain("- Funding may lapse (AI inference)");
    expect(s.content).toContain("Not covered: 2025 budgets");
    expect(s.citations).toHaveLength(2);
    expect((s.citations as { url: string | null }[])[0].url).toBe("https://d-portal.org/a");
  });
});

describe("investigationToHtml", () => {
  it("escapes user content and links citations", () => {
    const c = { id: "c", name: "<script>x</script>", question: "Who?", status: "open", conclusion: null } as Collection;
    const step = { id: "s", step_type: "answer", content: "a & b", created_at: "2026-10-02T00:00:00Z", citations: answerToStep(answer).citations } as InvestigationStep;
    const html = investigationToHtml(c, [step], [], "https://devmapper.africa");
    expect(html).not.toContain("<script>x");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("a &amp; b");
    expect(html).toContain('href="https://d-portal.org/a"');
    expect(html).toContain('href="https://devmapper.africa/explore/organization/y"'); // in-app path when there is no external URL
  });
});
