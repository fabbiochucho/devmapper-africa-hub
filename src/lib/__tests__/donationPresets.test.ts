import { describe, it, expect } from "vitest";
import { donationPresets, roundNicely, type DonorContext } from "../donationPresets";

const perNgn = { USD: 1 / 1328, KES: 0.0976, NGN: 1 };
const ctx = (country: string | null, currency: string | null): DonorContext => ({ country, currency, perNgn });

describe("donationPresets", () => {
  it("gives Nigerian donors the naira ladder with no estimates", () => {
    const p = donationPresets("NGN", ctx("NG", "NGN"));
    expect(p.map((x) => x.amount)).toEqual([5000, 10000, 25000, 50000, 100000, 250000]);
    expect(p.every((x) => !x.estimate)).toBe(true);
  });

  it("falls back to the naira ladder when the donor can't be located or rates are missing", () => {
    expect(donationPresets("NGN", null)[0].amount).toBe(5000);
    expect(donationPresets("NGN", ctx(null, null))[0].amount).toBe(5000);
    expect(donationPresets("NGN", { country: "KE", currency: "KES", perNgn: null })[0].amount).toBe(5000);
  });

  it("prices a naira campaign in $25-$1,000 steps for donors abroad, with a local estimate", () => {
    const p = donationPresets("NGN", ctx("KE", "KES"));
    expect(p.map((x) => x.amount)).toEqual([33000, 66000, 130000, 330000, 660000, 1300000]);
    expect(p[0].estimate?.currency).toBe("KES");
    expect(p[0].estimate?.value).toBeCloseTo(33000 * 0.0976);
  });

  it("estimates in USD when there is no rate for the donor's currency", () => {
    expect(donationPresets("NGN", ctx("ZW", "ZWG"))[0].estimate?.currency).toBe("USD");
  });

  it("uses the dollar ladder for USD campaigns and skips a same-currency estimate", () => {
    expect(donationPresets("USD", ctx("US", "USD")).map((p) => [p.amount, p.estimate])).toEqual(
      [25, 50, 100, 250, 500, 1000].map((a) => [a, undefined]),
    );
    expect(donationPresets("USD", ctx("KE", "KES"))[0].estimate?.value).toBeCloseTo(25 * 1328 * 0.0976);
    expect(donationPresets("USD", null).map((p) => p.amount)).toEqual([25, 50, 100, 250, 500, 1000]);
  });
});

describe("roundNicely", () => {
  it("keeps two significant figures", () => {
    expect([roundNicely(33201), roundNicely(1327900), roundNicely(98)]).toEqual([33000, 1300000, 98]);
  });
});
