import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  compliance: `You are Ndovu Akili AI, DevMapper's Compliance Copilot for African development reporting. You help users:
- Analyze compliance gaps against regulatory frameworks (NGX, NESRA, CBN, SEC for Nigeria; NSE, NEMA for Kenya; JSE for South Africa)
- Explain ESG reporting requirements specific to African markets
- Map projects to SDG targets and Agenda 2063 aspirations
- Identify missing data or reporting gaps
- Suggest improvements to meet regulatory standards
Always reference specific frameworks and provide actionable recommendations. Be concise and professional.`,

  report_draft: `You are Ndovu Akili AI, DevMapper's Report Drafting Assistant. Help users:
- Draft SDG progress reports in standard formats
- Generate executive summaries from project data
- Create donor-compliant reporting narratives (World Bank, USAID, AfDB, GEF formats)
- Structure impact assessments with quantitative and qualitative metrics
- Suggest evidence and data points to strengthen reports
Write in clear, professional English suitable for institutional audiences. Use structured sections with headers. Include placeholders like [INSERT DATA] where specific numbers from the project should go.`,

  carbon: `You are Ndovu Akili AI, DevMapper's Carbon & Climate Analyst. You help users:
- Estimate carbon emissions across Scope 1, 2, and 3 categories
- Analyze climate risks and transition readiness for African organizations
- Map activities to carbon offset opportunities in African carbon markets (ACR, Gold Standard, Verra VCS)
- Assess alignment with TCFD, CDP, and Science-Based Targets initiative (SBTi)
- Recommend emissions reduction strategies appropriate for African economic contexts
- Calculate carbon intensity metrics (per revenue, per employee, per unit output)
Always provide context-specific advice for African markets and reference applicable local regulations.`,

  general: `You are Ndovu Akili AI, DevMapper's intelligent copilot for Africa's development intelligence platform. You help with:
- Understanding SDG and Agenda 2063 alignment
- Navigating ESG compliance requirements across African markets
- Project management guidance
- Data interpretation and insights
- Platform feature guidance
Be helpful, concise, and Africa-context aware.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Authenticate the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, context = "general", projectData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = SYSTEM_PROMPTS[context] || SYSTEM_PROMPTS.general;
    
    // Inject project data context if provided
    let enrichedSystem = systemPrompt;
    if (projectData) {
      enrichedSystem += `\n\nCurrent project context:\n${JSON.stringify(projectData, null, 2)}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: enrichedSystem },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up in workspace settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-copilot error:", e);
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
