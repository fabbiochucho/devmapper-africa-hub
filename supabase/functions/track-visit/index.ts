// Page-view counter for everyone, signed in or not. verify_jwt = false.
// Stores: path (no query string), referring site (host only), browser user agent,
// approximate country and time. Never the IP address, and nothing is stored on the
// visitor's device, so no consent banner is needed.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { Database } from "../_shared/db.ts";
import { countryOf } from "../_shared/geo.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const db = createClient<Database>(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

function referrerHost(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw) return null;
  try {
    return new URL(raw).host.slice(0, 200) || null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(null, { status: 405, headers: corsHeaders });

  // ponytail: no rate limit; anyone can post fake views. Add per-IP throttling if the counts get gamed.
  const body = await req.json().catch(() => null);
  const path = typeof body?.path === "string" ? body.path.split(/[?#]/)[0].slice(0, 300) : "";
  if (!path.startsWith("/")) return new Response(null, { status: 400, headers: corsHeaders });

  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  const { data: auth } = token ? await db.auth.getUser(token) : { data: { user: null } };

  const { error } = await db.from("analytics_events").insert({
    event_type: "page_view",
    user_id: auth?.user?.id ?? null,
    page_url: `https://devmapper.africa${path}`,
    referrer: referrerHost(body?.referrer),
    user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
    event_data: { country: await countryOf(req), title: typeof body?.title === "string" ? body.title.slice(0, 200) : null },
  });
  if (error) console.error("track-visit insert failed", error.message);
  return new Response(null, { status: error ? 500 : 204, headers: corsHeaders });
});
