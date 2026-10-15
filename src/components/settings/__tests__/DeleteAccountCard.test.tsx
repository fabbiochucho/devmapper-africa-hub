import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const invokeMock = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invokeMock(...args) } },
}));

import DeleteAccountCard from "../DeleteAccountCard";

const openDialog = () => fireEvent.click(screen.getByRole("button", { name: "Delete Account" }));
const confirmButton = () => screen.getByRole("button", { name: "Delete my account" });

describe("DeleteAccountCard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("only enables deletion once DELETE is typed", () => {
    render(<DeleteAccountCard onDeleted={vi.fn()} />);
    openDialog();
    expect(confirmButton()).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Type DELETE to confirm"), { target: { value: "delete" } });
    expect(confirmButton()).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Type DELETE to confirm"), { target: { value: "DELETE" } });
    expect(confirmButton()).toBeEnabled();
  });

  it("calls delete-account and signs out on success", async () => {
    invokeMock.mockResolvedValue({ data: { success: true }, error: null });
    const onDeleted = vi.fn();
    render(<DeleteAccountCard onDeleted={onDeleted} />);
    openDialog();
    fireEvent.change(screen.getByLabelText("Type DELETE to confirm"), { target: { value: "DELETE" } });
    fireEvent.click(confirmButton());
    await waitFor(() => expect(onDeleted).toHaveBeenCalled());
    expect(invokeMock).toHaveBeenCalledWith("delete-account", { body: { confirm: "DELETE" } });
  });

  it("does not sign out when deletion fails", async () => {
    invokeMock.mockResolvedValue({ data: null, error: new Error("500") });
    const onDeleted = vi.fn();
    render(<DeleteAccountCard onDeleted={onDeleted} />);
    openDialog();
    fireEvent.change(screen.getByLabelText("Type DELETE to confirm"), { target: { value: "DELETE" } });
    fireEvent.click(confirmButton());
    await waitFor(() => expect(invokeMock).toHaveBeenCalled());
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
