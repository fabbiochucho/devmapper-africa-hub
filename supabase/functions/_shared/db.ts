// Typed Supabase client for Edge Functions. database.types.ts is a copy of
// src/integrations/supabase/types.ts (Edge Functions can only import from supabase/functions);
// a unit test fails if the two drift - regenerate with `supabase gen types typescript`.
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { Database, Tables } from "./database.types.ts";

export type { Database, Tables };
export type Db = SupabaseClient<Database>;
