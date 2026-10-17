import { describe, it, expect } from "vitest";
import { isTestAccountEmail } from "../testAccounts";

describe("isTestAccountEmail", () => {
  it("matches only the E2E test domain", () => {
    expect(isTestAccountEmail("admin@test.devmapper.africa")).toBe(true);
    expect(isTestAccountEmail("Admin@TEST.devmapper.africa")).toBe(true);
    expect(isTestAccountEmail("someone@devmapper.africa")).toBe(false);
    expect(isTestAccountEmail("me@gmail.com")).toBe(false);
    expect(isTestAccountEmail(null)).toBe(false);
  });
});
