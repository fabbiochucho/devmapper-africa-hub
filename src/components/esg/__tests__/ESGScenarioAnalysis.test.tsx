import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithAuth, screen, fireEvent, waitFor } from "@/test/test-utils";

const insertSingle = vi.fn();
const selectOrder = vi.fn();
const insertArgsMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: () => selectOrder(),
        }),
      }),
      insert: (args: unknown) => {
        insertArgsMock(args);
        return { select: vi.fn().mockReturnValue({ single: () => insertSingle() }) };
      },
    }),
  },
}));

// recharts renders SVG that jsdom doesn't lay out - stub it for this test.
vi.mock("recharts", () => ({
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => null,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
}));

import ESGScenarioAnalysis from "../ESGScenarioAnalysis";

const currentEmissions = { scope1: 10, scope2: 20, scope3: 30 };

describe("ESGScenarioAnalysis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectOrder.mockResolvedValue({ data: [], error: null });
  });

  it("shows an empty state when there are no scenarios", async () => {
    renderWithAuth(
      <ESGScenarioAnalysis organizationId="org-1" currentEmissions={currentEmissions} scenariosLimit={5} />,
    );

    await waitFor(() => {
      expect(screen.getByText(/0 \/ 5 scenarios/)).toBeInTheDocument();
    });
  });

  it("computes and persists projected results matching the projection formula", async () => {
    insertSingle.mockResolvedValue({
      data: {
        id: "scenario-1",
        name: "Net Zero 2030",
        assumptions: { renewable_target: 50, efficiency_improvement: 20, scope3_reduction: 30, carbon_price: 50 },
        // Mirrors the real shape calculateScenarioResults() produces - the
        // component re-renders this scenario card immediately after insert,
        // so an empty/partial results object here would crash on the
        // toLocaleString() calls in that card, not exercise a real bug.
        results: { projected_emissions: [60, 52], cost_savings: 1550, carbon_cost: 1450, roi_years: 8 },
      },
      error: null,
    });

    renderWithAuth(
      <ESGScenarioAnalysis organizationId="org-1" currentEmissions={currentEmissions} scenariosLimit={5} />,
    );

    fireEvent.click(await screen.findByRole("button", { name: /New Scenario/i }));
    fireEvent.change(screen.getByPlaceholderText("e.g., Net Zero 2030"), { target: { value: "Net Zero 2030" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Scenario" }));

    await waitFor(() => expect(insertSingle).toHaveBeenCalled());

    const insertArgs = insertArgsMock.mock.calls[0][0] as any;

    // Baseline year defaults to the current year, target year defaults to
    // 2030 - mirror the component's own math rather than hard-coding a
    // years constant, so this stays correct regardless of when it runs.
    const years = 2030 - new Date().getFullYear();
    const baselineTotal = 10 + 20 + 30;
    const totalReduction = (20 * 50) / 100 + (baselineTotal * 20) / 100 + (30 * 30) / 100;
    const expectedCostSavings = Math.round(baselineTotal * 50 - (baselineTotal - totalReduction) * 50);

    expect(insertArgs.organization_id).toBe("org-1");
    expect(insertArgs.name).toBe("Net Zero 2030");
    expect(insertArgs.results.cost_savings).toBe(expectedCostSavings);
    expect(insertArgs.results.projected_emissions).toHaveLength(years + 1);
  });

  it("blocks scenario creation once the scenarios limit is reached", async () => {
    selectOrder.mockResolvedValue({
      data: [{
        id: "s1", name: "Existing", description: "", baseline_year: 2026, target_year: 2030,
        assumptions: { renewable_target: 50, efficiency_improvement: 20, scope3_reduction: 30, carbon_price: 50 },
        results: null, status: "draft", created_at: new Date().toISOString(),
      }],
      error: null,
    });

    renderWithAuth(
      <ESGScenarioAnalysis organizationId="org-1" currentEmissions={currentEmissions} scenariosLimit={1} />,
    );

    await waitFor(() => expect(screen.getByText(/1 \/ 1 scenarios/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /New Scenario/i }));
    fireEvent.change(screen.getByPlaceholderText("e.g., Net Zero 2030"), { target: { value: "Should be blocked" } });
    fireEvent.click(screen.getByRole("button", { name: "Create Scenario" }));

    await waitFor(() => {
      expect(insertSingle).not.toHaveBeenCalled();
    });
  });
});
