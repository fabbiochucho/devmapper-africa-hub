import { describe, it, expect, vi, beforeEach } from "vitest";

const state = {
  insertArgs: null as any,
  upsertArgs: null as any,
  upsertOpts: null as any,
  deleteEqArgs: null as any,
  selectRows: [] as any[],
  insertError: null as Error | null,
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: (rows: any) => {
        state.insertArgs = rows;
        return Promise.resolve({ error: state.insertError });
      },
      upsert: (rows: any, opts: any) => {
        state.upsertArgs = rows;
        state.upsertOpts = opts;
        return Promise.resolve({ error: state.insertError });
      },
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: state.selectRows, error: null }),
        }),
      }),
      delete: () => ({
        eq: (col: string, val: string) => {
          state.deleteEqArgs = [col, val];
          return Promise.resolve({ error: state.insertError });
        },
      }),
    })),
  },
}));

import {
  saveSbtiPathway, listSbtiPathways, deleteSbtiPathway,
  saveCdpResponses,
  saveGlecCalculation,
} from "../standards-persistence";
import type { SbtiPathwayResult } from "../sbti-pathways";
import type { CdpAutoFillResponse } from "../cdp-questionnaire";
import type { GlecTransportResult } from "../glec-transport";

describe("standards-persistence", () => {
  beforeEach(() => {
    state.insertArgs = null;
    state.upsertArgs = null;
    state.upsertOpts = null;
    state.deleteEqArgs = null;
    state.selectRows = [];
    state.insertError = null;
  });

  it("saveSbtiPathway inserts a row scoped to the organization with the computed pathway as payload", async () => {
    const result: SbtiPathwayResult = {
      points: [{ year: 2025, emissions: 100, fractionOfBaseline: 1 }],
      annualReductionRate: 0.042,
      methodology: "ACA",
      withinRecommendedHorizon: true,
    };
    await saveSbtiPathway("org-1", "power", "near_term", 2025, 2030, result);

    expect(state.insertArgs).toHaveLength(1);
    expect(state.insertArgs[0]).toMatchObject({
      organization_id: "org-1",
      sector: "power",
      target_type: "near_term",
      baseline_year: 2025,
      target_year: 2030,
    });
    expect(state.insertArgs[0].pathway_data).toEqual(result);
  });

  it("saveSbtiPathway propagates a database error instead of swallowing it", async () => {
    state.insertError = new Error("permission denied");
    await expect(
      saveSbtiPathway("org-1", "power", "near_term", 2025, 2030, {
        points: [], annualReductionRate: 0, methodology: "ACA", withinRecommendedHorizon: false,
      }),
    ).rejects.toThrow("permission denied");
  });

  it("listSbtiPathways returns rows scoped by the select/eq/order chain", async () => {
    state.selectRows = [{ id: "1", sector: "power" }];
    const rows = await listSbtiPathways("org-1");
    expect(rows).toEqual(state.selectRows);
  });

  it("listSbtiPathways returns an empty array when no data comes back", async () => {
    state.selectRows = null as any;
    const rows = await listSbtiPathways("org-1");
    expect(rows).toEqual([]);
  });

  it("deleteSbtiPathway deletes by id", async () => {
    await deleteSbtiPathway("record-1");
    expect(state.deleteEqArgs).toEqual(["id", "record-1"]);
  });

  it("saveCdpResponses upserts one row per question code with an organization_id/question_code conflict target", async () => {
    const responses: CdpAutoFillResponse[] = [
      { code: "C1.1", response: { value: "yes" }, autoFilled: true },
      { code: "C4.1", response: null, autoFilled: false },
    ];
    await saveCdpResponses("org-1", responses);

    expect(state.upsertArgs).toHaveLength(2);
    expect(state.upsertArgs[0]).toMatchObject({ organization_id: "org-1", question_code: "C1.1", auto_filled: true });
    expect(state.upsertArgs[1]).toMatchObject({ organization_id: "org-1", question_code: "C4.1", auto_filled: false, response: {} });
    expect(state.upsertOpts).toEqual({ onConflict: "organization_id,question_code" });
  });

  it("saveGlecCalculation bundles mode/distance/weight/result into a single payload", async () => {
    const result: GlecTransportResult = {
      emissionsKgCo2e: 500, factorUsed: 0.1, mode: "road", classUsed: "articulated_34_40t", note: "test",
    };
    await saveGlecCalculation("org-1", "road", 1000, 5, result);

    expect(state.insertArgs[0].organization_id).toBe("org-1");
    expect(state.insertArgs[0].payload).toEqual({ mode: "road", distanceKm: 1000, weightTonnes: 5, result });
  });
});
