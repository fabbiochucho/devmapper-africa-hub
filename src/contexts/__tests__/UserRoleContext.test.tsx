import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, renderWithAuth, screen } from "@/test/test-utils";

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

import { useUserRole } from "@/contexts/UserRoleContext";

// Helper component to expose context values
function RoleDisplay() {
  const { currentRole, roles, hasRole, isAuthenticated } = useUserRole();
  return (
    <div>
      <span data-testid="current-role">{currentRole}</span>
      <span data-testid="role-count">{roles.length}</span>
      <span data-testid="is-auth">{String(isAuthenticated)}</span>
      <span data-testid="has-admin">{String(hasRole("admin"))}</span>
      <span data-testid="has-citizen">{String(hasRole("citizen_reporter"))}</span>
    </div>
  );
}

describe("UserRoleContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("defaults to citizen_reporter when not authenticated", async () => {
    renderWithAuth(<RoleDisplay />);

    expect(await screen.findByTestId("current-role")).toHaveTextContent("citizen_reporter");
    expect(screen.getByTestId("is-auth")).toHaveTextContent("false");
  });

  it("reports no admin role for unauthenticated user", async () => {
    renderWithAuth(<RoleDisplay />);

    expect(await screen.findByTestId("has-admin")).toHaveTextContent("false");
  });

  it("has empty roles array when unauthenticated", async () => {
    renderWithAuth(<RoleDisplay />);

    expect(await screen.findByTestId("role-count")).toHaveTextContent("0");
  });

  it("throws error when used outside provider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => {
      render(<RoleDisplay />);
    }).toThrow("useUserRole must be used within a UserRoleProvider");
    consoleSpy.mockRestore();
  });
});
