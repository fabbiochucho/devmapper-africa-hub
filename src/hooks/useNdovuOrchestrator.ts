import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface OrchestratorInput {
  userMessage: string;
  userRole: string;
  contextData: Record<string, unknown>;
  expertMode: boolean;
}

interface OrchestratorResult {
  sessionId: string;
  intent: string;
  agentsToInvoke: string[];
  contextSummary: string;
}

export const useNdovuOrchestrator = () => {
  return useMutation({
    mutationFn: async (input: OrchestratorInput): Promise<OrchestratorResult> => {
      const { data, error } = await supabase.functions.invoke("ndovu-orchestrator", {
        body: input,
      });
      if (error) throw error;
      return data;
    },
  });
};
