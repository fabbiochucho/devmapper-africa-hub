import { describe, it, expect } from "vitest";
import { planReceiptText } from "../planReceipt";

describe("planReceiptText", () => {
  it("states the amount, reference and that the plan does not renew", () => {
    const text = planReceiptText({ to: "a@b.c", plan: "pro", interval: "yearly", amount: 490, currency: "USD", reference: "ref_1" });
    expect(text).toContain("Plan: pro (yearly)");
    expect(text).toContain("Amount: 490.00 USD");
    expect(text).toContain("Reference: ref_1");
    expect(text).toContain("does not renew automatically");
    expect(text).toContain("P.O. Box 2550");
  });
});
