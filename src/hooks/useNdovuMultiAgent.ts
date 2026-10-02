import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Mirrors supabase/functions/_shared/evidence.ts (Synthesis).
export interface NdovuEvidence {
  id: string;
  label: string;
  source: string;
  kind: "record" | "live";
  entityType?: string;
  entityId?: string;
  path?: string;
  url?: string;
  retrievedAt: string;
  content: string;
}

export interface NdovuClaim {
  text: string;
  sources: string[];
  basis: "sourced" | "inference";
}

export interface SynthesisOutput {
  question?: string;
  summary: string;
  keyInsights: NdovuClaim[];
  risks: NdovuClaim[];
  recommendedActions: NdovuClaim[];
  missingData: string[];
  evidence: NdovuEvidence[];
  agentContributions: { agentName: string; mainContribution: string; confidence?: number }[];
  overallConfidence: number;
  requiresHumanApproval: boolean;
  disclaimer: string;
}

export interface NdovuPlan {
  intent: string;
  searchTerms: string[];
  countries: string[];
  entityTypes: string[];
  classifiedBy: string;
}

export interface NdovuInput {
  userMessage: string;
  userRole: string;
  contextData: Record<string, unknown>;
  expertMode: boolean;
}

export interface NdovuResult {
  sessionId: string;
  plan: NdovuPlan;
  agents: string[];
  synthesis: SynthesisOutput;
}

/** Orchestrator -> agents (in parallel) -> synthesizer. */
export async function runNdovu(input: NdovuInput, onStage?: (stage: string, agents?: string[]) => void): Promise<NdovuResult> {
  onStage?.("routing");
  const { data: routing, error: routingError } = await supabase.functions.invoke("ndovu-orchestrator", {
    body: { userMessage: input.userMessage, userRole: input.userRole },
  });
  if (routingError) throw routingError;
  const { sessionId, agentsToInvoke, plan } = routing as { sessionId: string; agentsToInvoke: string[]; plan: NdovuPlan };

  onStage?.("agents", agentsToInvoke);
  // Agents read the question from the session; the client sends only page context.
  const results = await Promise.allSettled(
    agentsToInvoke.map((agent) =>
      supabase.functions.invoke(`ndovu-${agent === "project_developer" ? "project" : agent === "carbon_trader" ? "trader" : agent}-agent`, {
        body: { sessionId, contextData: input.contextData, expertMode: input.expertMode },
      }).then(({ error }) => { if (error) throw error; }),
    ),
  );
  if (results.every((r) => r.status === "rejected")) {
    const first = results[0] as PromiseRejectedResult;
    throw new Error(first.reason?.message ?? "All Ndovu agents failed to respond. Please try again.");
  }

  onStage?.("synthesis");
  const { data: synthesis, error: synthError } = await supabase.functions.invoke("ndovu-synthesizer", { body: { sessionId } });
  if (synthError) throw synthError;
  return { sessionId, plan, agents: agentsToInvoke, synthesis };
}

export const useNdovuMultiAgent = () => {
  const runAnalysis = useMutation({ mutationFn: (input: NdovuInput) => runNdovu(input) });
  return { runAnalysis };
};
