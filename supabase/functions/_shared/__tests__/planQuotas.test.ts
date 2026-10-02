import { describe, it, expect } from "vitest";
import { computePlanExpiry, getPlanPrice, paidInFull } from "../planQuotas";

describe("getPlanPrice", () => {
  it("charges the listed USD price for each interval", () => {
    expect([getPlanPrice("pro", "monthly"), getPlanPrice("pro", "quarterly"), getPlanPrice("pro", "yearly")]).toEqual([49, 129, 490]);
    expect([getPlanPrice("advanced", "monthly"), getPlanPrice("advanced", "quarterly"), getPlanPrice("advanced", "yearly")]).toEqual([149, 399, 1490]);
    expect([getPlanPrice("individual", "monthly"), getPlanPrice("individual", "quarterly"), getPlanPrice("individual", "yearly")]).toEqual([15, 40, 150]);
  });
  it("has no self-serve price for enterprise or unknown plans", () => {
    expect(getPlanPrice("enterprise", "monthly")).toBe(0);
    expect(getPlanPrice("free", "yearly")).toBe(0);
  });
});

describe("computePlanExpiry", () => {
  it("matches the billing interval", () => {
    const days = (i: string) => Math.round((new Date(computePlanExpiry(i)).getTime() - Date.now()) / 86_400_000);
    expect([days("monthly"), days("quarterly"), days("yearly")]).toEqual([30, 90, 365]);
  });
});

describe("paidInFull", () => {
  it("accepts the full amount in the expected currency", () => {
    expect(paidInFull({ amount: 49, currency: "usd" }, { amount: 49, currency: "USD" })).toBe(true);
    expect(paidInFull({ amount: 48.999999, currency: "USD" }, { amount: 49, currency: "USD" })).toBe(true);
  });
  it("rejects underpayment, a different currency, and plans with no price", () => {
    expect(paidInFull({ amount: 0.01, currency: "USD" }, { amount: 49, currency: "USD" })).toBe(false);
    expect(paidInFull({ amount: 49, currency: "NGN" }, { amount: 49, currency: "USD" })).toBe(false);
    expect(paidInFull({ amount: 49, currency: null }, { amount: 49, currency: "USD" })).toBe(false);
    expect(paidInFull({ amount: 0, currency: "USD" }, { amount: 0, currency: "USD" })).toBe(false);
  });
});
