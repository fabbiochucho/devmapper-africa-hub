import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import React, { Suspense } from "react";

// Mock supabase
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
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

import Index from "@/pages/Index";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserRoleProvider } from "@/contexts/UserRoleContext";

function TestWrapper({ initialRoute = "/" , children }: { initialRoute?: string; children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <MemoryRouter initialEntries={[initialRoute]}>
          <AuthProvider>
            <UserRoleProvider>{children}</UserRoleProvider>
          </AuthProvider>
        </MemoryRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe("Index page routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the landing page for unauthenticated users", async () => {
    render(<Index />, { wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper> });

    // After loading, should display landing page sections (not the dashboard)
    await waitFor(() => {
      expect(screen.queryByText(/please sign in to access your dashboard/i)).not.toBeInTheDocument();
    });
  });

  it("does NOT show dashboard content when not authenticated", async () => {
    render(<Index />, { wrapper: ({ children }) => <TestWrapper>{children}</TestWrapper> });

    await waitFor(() => {
      // UnifiedDashboard shows "Welcome back" — should NOT appear
      expect(screen.queryByText(/welcome back/i)).not.toBeInTheDocument();
    });
  });
});
