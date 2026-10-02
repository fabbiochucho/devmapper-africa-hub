import { describe, it, expect, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { toTarget } from "../corporateTargets";

describe("toTarget", () => {
  it("derives progress and keeps only well-formed history entries", () => {
    const t = toTarget({
      id: "t1", company_id: "u", title: "Solar", description: "", target_value: 50, current_value: 20, unit: "MW",
      target_date: "2027-01-01", sdg_goals: [7], status: "active", visibility: "private", created_at: "", updated_at: "",
      country_code: "KE", progress_history: [{ value: 20, recordedAt: "2026-01-01", notes: "" }, { bad: true }],
    });
    expect(t.progress).toBe(40);
    expect(t.sdgGoal).toBe(7);
    expect(t.progressHistory).toHaveLength(1);
  });
});
