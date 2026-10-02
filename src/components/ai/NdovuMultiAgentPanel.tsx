import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Loader2, Send } from "lucide-react";
import { useNdovuMultiAgent, SynthesisOutput } from "@/hooks/useNdovuMultiAgent";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/contexts/UserRoleContext";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import NdovuAuditTrail from "./NdovuAuditTrail";
import { NdovuAnswer } from "./NdovuAnswer";
import ndoviLogo from "@/assets/ndovi-aklil-logo.png";
import { errorMessageOf } from '@/lib/error-handler';

interface NdovuMultiAgentPanelProps {
  mockSynthesis?: SynthesisOutput;
}

const MULTI_AGENT_PAGES = [
  '/esg', '/analytics', '/advanced-analytics', '/carbon-marketplace',
  '/corporate-dashboard', '/government-dashboard', '/ngo-dashboard'
];

export default function NdovuMultiAgentPanel({ mockSynthesis }: NdovuMultiAgentPanelProps) {
  const { user } = useAuth();
  const { currentRole } = useUserRole();
  const location = useLocation();
  const { runAnalysis } = useNdovuMultiAgent();
  const [input, setInput] = useState("");
  const [expertMode, setExpertMode] = useState(false);
  const [synthesis, setSynthesis] = useState<SynthesisOutput | null>(mockSynthesis || null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeAgents, setActiveAgents] = useState<{ name: string; status: "pending" | "running" | "complete" }[]>([]);

  const isRelevantPage = MULTI_AGENT_PAGES.some(p => location.pathname.startsWith(p)) ||
    location.pathname.match(/^\/project\/.+/);

  const buildContextData = () => {
    const path = location.pathname;
    const context: Record<string, unknown> = {
      currentPage: path,
      userId: user?.id,
      userRole: currentRole,
    };
    if (path.startsWith('/project/')) {
      context.projectId = path.split('/project/')[1];
      context.contextType = 'project';
    }
    if (path === '/esg') context.contextType = 'esg';
    if (path === '/carbon-marketplace') context.contextType = 'carbon_marketplace';
    if (path.includes('dashboard')) {
      context.contextType = 'dashboard';
      context.dashboardRole = currentRole;
    }
    return context;
  };

  const handleSend = async () => {
    if (!input.trim() || runAnalysis.isPending) return;
    setActiveAgents([{ name: "Orchestrator", status: "running" }]);
    setSynthesis(null);

    try {
      const result = await runAnalysis.mutateAsync({
        userMessage: input.trim(),
        userRole: currentRole,
        contextData: buildContextData(),
        expertMode,
      });
      setSessionId(result.sessionId);
      setSynthesis(result.synthesis);
      setActiveAgents(
        result.synthesis.agentContributions?.map(a => ({
          name: a.agentName, status: "complete" as const
        })) || []
      );
      setInput("");
    } catch (e: unknown) {
      toast.error(errorMessageOf(e) || "Multi-agent analysis failed");
      setActiveAgents([]);
    }
  };

  const handleApprove = async () => {
    if (!sessionId) return;
    const { error } = await supabase
      .from('ai_agent_sessions')
      .update({ approved_by_user: true })
      .eq('id', sessionId);
    if (error) toast.error("Failed to save approval");
    else toast.success("Analysis approved and saved");
  };

  if (!isRelevantPage && !mockSynthesis) return null;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <img src={ndoviLogo} alt="Ndovu Akili AI" className="h-5 w-5 object-contain" />
            Multi-Agent Analysis
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={expertMode ? "default" : "outline"}
              className="h-7 text-xs"
              onClick={() => setExpertMode(!expertMode)}
            >
              {expertMode ? "Expert" : "Beginner"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Agent status indicators */}
        {activeAgents.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeAgents.map(agent => (
              <Badge
                key={agent.name}
                variant="outline"
                className="gap-1 text-xs"
              >
                {agent.status === "running" && <Loader2 className="h-3 w-3 animate-spin" />}
                {agent.status === "complete" && <CheckCircle className="h-3 w-3 text-green-600" />}
                {agent.status === "pending" && <Clock className="h-3 w-3 text-muted-foreground" />}
                {agent.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Synthesis output */}
        {synthesis && (
          <div className="space-y-3">
            <NdovuAnswer s={synthesis} />

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Sourced statements:</span>
                <Progress value={synthesis.overallConfidence} className="w-24 h-2" />
                <span className="text-xs font-medium">{synthesis.overallConfidence}%</span>
              </div>
              <Button size="sm" onClick={handleApprove} className="h-7 text-xs">
                Approve & Save
              </Button>
            </div>


            {/* Audit Trail */}
            {sessionId && (
              <NdovuAuditTrail
                sessionId={sessionId}
                entries={synthesis.agentContributions?.map(a => ({
                  agentName: a.agentName,
                  confidenceScore: a.confidence ?? synthesis.overallConfidence,
                  dataSources: [...new Set(synthesis.evidence.map((e) => e.source))],
                  createdAt: new Date().toISOString(),
                })) || []}
              />
            )}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask for multi-agent analysis..."
            className="min-h-[40px] max-h-[80px] resize-none text-sm"
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <Button onClick={handleSend} disabled={runAnalysis.isPending || !input.trim()} size="icon" className="shrink-0">
            {runAnalysis.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
