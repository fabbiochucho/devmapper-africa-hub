import { constantTimeEqual } from "./webhookSignature.ts";

/**
 * True if the request's Authorization bearer token matches this project's
 * service role key — used to let one edge function (eg. a payment webhook)
 * trigger another (eg. an admin-gated notification function) as a trusted
 * internal caller, without a human user JWT.
 */
export function isServiceRoleRequest(authHeader: string | null): boolean {
  if (!authHeader?.startsWith("Bearer ")) return false;
  const token = authHeader.slice("Bearer ".length);
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return serviceKey.length > 0 && constantTimeEqual(token, serviceKey);
}
