import { describe, it, expect } from "vitest";
import { verifyHmacSignature, constantTimeEqual } from "../../../supabase/functions/_shared/webhookSignature";

async function hmacHex(secret: string, payload: string, hash: "SHA-256" | "SHA-512") {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

describe("constantTimeEqual (Flutterwave webhook auth)", () => {
  // Flutterwave's verif-hash is the static secret_hash configured in the
  // dashboard, sent verbatim on every webhook — not an HMAC of the body.
  const secretHash = "whsec_flw_static_abc123";

  it("accepts when the header matches the configured secret hash exactly", () => {
    expect(constantTimeEqual(secretHash, secretHash)).toBe(true);
  });

  it("rejects a mismatched secret hash", () => {
    expect(constantTimeEqual(secretHash, "whsec_flw_static_wrong")).toBe(false);
  });

  it("rejects a same-length hash that differs in a single character", () => {
    const flipped = "x" + secretHash.slice(1);
    expect(constantTimeEqual(secretHash, flipped)).toBe(false);
  });

  it("rejects an empty header", () => {
    expect(constantTimeEqual("", secretHash)).toBe(false);
  });

  it("does not accept an HMAC digest of the body as a substitute for the static hash", async () => {
    const payload = JSON.stringify({ event: "charge.completed", data: { status: "successful", amount: 100 } });
    const bodyHmac = await hmacHex(secretHash, payload, "SHA-256");
    expect(constantTimeEqual(bodyHmac, secretHash)).toBe(false);
  });
});

describe("verifyHmacSignature (used by Paystack webhook auth, SHA-512)", () => {
  const secret = "whsec_test_secret_12345";
  const payload = JSON.stringify({ event: "charge.completed", data: { status: "successful", amount: 100 } });

  it("accepts a correctly computed SHA-512 signature (Paystack)", async () => {
    const validSig = await hmacHex(secret, payload, "SHA-512");
    await expect(verifyHmacSignature(secret, payload, validSig, "SHA-512")).resolves.toBe(true);
  });

  it("rejects a signature computed with the wrong secret", async () => {
    const wrongSecretSig = await hmacHex("whsec_wrong_secret", payload, "SHA-256");
    await expect(verifyHmacSignature(secret, payload, wrongSecretSig, "SHA-256")).resolves.toBe(false);
  });

  it("rejects when the payload is tampered with after signing", async () => {
    const validSig = await hmacHex(secret, payload, "SHA-256");
    const tamperedPayload = JSON.stringify({ event: "charge.completed", data: { status: "successful", amount: 999999 } });
    await expect(verifyHmacSignature(secret, tamperedPayload, validSig, "SHA-256")).resolves.toBe(false);
  });

  it("rejects a signature of the wrong length instead of throwing", async () => {
    await expect(verifyHmacSignature(secret, payload, "abc123", "SHA-256")).resolves.toBe(false);
  });

  it("rejects an empty signature", async () => {
    await expect(verifyHmacSignature(secret, payload, "", "SHA-256")).resolves.toBe(false);
  });

  it("rejects a same-length signature that differs in a single character", async () => {
    const validSig = await hmacHex(secret, payload, "SHA-256");
    const flippedChar = validSig[0] === "0" ? "1" : "0";
    const almostRightSig = flippedChar + validSig.slice(1);
    await expect(verifyHmacSignature(secret, payload, almostRightSig, "SHA-256")).resolves.toBe(false);
  });

  it("defaults to SHA-256 when no hash argument is passed", async () => {
    const validSig = await hmacHex(secret, payload, "SHA-256");
    await expect(verifyHmacSignature(secret, payload, validSig)).resolves.toBe(true);
  });
});
