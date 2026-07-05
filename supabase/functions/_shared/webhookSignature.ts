/**
 * Constant-time HMAC signature verification for payment provider webhooks
 * (Flutterwave uses HMAC-SHA256 via `verif-hash`, Paystack uses HMAC-SHA512
 * via `x-paystack-signature`). Both compare against a hex-encoded digest.
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
