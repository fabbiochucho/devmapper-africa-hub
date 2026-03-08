import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import HeroSection from "@/components/landing/HeroSection";

describe("HeroSection", () => {
  it("renders the hero section with CTA buttons", () => {
    const setShowAuthModal = vi.fn();
    render(<HeroSection user={null} setShowAuthModal={setShowAuthModal} />);
    
    // Should show get started or sign up button for unauthenticated users
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("renders without crashing when user is null", () => {
    const setShowAuthModal = vi.fn();
    const { container } = render(<HeroSection user={null} setShowAuthModal={setShowAuthModal} />);
    expect(container).toBeTruthy();
  });
});
