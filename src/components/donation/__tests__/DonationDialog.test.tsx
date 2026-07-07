import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithAuth, screen, fireEvent, waitFor } from "@/test/test-utils";

const insertSingle = vi.fn();
const invokeMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: () => insertSingle(),
        }),
      }),
    }),
    functions: {
      invoke: (...args: unknown[]) => invokeMock(...args),
    },
  },
}));

import { DonationDialog } from "../DonationDialog";

const campaign = {
  id: "campaign-1",
  title: "Solar Panels for Rural School",
  description: "Bringing clean energy to a rural community.",
  target_amount: 1000,
  raised_amount: 250,
  currency: "USD",
  sdg_goals: [7, 13],
  location: "Nairobi, Kenya",
  deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
};

describe("DonationDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertSingle.mockResolvedValue({ data: { id: "donation-1" }, error: null });
    invokeMock.mockResolvedValue({ data: { payment_link: "https://pay.example/checkout" }, error: null });
    // jsdom doesn't implement navigation - stub it so handleDonate's redirect doesn't throw
    delete (window as any).location;
    (window as any).location = { href: "" };
  });

  it("renders campaign progress and formatted amounts", () => {
    renderWithAuth(<DonationDialog campaign={campaign} open onOpenChange={() => {}} onDonationComplete={() => {}} />);

    expect(screen.getByText("Solar Panels for Rural School")).toBeInTheDocument();
    expect(screen.getByText(/\$250\.00 raised/)).toBeInTheDocument();
    expect(screen.getByText(/of \$1,000\.00/)).toBeInTheDocument();
  });

  it("shows the days remaining until the deadline", () => {
    renderWithAuth(<DonationDialog campaign={campaign} open onOpenChange={() => {}} onDonationComplete={() => {}} />);
    expect(screen.getByText(/10 days left/)).toBeInTheDocument();
  });

  it("renders no dialog when campaign is null", () => {
    renderWithAuth(<DonationDialog campaign={null} open onOpenChange={() => {}} onDonationComplete={() => {}} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("updates the donate button amount when a preset is selected", () => {
    renderWithAuth(<DonationDialog campaign={campaign} open onOpenChange={() => {}} onDonationComplete={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "$100.00" }));
    expect(screen.getByRole("button", { name: /Donate \$100\.00/ })).toBeInTheDocument();
  });

  it("rejects submission without an email address", async () => {
    renderWithAuth(<DonationDialog campaign={campaign} open onOpenChange={() => {}} onDonationComplete={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: /Donate/ }));

    await waitFor(() => {
      expect(insertSingle).not.toHaveBeenCalled();
    });
  });

  it("creates a donation record and redirects to the returned payment link", async () => {
    renderWithAuth(<DonationDialog campaign={campaign} open onOpenChange={() => {}} onDonationComplete={() => {}} />);

    fireEvent.change(screen.getByLabelText(/Email Address/), { target: { value: "donor@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Donate/ }));

    await waitFor(() => {
      expect(insertSingle).toHaveBeenCalled();
      expect(invokeMock).toHaveBeenCalledWith(
        "create-payment",
        expect.objectContaining({
          body: expect.objectContaining({ payment_type: "donation", campaign_id: "campaign-1" }),
        }),
      );
    });

    await waitFor(() => {
      expect(window.location.href).toBe("https://pay.example/checkout");
    });
  });
});
