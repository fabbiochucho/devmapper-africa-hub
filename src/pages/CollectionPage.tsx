import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, Loader2, Sparkles, Trash2, CheckCircle2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SEOHead } from "@/components/seo/SEOHead";
import { ItemRow } from "@/components/workspace/ItemRow";
import { errorMessageOf } from "@/lib/error-handler";
import { downloadFile } from "@/lib/reportExport";
import { sourceName } from "@/lib/entities";
import {
  investigationToHtml, useAddStep, useCollection, useDeleteCollection, useRemoveItem, useRemoveStep, useUpdateCollection,
  type InvestigationStep, type StepType,
} from "@/lib/workspace";

const STEP_META: Record<string, { label: string; tone: string }> = {
  question: { label: "Question", tone: "bg-primary/10 text-primary" },
  answer: { label: "Ndovu Akili answer", tone: "bg-violet-500/10 text-violet-700 dark:text-violet-300" },
  evidence: { label: "Evidence", tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  note: { label: "Note", tone: "bg-muted text-muted-foreground" },
  decision: { label: "Decision", tone: "bg-amber-500/10 text-amber-800 dark:text-amber-300" },
  action: { label: "Action", tone: "bg-sky-500/10 text-sky-700 dark:text-sky-300" },
};

interface StepCitation { id?: string; title?: string; source?: string; path?: string | null; url?: string | null }

function Step({ step, onRemove }: { step: InvestigationStep; onRemove: () => void }) {
  const meta = STEP_META[step.step_type] ?? STEP_META.note;
  const cites = Array.isArray(step.citations) ? (step.citations as StepCitation[]) : [];
  return (
    <li className="relative border-l-2 pl-4 pb-5 last:pb-0">
      <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-border" aria-hidden />
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-xs rounded px-1.5 py-0.5 ${meta.tone}`}>{meta.label}</span>
        <span className="text-xs text-muted-foreground">{new Date(step.created_at).toLocaleString()}</span>
        <button type="button" onClick={onRemove} aria-label="Remove step" className="ml-auto text-muted-foreground hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="text-sm whitespace-pre-line">{step.content}</p>
      {cites.length > 0 && (
        <details className="mt-1.5">
          <summary className="text-xs text-muted-foreground cursor-pointer">{cites.length} sources</summary>
          <ol className="mt-1 space-y-1 text-xs">
            {cites.map((c, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-muted-foreground w-6 shrink-0">[{c.id ?? i + 1}]</span>
                <span className="min-w-0">
                  {c.path ? <Link to={c.path} className="hover:underline">{c.title}</Link> : c.title}
                  {c.source && <span className="text-muted-foreground"> · {sourceName(c.source)}</span>}
                  {c.url && <a href={c.url} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center text-primary">original <ExternalLink className="h-3 w-3 ml-0.5" /></a>}
                </span>
              </li>
            ))}
          </ol>
        </details>
      )}
    </li>
  );
}

export default function CollectionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useCollection(id);
  const addStep = useAddStep();
  const removeStep = useRemoveStep();
  const removeItem = useRemoveItem();
  const update = useUpdateCollection();
  const del = useDeleteCollection();
  const [stepType, setStepType] = useState<StepType>("note");
  const [text, setText] = useState("");
  const [conclusion, setConclusion] = useState<string | null>(null);

  if (isLoading) return <div className="container mx-auto px-4 py-8 text-muted-foreground">Loading…</div>;
  if (!data?.collection) return <div className="container mx-auto px-4 py-8 text-muted-foreground">Not found.</div>;
  const { collection: c, items, steps } = data;
  const isInvestigation = c.kind === "investigation";

  const add = async () => {
    if (!text.trim()) return;
    try {
      await addStep.mutateAsync({ collectionId: c.id, stepType, content: text.trim() });
      setText("");
    } catch (e) {
      toast.error("Couldn't add that", { description: errorMessageOf(e) });
    }
  };

  const conclude = async () => {
    try {
      await update.mutateAsync({ id: c.id, patch: { conclusion: (conclusion ?? c.conclusion ?? "").trim() || null, status: "concluded" } });
      toast.success("Investigation concluded");
    } catch (e) {
      toast.error("Couldn't save the conclusion", { description: errorMessageOf(e) });
    }
  };

  const remove = async () => {
    try {
      await del.mutateAsync(c.id);
      navigate("/workspace");
    } catch (e) {
      toast.error("Couldn't delete it", { description: errorMessageOf(e) });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <SEOHead title={c.name} description={c.question ?? c.description ?? "DevMapper workspace"} />
      <Link to={`/workspace?tab=${isInvestigation ? "investigations" : "collections"}`} className="text-sm text-muted-foreground inline-flex items-center hover:underline">
        <ArrowLeft className="h-4 w-4 mr-1" />Workspace
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary">{isInvestigation ? "Investigation" : "Collection"}</Badge>
            {isInvestigation && <Badge variant={c.status === "concluded" ? "default" : "outline"} className="capitalize">{c.status}</Badge>}
          </div>
          <h1 className="text-2xl font-bold break-words">{c.name}</h1>
          {c.question && c.question !== c.name && <p className="text-muted-foreground">{c.question}</p>}
        </div>
        <div className="flex gap-2">
          {isInvestigation && (
            <>
              <Button asChild size="sm">
                <Link to={`/ndovu?investigation=${c.id}&q=${encodeURIComponent(c.question ?? c.name)}`}><Sparkles className="h-4 w-4 mr-1.5" />Ask Ndovu Akili</Link>
              </Button>
              <Button size="sm" variant="outline" onClick={() => downloadFile(investigationToHtml(c, steps, items, window.location.origin), `${c.name.slice(0, 60).replace(/[^\w-]+/g, "-")}.html`, "text/html")}>
                <Download className="h-4 w-4 mr-1.5" />Export
              </Button>
            </>
          )}
          <Button size="sm" variant="ghost" onClick={remove} aria-label="Delete"><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>

      {isInvestigation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trail</CardTitle>
            <CardDescription>Search → verify → connect → analyse → decide → act. Ndovu answers saved here keep their sources.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {steps.length === 0 ? <p className="text-sm text-muted-foreground">No steps yet. Ask Ndovu Akili, or add a note or piece of evidence.</p> : (
              <ol>{steps.map((s) => <Step key={s.id} step={s} onRemove={() => removeStep.mutate(s.id)} />)}</ol>
            )}
            <div className="space-y-2 border-t pt-4">
              <div className="flex gap-2">
                <Select value={stepType} onValueChange={(v) => setStepType(v as StepType)}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(["note", "evidence", "question", "decision", "action"] as const).map((t) => <SelectItem key={t} value={t}>{STEP_META[t].label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Textarea id="step-text" value={text} onChange={(e) => setText(e.target.value)} placeholder="What did you find, verify or decide?" />
              <Button size="sm" onClick={add} disabled={addStep.isPending || !text.trim()}>
                {addStep.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}Add to trail
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">{isInvestigation ? "Collected items" : "Items"}</CardTitle>
              <CardDescription>Add items with <b>Save</b> on search results, projects and explore pages.</CardDescription>
            </div>
            {items.length >= 2 && (
              <Button asChild size="sm" variant="outline">
                <Link to={`/compare?items=${items.slice(0, 4).map((i) => `${i.entity_type}:${i.entity_id}`).join(",")}`}>
                  Compare {Math.min(items.length, 4)}
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? <p className="text-sm text-muted-foreground">Nothing here yet.</p> : (
            <ul className="divide-y">{items.map((i) => <ItemRow key={i.id} item={i} onRemove={() => removeItem.mutate(i.id)} />)}</ul>
          )}
        </CardContent>
      </Card>

      {isInvestigation && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Conclusion</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Textarea id="conclusion" value={conclusion ?? c.conclusion ?? ""} onChange={(e) => setConclusion(e.target.value)} placeholder="What does the evidence suggest, and what will you do about it?" />
            <Button size="sm" onClick={conclude} disabled={update.isPending}>{c.status === "concluded" ? "Update conclusion" : "Conclude investigation"}</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
