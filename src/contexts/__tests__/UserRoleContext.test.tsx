import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import React from "react";

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

import { UserRoleProvider, useUserRole } from "@/contexts/UserRoleContext";
import { AuthProvider } from "@/contexts/AuthContext";

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

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <BrowserRouter>
          <AuthProvider>
            <UserRoleProvider>{children}</UserRoleProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe("UserRoleContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("defaults to citizen_reporter when not authenticated", async () => {
    render(<RoleDisplay />, { wrapper: Wrapper });

    expect(await screen.findByTestId("current-role")).toHaveTextContent("citizen_reporter");
    expect(screen.getByTestId("is-auth")).toHaveTextContent("false");
  });

  it("reports no admin role for unauthenticated user", async () => {
    render(<RoleDisplay />, { wrapper: Wrapper });

    expect(await screen.findByTestId("has-admin")).toHaveTextContent("false");
  });

  it("has empty roles array when unauthenticated", async () => {
    render(<RoleDisplay />, { wrapper: Wrapper });

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
