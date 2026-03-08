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

import UnifiedDashboard from "@/components/UnifiedDashboard";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserRoleProvider } from "@/contexts/UserRoleContext";

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

describe("UnifiedDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows sign-in prompt when user is not authenticated", async () => {
    render(<UnifiedDashboard />, { wrapper: Wrapper });
    expect(await screen.findByText("Please sign in to access your dashboard")).toBeInTheDocument();
  });

  it("contains a link to /auth for unauthenticated users", async () => {
    render(<UnifiedDashboard />, { wrapper: Wrapper });
    const link = await screen.findByRole("link", { name: "Sign In" });
    expect(link).toHaveAttribute("href", "/auth");
  });

  it("does not show role-specific cards when unauthenticated", async () => {
    render(<UnifiedDashboard />, { wrapper: Wrapper });
    await screen.findByText("Please sign in to access your dashboard");
    expect(screen.queryByText(/welcome back/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/citizen reporter/i)).not.toBeInTheDocument();
  });
});
