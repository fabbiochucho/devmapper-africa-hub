import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithAuth, screen, waitFor } from "@/test/test-utils";

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

describe("Index page routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the landing page for unauthenticated users", async () => {
    renderWithAuth(<Index />);

    await waitFor(() => {
      // Should NOT show dashboard sign-in prompt (that's UnifiedDashboard)
      expect(screen.queryByText("Please sign in to access your dashboard")).not.toBeInTheDocument();
    });
  });

  it("does NOT show dashboard content when not authenticated", async () => {
    renderWithAuth(<Index />);

    await waitFor(() => {
      expect(screen.queryByText(/welcome back/i)).not.toBeInTheDocument();
    });
  });
});
