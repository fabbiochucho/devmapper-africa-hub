import { describe, it, expect, vi } from "vitest";
import "@/test/mocks/supabase";
import { render, screen } from "@/test/test-utils";
import AuthModal from "@/components/AuthModal";

describe("AuthModal", () => {
  it("does not render when closed", () => {
    render(
      <AuthModal isOpen={false} onClose={vi.fn()} onAuthSuccess={vi.fn()} />
    );
    expect(screen.queryByText(/sign in/i)).not.toBeInTheDocument();
  });
});
