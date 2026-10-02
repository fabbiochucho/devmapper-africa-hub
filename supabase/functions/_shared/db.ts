// Typed Supabase client for Edge Functions. database.types.ts is a copy of
// src/integrations/supabase/types.ts (Edge Functions can only import from supabase/functions);
// a unit test fails if the two drift - regenerate with `supabase gen types typescript`.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { Database, Tables } from "./database.types.ts";

export type { Database, Tables };
export type Db = SupabaseClient<Database>;

type AuditArgs = Database["public"]["Functions"]["log_audit_event"]["Args"];
type Nullable<T, K extends keyof T> = Omit<T, K> & { [P in K]?: T[P] | null };

/** log_audit_event with the SQL function's real nullability (generated rpc types mark every arg non-null). */
export function logAuditEvent(db: Db, args: Nullable<AuditArgs, "p_actor_id" | "p_org_id" | "p_target_id" | "p_target_table">) {
  return db.rpc("log_audit_event", args as AuditArgs);
}

/** Marks an already-JSON value (a parsed API response or plain object literal) for a jsonb column. */
export const asJson = (value: unknown) => value as Database["public"]["Tables"]["alphaearth_cache"]["Row"]["payload"];
