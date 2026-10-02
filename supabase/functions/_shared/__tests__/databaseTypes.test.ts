import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

// Edge Functions keep their own copy of the generated DB types; it must match the app's.
describe("Edge Function database types", () => {
  it("match src/integrations/supabase/types.ts", () => {
    const read = (p: string) => readFileSync(resolve(__dirname, p), "utf8").split("\r\n").join("\n");
    expect(read("../database.types.ts")).toBe(read("../../../../src/integrations/supabase/types.ts"));
  });
});
