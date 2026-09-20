import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// §31: "upload a bill, extract activity data" - a thin vision-LLM pass over
// a photographed utility bill/fuel receipt that returns SUGGESTED activity
// data for the carbon calculator's existing activity-based entry form
// (CarbonTab.tsx). This never writes anything itself - the caller still has
// to pick a matching emission factor and review the quantity before saving,
// same as a manually-typed entry, so a bad extraction can't silently become
// "verified" data.
const MAX_IMAGE_BASE64_LENGTH = 7_000_000; // ~5MB image, base64-inflated

const EXTRACTION_PROMPT = `You are extracting structured activity data from a photographed utility bill, fuel receipt, or invoice for a carbon accounting tool. Look at the image and respond with ONLY a JSON object (no markdown, no commentary) matching this shape:

{
  "activity_type": "electricity" | "fuel" | "water" | "waste" | "transport" | "unknown",
  "quantity": number | null,
  "unit": string | null,
  "vendor": string | null,
  "billing_period": string | null,
  "confidence": "high" | "medium" | "low"
}

Rules:
- "quantity" and "unit" should reflect the actual consumption/activity shown (e.g. kWh of electricity, litres of diesel, m3 of water), NOT the monetary amount charged.
- If you cannot clearly read a field, use null for it rather than guessing.
- If the image isn't a bill/receipt/invoice at all, set activity_type to "unknown" and confidence to "low".
- Never invent numbers that aren't visible in the image.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const { imageDataUrl } = await req.json();
    if (typeof imageDataUrl !== "string" || !imageDataUrl.startsWith("data:image/")) {
      throw new Error("imageDataUrl must be a data:image/... URL");
    }
    if (imageDataUrl.length > MAX_IMAGE_BASE64_LENGTH) {
      throw new Error("Image too large (max ~5MB)");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI service not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: EXTRACTION_PROMPT },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up in workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text().catch(() => "");
      console.error("[EXTRACT-BILL-DATA] Gateway error:", response.status, t);
      throw new Error("AI service unavailable");
    }

    const data = await response.json();
    const rawContent: string = data.choices?.[0]?.message?.content ?? "";
    const cleaned = rawContent.replace(/```json\s*|```/g, "").trim();

    let extracted: Record<string, unknown>;
    try {
      extracted = JSON.parse(cleaned);
    } catch {
      return new Response(JSON.stringify({
        activity_type: "unknown", quantity: null, unit: null, vendor: null, billing_period: null,
        confidence: "low", warning: "Could not parse a structured result from this image.",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify(extracted), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[EXTRACT-BILL-DATA] Error:", error);
    const isAuth = error instanceof Error && error.message === "Unauthorized";
    return new Response(JSON.stringify({ error: isAuth ? "Unauthorized" : (error as Error).message ?? "Internal server error" }), {
      status: isAuth ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
