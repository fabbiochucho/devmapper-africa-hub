import { describe, it, expect } from "vitest";
import { signInSchema, signUpSchema } from "@/lib/authSchema";

describe("signInSchema", () => {
  it("validates correct email and password", () => {
    const result = signInSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = signInSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = signInSchema.safeParse({
      email: "test@example.com",
      password: "12345",
    });
    expect(result.success).toBe(false);
  });
});

describe("signUpSchema", () => {
  it("validates correct sign-up data", () => {
    const result = signUpSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
      role: "Citizen Reporter",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short name", () => {
    const result = signUpSchema.safeParse({
      name: "J",
      email: "john@example.com",
      password: "password123",
      role: "NGO Member",
    });
    expect(result.success).toBe(false);
  });
});
