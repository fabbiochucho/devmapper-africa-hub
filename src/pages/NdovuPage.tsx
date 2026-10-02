import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Send, Sparkles, X, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SEOHead } from "@/components/seo/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/contexts/UserRoleContext";
import { errorMessageOf } from "@/lib/error-handler";
import { runNdovu, type NdovuResult } from "@/hooks/useNdovuMultiAgent";
import { NdovuAnswer } from "@/components/ai/NdovuAnswer";
import { DocumentAttach, type AttachedDocument } from "@/components/ai/DocumentAttach";
import { answerToStep, useAddStep, useCollections, useCreateCollection } from "@/lib/workspace";

const EXAMPLES = [
  "Which organisations are working on climate adaptation in Northern Nigeria?",
  "What funding could support a clean cooking programme in Kenya?",
  "What policies affect solar mini-grid projects in Ghana?",
  "What evidence exists that school feeding improves attendance in Ethiopia?",
  "Where are the gaps in water and sanitation programmes in Malawi?",
];

const INTENT_LABEL: Record<string, string> = {
  discovery: "development intelligence", verification: "verification", investment: "investment", compliance: "policy & compliance",
  project_design: "project design", scope3: "supply chain", carbon_trade: "carbon markets",
};

export default function NdovuPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentRole } = useUserRole();
  const about = params.get("about");
  const aboutTitle = params.get("title");
  const investigationId = params.get("investigation");
  const [question, setQuestion] = useState(params.get("q") ?? "");
  const [expert, setExpert] = useState(false);
  const [doc, setDoc] = useState<AttachedDocument | null>(null);
  const [stage, setStage] = useState<{ name: string; agents?: string[] } | null>(null);
  const [result, setResult] = useState<NdovuResult | null>(null);
  const { data: investigations = [] } = useCollections("investigation");
  const addStep = useAddStep();
  const createCollection = useCreateCollection();

  const ask = useMutation({
    mutationFn: (q: string) =>
      runNdovu(
        { userMessage: q, userRole: currentRole, expertMode: expert, contextData: { about: about ?? undefined, currentPage: "/ndovu", document: doc ?? undefined } },
        (name, agents) => setStage({ name, agents }),
      ),
    onSuccess: async (r) => {
      setResult(r);
      setStage(null);
      if (investigationId) await saveTo(investigationId, r, true);
    },
    onError: (e) => {
      setStage(null);
      toast.error("Ndovu Akili couldn't answer", { description: errorMessageOf(e) });
    },
  });

  const saveTo = async (collectionId: string, r: NdovuResult, silent = false) => {
    try {
      await addStep.mutateAsync({ collectionId, stepType: "question", content: r.synthesis.question ?? question, aiSessionId: r.sessionId });
      const step = answerToStep(r.synthesis);
      await addStep.mutateAsync({ collectionId, stepType: "answer", content: step.content, citations: step.citations, aiSessionId: r.sessionId });
      if (!silent) toast.success("Saved to investigation", { action: { label: "Open", onClick: () => navigate(`/workspace/${collectionId}`) } });
    } catch (e) {
      toast.error("Couldn't save to the investigation", { description: errorMessageOf(e) });
    }
  };

  const startInvestigation = async (r: NdovuResult) => {
    const q = r.synthesis.question ?? question;
    const c = await createCollection.mutateAsync({ name: q.slice(0, 120), kind: "investigation", question: q });
    await saveTo(c.id, r, true);
    navigate(`/workspace/${c.id}`);
  };

  const submit = () => {
    const q = question.trim();
    if (q.length < 3 || ask.isPending) return;
    setResult(null);
    ask.mutate(q);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl text-center space-y-3">
        <h1 className="text-2xl font-bold">Ndovu Akili</h1>
        <p className="text-muted-foreground">Sign in to ask development questions and get answers that cite their sources.</p>
        <Button asChild><Link to="/auth">Sign in</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <SEOHead title="Ndovu Akili" description="Ask development questions and get answers that cite their sources." />
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="h-6 w-6 text-primary" />Ndovu Akili</h1>
        <p className="text-muted-foreground">Ask a development question. Answers draw on DevMapper's records and live sources (IATI, World Bank, OpenAlex, EU funding calls), and every statement shows where it came from.</p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-3">
          {(about || investigationId) && (
            <div className="flex flex-wrap gap-2">
              {about && (
                <Badge variant="secondary" className="gap-1">
                  About: {aboutTitle ?? about}
                  <button type="button" aria-label="Remove context" onClick={() => { params.delete("about"); params.delete("title"); setParams(params); }}><X className="h-3 w-3" /></button>
                </Badge>
              )}
              {investigationId && (
                <Badge variant="secondary" className="gap-1">
                  Saving to investigation
                  <button type="button" aria-label="Stop saving to investigation" onClick={() => { params.delete("investigation"); setParams(params); }}><X className="h-3 w-3" /></button>
                </Badge>
              )}
            </div>
          )}
          <Textarea
            id="ndovu-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Which organisations are working on food security in Kano, and what funding have they received?"
            className="min-h-[90px]"
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submit(); } }}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <DocumentAttach value={doc} onChange={setDoc} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={expert} onChange={(e) => setExpert(e.target.checked)} />
                Technical language
              </label>
            </div>
            <Button onClick={submit} disabled={ask.isPending || question.trim().length < 3}>
              {ask.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}Ask
            </Button>
          </div>
          {!result && !ask.isPending && (
            <div className="flex flex-wrap gap-2 pt-1">
              {EXAMPLES.map((ex) => (
                <button key={ex} type="button" onClick={() => setQuestion(ex)} className="text-xs rounded-full border px-3 py-1 text-muted-foreground hover:bg-muted text-left">
                  {ex}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {ask.isPending && stage && (
        <p className="text-sm text-muted-foreground flex items-center gap-2" aria-live="polite">
          <Loader2 className="h-4 w-4 animate-spin" />
          {stage.name === "routing" && "Working out what you're asking…"}
          {stage.name === "agents" && `Gathering evidence (${stage.agents?.map((a) => a.replace(/_/g, " ")).join(", ")})… this can take up to a minute when live sources are searched.`}
          {stage.name === "synthesis" && "Combining the answers…"}
        </p>
      )}

      {result && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle className="text-base">{result.synthesis.question ?? question}</CardTitle>
              <CardDescription>
                Treated as a {INTENT_LABEL[result.plan.intent] ?? result.plan.intent} question
                {result.plan.countries.length ? ` about ${result.plan.countries.join(", ")}` : ""}
                {result.plan.searchTerms.length ? ` · searched "${result.plan.searchTerms.join('", "')}"` : ""}
              </CardDescription>
            </div>
            {!investigationId && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm"><FolderPlus className="h-4 w-4 mr-1.5" />Save</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuItem onClick={() => startInvestigation(result)}>Start a new investigation</DropdownMenuItem>
                  {investigations.length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Add to investigation</DropdownMenuLabel>
                      {investigations.slice(0, 10).map((c) => (
                        <DropdownMenuItem key={c.id} onClick={() => saveTo(c.id, result)}><span className="truncate">{c.name}</span></DropdownMenuItem>
                      ))}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </CardHeader>
          <CardContent>
            <NdovuAnswer s={result.synthesis} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
