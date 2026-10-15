import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const invokeMock = vi.fn();
const counts: Record<string, number> = { reports: 3, verification_logs: 21 };

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      const chain = { eq: () => chain, then: (resolve: (v: unknown) => void) => resolve({ count: counts[table], error: null }) };
      return { select: () => chain };
    },
    functions: { invoke: (...args: unknown[]) => invokeMock(...args) },
  },
}));
// A stable object, like the real context: a new one per render would re-run the progress effect forever.
const auth = { user: { id: "user-1", email: "me@example.org" } };
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth }));

import Training from "../Training";

const renderPage = () => render(<MemoryRouter><Training /></MemoryRouter>);
const openTab = (name: string) => {
  const tab = screen.getByRole("tab", { name });
  fireEvent.mouseDown(tab);
  fireEvent.click(tab);
};

describe("Training", () => {
  beforeEach(() => vi.clearAllMocks());

  it("has no 'coming soon' placeholders and links each course to real guide pages", () => {
    renderPage();
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument();
    const start = screen.getAllByRole("link", { name: /start course/i });
    expect(start.map((a) => a.getAttribute("href"))).toEqual(["/platform-overview", "/guidelines", "/certification-workflow"]);
  });

  it("shows certification progress from the user's real activity, capped at the target", async () => {
    renderPage();
    openTab("Certification");
    expect(await screen.findByText("3 / 5")).toBeInTheDocument();
    expect(screen.getByText("20 / 20")).toBeInTheDocument();
  });

  it("sends a workshop request through the contact pipeline", async () => {
    invokeMock.mockResolvedValue({ data: { success: true }, error: null });
    renderPage();
    openTab("Workshops");
    fireEvent.change(await screen.findByLabelText("Your name"), { target: { value: "Ada" } });
    fireEvent.change(screen.getByLabelText("Organisation"), { target: { value: "Lagos NGO" } });
    fireEvent.change(screen.getByLabelText("What would you like covered?"), { target: { value: "Verification basics" } });
    fireEvent.click(screen.getByRole("button", { name: "Request workshop" }));
    await waitFor(() => expect(invokeMock).toHaveBeenCalled());
    const [fn, { body }] = invokeMock.mock.calls[0] as [string, { body: Record<string, string> }];
    expect(fn).toBe("send-contact-email");
    expect(body).toMatchObject({ name: "Ada", email: "me@example.org", subject: "Workshop request: General" });
    expect(body.message).toContain("Organisation: Lagos NGO");
  });

  it("offers every bulk-upload template for download", () => {
    renderPage();
    openTab("Resources");
    expect(screen.getAllByRole("button", { name: /CSV/ })).toHaveLength(4);
  });
});
