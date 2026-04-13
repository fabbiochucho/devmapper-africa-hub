import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertTriangle, CheckCircle, Clock, Loader2, Send, Sparkles } from "lucide-react";
import { useNdovuMultiAgent, SynthesisOutput } from "@/hooks/useNdovuMultiAgent";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/contexts/UserRoleContext";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import NdovuAuditTrail from "./NdovuAuditTrail";
import ndoviLogo from "@/assets/ndovi-aklil-logo.png";

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
    } catch (e: any) {
      toast.error(e.message || "Multi-agent analysis failed");
      setActiveAgents([]);
    }
  };

  const handleApprove = async () => {
    if (!sessionId) return;
    const { error } = await supabase
      .from('ai_agent_sessions' as any)
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
            {synthesis.requiresHumanApproval && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-yellow-50 text-yellow-800 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                Low confidence — manual review recommended
              </div>
            )}

            <div className="text-sm">{synthesis.summary}</div>

            <Accordion type="multiple" className="w-full">
              <AccordionItem value="insights">
                <AccordionTrigger className="text-sm py-2">Key Insights ({synthesis.keyInsights?.length || 0})</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1 text-sm">
                    {synthesis.keyInsights?.map((insight, i) => (
                      <li key={i} className="flex gap-2"><Sparkles className="h-3 w-3 mt-1 shrink-0 text-primary" />{insight}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="risks">
                <AccordionTrigger className="text-sm py-2">Risks ({synthesis.risks?.length || 0})</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1 text-sm">
                    {synthesis.risks?.map((risk, i) => (
                      <li key={i} className="flex gap-2"><AlertTriangle className="h-3 w-3 mt-1 shrink-0 text-destructive" />{risk}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="actions">
                <AccordionTrigger className="text-sm py-2">Recommended Actions ({synthesis.recommendedActions?.length || 0})</AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1 text-sm">
                    {synthesis.recommendedActions?.map((action, i) => (
                      <li key={i} className="flex gap-2"><CheckCircle className="h-3 w-3 mt-1 shrink-0 text-green-600" />{action}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">Confidence:</span>
                <Progress value={synthesis.overallConfidence} className="w-24 h-2" />
                <span className="text-xs font-medium">{synthesis.overallConfidence}%</span>
              </div>
              <Button size="sm" onClick={handleApprove} className="h-7 text-xs">
                Approve & Save
              </Button>
            </div>

            <p className="text-xs text-muted-foreground italic">
              {synthesis.disclaimer || "AI-generated guidance. Not legal or financial advice."}
            </p>

            {/* Audit Trail */}
            {sessionId && (
              <NdovuAuditTrail
                sessionId={sessionId}
                entries={synthesis.agentContributions?.map(a => ({
                  agentName: a.agentName,
                  confidenceScore: synthesis.overallConfidence,
                  dataSources: [],
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
