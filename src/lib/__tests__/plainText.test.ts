import { describe, it, expect } from "vitest";
import { plainText } from "../plainText";

describe("plainText", () => {
  it("strips HTML tags and decodes entities (IATI descriptions)", () => {
    expect(plainText('<p class="ql-align-justify">The assignment is to provide <b>technical</b> assistance &amp; support</p>'))
      .toBe("The assignment is to provide technical assistance & support");
  });

  it("turns markdown links into their text (HDX descriptions)", () => {
    expect(plainText("Contains data from the [DHS data portal](https://api.dhsprogram.com/). There is also a [consolidated dataset](https://data.humdata.org/x) on HDX."))
      .toBe("Contains data from the DHS data portal. There is also a consolidated dataset on HDX.");
  });

  it("drops headings and bold markers, keeps paragraph breaks", () => {
    expect(plainText("## Summary\n**Key** finding<br>second line")).toBe("Summary\nKey finding\nsecond line");
  });

  it("leaves plain text alone and handles empty input", () => {
    expect(plainText("Literacy program for children")).toBe("Literacy program for children");
    expect(plainText(null)).toBe("");
  });
});
