import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithAuth, screen } from "@/test/test-utils";

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
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }),
  },
}));

import UnifiedDashboard from "@/components/UnifiedDashboard";

describe("UnifiedDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows sign-in prompt when user is not authenticated", async () => {
    renderWithAuth(<UnifiedDashboard />);
    expect(await screen.findByText("Please sign in to access your dashboard")).toBeInTheDocument();
  });

  it("contains a link to /auth for unauthenticated users", async () => {
    renderWithAuth(<UnifiedDashboard />);
    const link = await screen.findByRole("link", { name: "Sign In" });
    expect(link).toHaveAttribute("href", "/auth");
  });

  it("does not show role-specific cards when unauthenticated", async () => {
    renderWithAuth(<UnifiedDashboard />);
    await screen.findByText("Please sign in to access your dashboard");
    expect(screen.queryByText(/welcome back/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/citizen reporter/i)).not.toBeInTheDocument();
  });
});
