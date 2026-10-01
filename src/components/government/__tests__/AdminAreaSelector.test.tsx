import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

// country -> state -> district hierarchy for one country
const AREAS = [
  { id: "c1", name: "Ghana", level: "country", parent_id: null, country_code: "GH" },
  { id: "s1", name: "Greater Accra", level: "state", parent_id: "c1", country_code: "GH" },
  { id: "s2", name: "Ashanti", level: "state", parent_id: "c1", country_code: "GH" },
  { id: "d1", name: "Accra Metropolitan", level: "district", parent_id: "s1", country_code: "GH" },
];

// Minimal fluent mock of the admin_areas queries AdminAreaSelector makes.
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => {
      const filters: Record<string, unknown> = {};
      const run = () => AREAS.filter((a) => Object.entries(filters).every(([k, v]) => (a as Record<string, unknown>)[k] === v));
      const q = {
        select: () => q,
        eq: (k: string, v: unknown) => ((filters[k] = v), q),
        is: (k: string, v: unknown) => ((filters[k] = v), q),
        order: () => Promise.resolve({ data: run(), error: null }),
        maybeSingle: () => Promise.resolve({ data: run()[0] ?? null, error: null }),
      };
      return q;
    },
  },
}));

import AdminAreaSelector from "../AdminAreaSelector";

describe("AdminAreaSelector", () => {
  it("pre-fills every level above the given value", async () => {
    render(<AdminAreaSelector countryCode="GH" value="d1" onChange={() => {}} />);
    await waitFor(() => expect(screen.getAllByText("Accra Metropolitan").length).toBeGreaterThan(0));
    expect(screen.getAllByText(/Ghana/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Greater Accra/).length).toBeGreaterThan(0);
  });

  it("starts empty at the country level without a value", async () => {
    render(<AdminAreaSelector countryCode="GH" onChange={() => {}} />);
    await waitFor(() => expect(screen.getByText("Select country")).toBeInTheDocument());
    expect(screen.queryByText(/Greater Accra/)).not.toBeInTheDocument();
  });
});
