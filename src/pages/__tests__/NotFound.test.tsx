import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/test-utils";
import NotFound from "@/pages/NotFound";

describe("NotFound page", () => {
  it("renders 404 message", () => {
    render(<NotFound />);
    expect(screen.getByText(/404/i)).toBeInTheDocument();
  });

  it("has a link back to home", () => {
    render(<NotFound />);
    const homeLink = screen.getByRole("link", { name: /home|back/i });
    expect(homeLink).toHaveAttribute("href", "/");
  });
});
