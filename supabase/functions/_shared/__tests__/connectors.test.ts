import { describe, it, expect } from "vitest";
import { abstractFromIndex, solrTerms } from "../connectors";

describe("connector helpers", () => {
  it("rebuilds an OpenAlex abstract from its inverted index", () => {
    expect(abstractFromIndex({ adaptation: [1], Climate: [0], matters: [2] })).toBe("Climate adaptation matters");
    expect(abstractFromIndex(null)).toBeNull();
  });

  it("strips Solr syntax and short words from IATI queries", () => {
    expect(solrTerms('food "security" (Nigeria) +x OR:1')).toEqual(["food", "security", "Nigeria"]);
    expect(solrTerms("a b")).toEqual([]);
  });
});
