import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithAuth, screen, fireEvent, waitFor } from "@/test/test-utils";

const insertSingle = vi.fn();
const invokeMock = vi.fn();
let donorContext: unknown = null;

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
    donorContext = null;
    invokeMock.mockImplementation((fn: string) => Promise.resolve(
      fn === "create-payment" ? { data: { payment_link: "https://pay.example/checkout" }, error: null } : { data: donorContext, error: null },
    ));
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
      expect(invokeMock).not.toHaveBeenCalledWith("create-payment", expect.anything());
    });
  });

  it("suggests naira amounts with a local estimate for a donor abroad", async () => {
    donorContext = { country: "KE", currency: "KES", perNgn: { USD: 1 / 1328, KES: 0.0976 } };
    renderWithAuth(<DonationDialog campaign={{ ...campaign, currency: "NGN" }} open onOpenChange={() => {}} onDonationComplete={() => {}} />);

    expect(await screen.findByText(/≈ KES\s?3,221/)).toBeInTheDocument(); // ₦33,000
    expect(screen.getByText(/Rates by ExchangeRate-API/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Donate NGN\s?66,000\.00/ })).toBeInTheDocument(); // second preset
  });

  it("charges a custom amount typed by the donor", async () => {
    renderWithAuth(<DonationDialog campaign={campaign} open onOpenChange={() => {}} onDonationComplete={() => {}} />);

    fireEvent.change(screen.getByLabelText(/Or enter custom amount/), { target: { value: "75" } });
    fireEvent.change(screen.getByLabelText(/Email Address/), { target: { value: "donor@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Donate \$75\.00/ }));

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith(
        "create-payment",
        expect.objectContaining({ body: expect.objectContaining({ amount: 75 }) }),
      );
    });
  });

  it("asks create-payment to record the donation and redirects to the returned payment link", async () => {
    renderWithAuth(<DonationDialog campaign={campaign} open onOpenChange={() => {}} onDonationComplete={() => {}} />);

    fireEvent.change(screen.getByLabelText(/Email Address/), { target: { value: "donor@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: /Donate/ }));

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith(
        "create-payment",
        expect.objectContaining({
          body: expect.objectContaining({ payment_type: "donation", campaign_id: "campaign-1", amount: 50, email: "donor@example.com" }),
        }),
      );
    });

    await waitFor(() => {
      expect(window.location.href).toBe("https://pay.example/checkout");
    });
    // The donation row is created server-side now; the browser must not insert it.
    expect(insertSingle).not.toHaveBeenCalled();
  });
});
