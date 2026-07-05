/**
 * Constant-time string equality check.
 *
 * Flutterwave's `verif-hash` header is not an HMAC digest of the request
 * body — it's the literal `secret_hash` string configured in the Flutterwave
 * dashboard, sent verbatim on every webhook. Verification is a plain
 * equality check against that configured value (done in constant time to
 * avoid leaking the secret via response-timing).
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Constant-time HMAC signature verification for payment provider webhooks
 * that sign the request body (eg. Paystack's HMAC-SHA512 via
 * `x-paystack-signature`). Compares against a hex-encoded digest.
 */
export async function verifyHmacSignature(
  secret: string,
  payload: string,
  signature: string,
  hash: "SHA-256" | "SHA-512" = "SHA-256"
): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  const expectedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // Constant-time comparison to prevent timing attacks
  if (signature.length !== expectedHash.length) return false;
  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedHash.charCodeAt(i);
  }
  return result === 0;
}
