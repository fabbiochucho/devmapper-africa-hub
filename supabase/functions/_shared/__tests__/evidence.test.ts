import { describe, it, expect } from "vitest";
import { EvidenceSet, evidenceCoverage, evidencePrompt, parseAnswer, synthesize, type Evidence } from "../evidence";

const ev = (): Evidence[] => {
  const s = new EvidenceSet();
  s.add({ label: "Report: Kisumu borehole", source: "devmapper", kind: "record", entityType: "project", entityId: "r1", path: "/project/r1", content: "{\"title\":\"Kisumu borehole\"}" });
  s.add({ label: "World Bank: population, Kenya", source: "worldbank", kind: "live", url: "https://data.worldbank.org", content: "55,100,586 (2023)" });
  return s.list;
};

describe("parseAnswer", () => {
  it("keeps only citations that exist and downgrades unsupported 'sourced' claims", () => {
    const raw = '```json\n{"summary":"S","keyInsights":[{"text":"A","sources":["E1","E9"],"basis":"sourced"},{"text":"B","sources":["E7"],"basis":"sourced"}],"risks":[],"recommendedActions":["Do X"],"missingData":["budget"]}\n```';
    const a = parseAnswer(raw, "intelligence", ev());
    expect(a.keyInsights[0]).toEqual({ text: "A", sources: ["E1"], basis: "sourced" });
    expect(a.keyInsights[1]).toEqual({ text: "B", sources: [], basis: "inference" });
    expect(a.recommendedActions[0].basis).toBe("inference");
    expect(a.confidenceScore).toBe(50);
    expect(a.missingData).toEqual(["budget"]);
  });

  it("falls back to plain text when the model ignores the JSON format", () => {
    const a = parseAnswer("Just prose.", "x", ev());
    expect(a.summary).toBe("Just prose.");
    expect(a.keyInsights).toEqual([]);
    expect(a.requiresHumanReview).toBe(true);
  });
});

describe("evidence helpers", () => {
  it("numbers evidence and renders it for the prompt", () => {
    const p = evidencePrompt(ev());
    expect(p).toContain("[E1] Report: Kisumu borehole");
    expect(p).toContain("source: worldbank (live)");
  });

  it("scores coverage on insights and risks only", () => {
    expect(evidenceCoverage({ keyInsights: [], risks: [] })).toBe(0);
    expect(evidenceCoverage({ keyInsights: [{ text: "a", sources: ["E1"], basis: "sourced" }], risks: [{ text: "b", sources: [], basis: "inference" }] })).toBe(50);
  });
});

describe("synthesize", () => {
  it("renumbers evidence across agents, merges duplicates and remaps citations", () => {
    const a1 = parseAnswer('{"summary":"one","keyInsights":[{"text":"A","sources":["E2"],"basis":"sourced"}]}', "intelligence", ev());
    const shared = ev();
    const a2 = parseAnswer('{"summary":"two","keyInsights":[{"text":"a","sources":["E1"],"basis":"sourced"},{"text":"C","sources":["E1"],"basis":"sourced"}]}', "verifier", [shared[0]]);
    const s = synthesize([a1, a2]);
    expect(s.evidence.map((e) => e.id)).toEqual(["1", "2"]);
    expect(s.keyInsights).toEqual([
      { text: "A", sources: ["2"], basis: "sourced" },
      { text: "C", sources: ["1"], basis: "sourced" },
    ]);
    expect(s.overallConfidence).toBe(100);
    expect(s.summary).toBe("one two");
  });
});
