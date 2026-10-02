import { describe, it, expect } from "vitest";
import { agentsFor, buildPlan, keywordIntent } from "../intent";

describe("buildPlan", () => {
  it("uses the model's classification and normalises its fields", () => {
    const p = buildPlan('Sure! {"intent":"discovery","searchTerms":["climate adaptation"," "],"countries":["nga","Nigeria"],"entityTypes":["organization"]}', "Who works on climate adaptation in Northern Nigeria?", "investor");
    expect(p).toEqual({ intent: "discovery", searchTerms: ["climate adaptation"], countries: ["NGA"], entityTypes: ["organization"], classifiedBy: "llm" });
  });

  it("routes a development question to discovery even for an investor when the model is unavailable", () => {
    const p = buildPlan("not json", "Which organisations work on food security in Kano?", "investor");
    expect(p.intent).toBe("discovery");
    expect(p.classifiedBy).toBe("default");
    expect(p.searchTerms[0]).toBe("food security Kano");
  });

  it("falls back to keyword rules, then to the role only when the question is unclear", () => {
    expect(buildPlan(null, "Is this project greenwashing?", "citizen_reporter").intent).toBe("verification");
    expect(buildPlan('{"intent":"unclear"}', "Help me", "government_official")).toMatchObject({ intent: "compliance", classifiedBy: "role" });
    expect(buildPlan('{"intent":"unclear"}', "Help me", "citizen_reporter").intent).toBe("discovery");
  });
});

describe("routing tables", () => {
  it("keeps the intelligence agent on development questions", () => {
    expect(agentsFor("discovery")).toEqual(["intelligence"]);
    expect(agentsFor("investment")[0]).toBe("investor");
    expect(keywordIntent("What does CSRD require?")).toBe("compliance");
    expect(keywordIntent("Where should I fund water projects?")).toBeNull();
  });
});
