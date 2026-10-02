import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonError } from "../_shared/agent-utils.ts";

// Transcribes an uploaded PDF or image to plain text so Ndovu Akili can cite passages from it.
// Nothing is stored: the text goes back to the caller, who sends it with their question.
// (Plain-text files are read in the browser and never come here.)
const MAX_DATA_URL_LENGTH = 11_000_000; // ~8MB file, base64-inflated
const ALLOWED = /^data:(application\/pdf|image\/(png|jpe?g|webp));base64,/;

const PROMPT = `Transcribe all readable text in this document faithfully, in reading order.
- Keep headings, numbers, dates, names and units exactly as written.
- Render tables as rows with cells separated by " | ".
- Do not summarise, interpret, translate or add anything that is not in the document.
- If a part is illegible, write [illegible].`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonError("Unauthorized", 401);
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
  const { data: { user } } = await db.auth.getUser();
  if (!user) return jsonError("Unauthorized", 401);

  let body: { dataUrl?: unknown } | null;
  try { body = await req.json(); } catch { return jsonError("Invalid JSON body", 400); }
  const dataUrl = body?.dataUrl;
  if (typeof dataUrl !== "string" || !ALLOWED.test(dataUrl)) return jsonError("Upload a PDF, PNG, JPEG or WebP file", 400);
  if (dataUrl.length > MAX_DATA_URL_LENGTH) return jsonError("File is too large (max 8 MB)", 413);

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return jsonError("AI service not configured", 503);
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      max_tokens: 8000,
      messages: [{ role: "user", content: [{ type: "text", text: PROMPT }, { type: "image_url", image_url: { url: dataUrl } }] }],
    }),
  });
  if (resp.status === 429) return jsonError("Rate limit exceeded. Please try again shortly.", 429);
  if (resp.status === 402) return jsonError("AI credits exhausted.", 402);
  if (!resp.ok) {
    console.error("[extract-document] gateway error", resp.status, (await resp.text().catch(() => "")).slice(0, 300));
    return jsonError("Couldn't read this document", 502);
  }
  const data = await resp.json();
  const text: string = data.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) return jsonError("No readable text found in this document", 422);
  return new Response(JSON.stringify({ text: text.slice(0, 60_000) }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
