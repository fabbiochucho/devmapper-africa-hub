import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SynthesisOutput {
  summary: string;
  keyInsights: string[];
  risks: string[];
  recommendedActions: string[];
  agentContributions: { agentName: string; mainContribution: string }[];
  overallConfidence: number;
  requiresHumanApproval: boolean;
  disclaimer: string;
}

export const useNdovuMultiAgent = () => {
  const runAnalysis = useMutation({
    mutationFn: async (input: {
      userMessage: string;
      userRole: string;
      contextData: Record<string, unknown>;
      expertMode: boolean;
    }): Promise<{ sessionId: string; synthesis: SynthesisOutput }> => {
      // Step 1: Route through orchestrator
      const { data: routingData, error: routingError } = await supabase.functions.invoke(
        "ndovu-orchestrator", { body: input }
      );
      if (routingError) throw routingError;

      const { sessionId, agentsToInvoke } = routingData;

      // Step 2: Invoke each agent in parallel
      await Promise.all(
        agentsToInvoke.map((agentName: string) =>
          supabase.functions.invoke(`ndovu-${agentName}-agent`, {
            body: { sessionId, ...input }
          })
        )
      );

      // Step 3: Synthesize
      const { data: synthesis, error: synthError } = await supabase.functions.invoke(
        "ndovu-synthesizer", {
          body: { sessionId, userId: input.contextData.userId }
        }
      );
      if (synthError) throw synthError;

      return { sessionId, synthesis };
    }
  });

  return { runAnalysis };
};
