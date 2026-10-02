import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, ExternalLink, HelpCircle, Lightbulb, ListChecks, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { sourceName } from "@/lib/entities";
import type { NdovuClaim, NdovuEvidence, SynthesisOutput } from "@/hooks/useNdovuMultiAgent";

function Cite({ ids, evidence }: { ids: string[]; evidence: NdovuEvidence[] }) {
  if (ids.length === 0) return null;
  return (
    <span className="ml-1 inline-flex gap-0.5 align-super text-[10px]">
      {ids.map((id) => {
        const e = evidence.find((x) => x.id === id);
        return (
          <a key={id} href={`#ndovu-src-${id}`} className="text-primary hover:underline" title={e?.label}>[{id}]</a>
        );
      })}
    </span>
  );
}

function ClaimList({ title, icon: Icon, claims, evidence }: { title: string; icon: typeof Lightbulb; claims: NdovuClaim[]; evidence: NdovuEvidence[] }) {
  if (claims.length === 0) return null;
  return (
    <section>
      <h4 className="text-sm font-medium flex items-center gap-1.5 mb-1.5"><Icon className="h-4 w-4" />{title}</h4>
      <ul className="space-y-1.5 text-sm">
        {claims.map((c, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/60 shrink-0" aria-hidden />
            <span>
              {c.text}
              <Cite ids={c.sources} evidence={evidence} />
              {c.basis === "inference" && (
                <Badge variant="outline" className="ml-1.5 text-[10px] py-0 font-normal text-muted-foreground" title="Not backed by a cited record">AI inference</Badge>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** A Ndovu Akili answer with per-statement citations, an evidence list and what's missing. */
export function NdovuAnswer({ s }: { s: SynthesisOutput }) {
  const factual = [...s.keyInsights, ...s.risks];
  const sourced = factual.filter((c) => c.basis === "sourced").length;
  return (
    <div className="space-y-4">
      {s.requiresHumanApproval && (
        <div className="flex items-start gap-2 p-2 rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-300 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          Review before relying on this: {factual.length ? `${sourced} of ${factual.length} statements are backed by cited records.` : "the answer makes no sourced statements."}
        </div>
      )}
      <p className="text-sm leading-relaxed">{s.summary}</p>

      <ClaimList title="Key findings" icon={Lightbulb} claims={s.keyInsights} evidence={s.evidence} />
      <ClaimList title="Risks" icon={ShieldAlert} claims={s.risks} evidence={s.evidence} />
      <ClaimList title="Recommended next steps" icon={ListChecks} claims={s.recommendedActions} evidence={s.evidence} />

      {s.missingData.length > 0 && (
        <section>
          <h4 className="text-sm font-medium flex items-center gap-1.5 mb-1.5"><HelpCircle className="h-4 w-4" />Not covered by the available data</h4>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-0.5">{s.missingData.map((m, i) => <li key={i}>{m}</li>)}</ul>
        </section>
      )}

      <section className="border-t pt-3">
        <h4 className="text-sm font-medium flex items-center gap-1.5 mb-1.5"><CheckCircle2 className="h-4 w-4" />Sources ({s.evidence.length})</h4>
        {s.evidence.length === 0 ? (
          <p className="text-xs text-muted-foreground">No records or live sources were found for this question.</p>
        ) : (
          <ol className="space-y-1.5 text-xs">
            {s.evidence.map((e) => (
              <li key={e.id} id={`ndovu-src-${e.id}`} className="flex gap-2 scroll-mt-20">
                <span className="text-muted-foreground tabular-nums w-6 shrink-0">[{e.id}]</span>
                <span className="min-w-0">
                  {e.path ? <Link to={e.path} className="hover:underline">{e.label}</Link> : e.label}
                  <span className="text-muted-foreground"> · {sourceName(e.source)}{e.kind === "live" ? " (live)" : ""} · retrieved {new Date(e.retrievedAt).toLocaleDateString()}</span>
                  {e.url && (
                    <a href={e.url} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center text-primary hover:underline">
                      original <ExternalLink className="h-3 w-3 ml-0.5" />
                    </a>
                  )}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
      <p className="text-xs text-muted-foreground italic">{s.disclaimer}</p>
    </div>
  );
}
