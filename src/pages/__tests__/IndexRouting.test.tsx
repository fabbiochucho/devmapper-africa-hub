import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import React from "react";

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
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
        not: vi.fn().mockReturnValue({
          not: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

// Mock heavy map dependencies
vi.mock("maplibre-gl", () => ({ default: {} }));
vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: any) => <div data-testid="mock-map">{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
  Popup: () => null,
  useMap: () => ({}),
}));
vi.mock("react-leaflet-cluster", () => ({ default: ({ children }: any) => <div>{children}</div> }));
vi.mock("@/components/map/MapShell", () => ({ default: () => <div data-testid="mock-mapshell" /> }));
vi.mock("@/components/map/EnhancedProjectMap", () => ({ default: () => <div data-testid="mock-enhanced-map" /> }));

import Index from "@/pages/Index";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserRoleProvider } from "@/contexts/UserRoleContext";

function TestWrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <MemoryRouter initialEntries={["/"]}>
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
    render(<Index />, { wrapper: TestWrapper });

    await waitFor(() => {
      // Should NOT show dashboard sign-in prompt (that's UnifiedDashboard)
      expect(screen.queryByText("Please sign in to access your dashboard")).not.toBeInTheDocument();
    });
  });

  it("does NOT show dashboard content when not authenticated", async () => {
    render(<Index />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(screen.queryByText(/welcome back/i)).not.toBeInTheDocument();
    });
  });
});
