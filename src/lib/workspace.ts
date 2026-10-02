import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables } from "@/integrations/supabase/types";

export type Collection = Tables<"collections">;
export type SavedItem = Tables<"saved_items">;
export type InvestigationStep = Tables<"investigation_steps">;
export type Watch = Tables<"watches">;
export type StepType = "question" | "answer" | "evidence" | "note" | "decision" | "action";

const must = <T>({ data, error }: { data: T | null; error: { message: string } | null }): T => {
  if (error) throw new Error(error.message);
  return data as T;
};

export function useCollections(kind?: "collection" | "investigation") {
  return useQuery({
    queryKey: ["collections", kind ?? "all"],
    queryFn: async () => {
      let q = supabase.from("collections").select("*").order("updated_at", { ascending: false });
      if (kind) q = q.eq("kind", kind);
      return must(await q) ?? [];
    },
  });
}

export function useCollection(id: string | undefined) {
  return useQuery({
    queryKey: ["collection", id],
    enabled: !!id,
    queryFn: async () => {
      const [c, items, steps] = await Promise.all([
        supabase.from("collections").select("*").eq("id", id!).maybeSingle(),
        supabase.from("saved_items").select("*").eq("collection_id", id!).order("created_at"),
        supabase.from("investigation_steps").select("*").eq("collection_id", id!).order("created_at"),
      ]);
      return { collection: must(c), items: must(items) ?? [], steps: must(steps) ?? [] };
    },
  });
}

export function useSavedItems(collectionId: string | null = null) {
  return useQuery({
    queryKey: ["saved-items", collectionId],
    queryFn: async () => {
      let q = supabase.from("saved_items").select("*").order("created_at", { ascending: false });
      q = collectionId ? q.eq("collection_id", collectionId) : q.is("collection_id", null);
      return must(await q) ?? [];
    },
  });
}

export function useWatches() {
  return useQuery({
    queryKey: ["watches"],
    queryFn: async () => must(await supabase.from("watches").select("*").order("created_at", { ascending: false })) ?? [],
  });
}

/** Mutations invalidate every workspace query; the lists are small. */
function useWorkspaceMutation<A, R>(fn: (args: A) => Promise<R>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      for (const key of ["collections", "collection", "saved-items", "watches", "entity-saved-state"]) qc.invalidateQueries({ queryKey: [key] });
    },
  });
}

export const useSaveItem = () =>
  useWorkspaceMutation(async (a: { type: string; id: string; title: string; collectionId?: string | null; note?: string }) =>
    must(await supabase.from("saved_items").insert({
      entity_type: a.type, entity_id: a.id, title: a.title, collection_id: a.collectionId ?? null, note: a.note ?? null,
    }).select("*").single()));

export const useRemoveItem = () =>
  useWorkspaceMutation(async (id: string) => must(await supabase.from("saved_items").delete().eq("id", id)));

export const useCreateCollection = () =>
  useWorkspaceMutation(async (a: { name: string; kind: "collection" | "investigation"; question?: string; description?: string }) =>
    must(await supabase.from("collections").insert({
      name: a.name, kind: a.kind, question: a.question ?? null, description: a.description ?? null,
    }).select("*").single()));

export const useUpdateCollection = () =>
  useWorkspaceMutation(async (a: { id: string; patch: Partial<Pick<Collection, "name" | "description" | "question" | "status" | "conclusion">> }) =>
    must(await supabase.from("collections").update({ ...a.patch, updated_at: new Date().toISOString() }).eq("id", a.id)));

export const useDeleteCollection = () =>
  useWorkspaceMutation(async (id: string) => must(await supabase.from("collections").delete().eq("id", id)));

export const useAddStep = () =>
  useWorkspaceMutation(async (a: {
    collectionId: string; stepType: StepType; content: string;
    entity?: { type: string; id: string }; aiSessionId?: string; citations?: Json;
  }) =>
    must(await supabase.from("investigation_steps").insert({
      collection_id: a.collectionId, step_type: a.stepType, content: a.content,
      entity_type: a.entity?.type ?? null, entity_id: a.entity?.id ?? null,
      ai_session_id: a.aiSessionId ?? null, citations: a.citations ?? [],
    }).select("*").single()));

export const useRemoveStep = () =>
  useWorkspaceMutation(async (id: string) => must(await supabase.from("investigation_steps").delete().eq("id", id)));

export const useToggleWatch = () =>
  useWorkspaceMutation(async (a: { type: string; id: string; title: string; watching: boolean }) =>
    a.watching
      ? must(await supabase.from("watches").delete().eq("entity_type", a.type).eq("entity_id", a.id))
      : must(await supabase.from("watches").insert({ entity_type: a.type, entity_id: a.id, title: a.title })));

/** Whether an entity is in the personal library and/or watched. */
export function useEntitySavedState(type: string, id: string, enabled: boolean) {
  return useQuery({
    queryKey: ["entity-saved-state", type, id],
    enabled,
    queryFn: async () => {
      const [saved, watch] = await Promise.all([
        supabase.from("saved_items").select("id, collection_id").eq("entity_type", type).eq("entity_id", id),
        supabase.from("watches").select("id").eq("entity_type", type).eq("entity_id", id).maybeSingle(),
      ]);
      const rows = must(saved) ?? [];
      return {
        libraryItemId: rows.find((r) => r.collection_id === null)?.id ?? null,
        collectionIds: rows.map((r) => r.collection_id).filter((c): c is string => !!c),
        watching: !!must(watch),
      };
    },
  });
}

const escapeHtml = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const STEP_LABEL: Record<string, string> = {
  question: "Question", answer: "Ndovu Akili answer", evidence: "Evidence", note: "Note", decision: "Decision", action: "Action",
};

interface CitationLike { label?: string; title?: string; url?: string; path?: string; source?: string }

/** A self-contained HTML record of an investigation: question, trail with citations, conclusion. */
export function investigationToHtml(c: Collection, steps: InvestigationStep[], items: SavedItem[], origin: string): string {
  const cites = (j: Json) =>
    Array.isArray(j) && j.length
      ? `<ol class="c">${(j as CitationLike[]).map((x) => {
          const href = x.url || (x.path ? origin + x.path : "");
          const text = escapeHtml(x.title || x.label || href);
          return `<li>${href ? `<a href="${escapeHtml(href)}">${text}</a>` : text}${x.source ? ` <small>(${escapeHtml(x.source)})</small>` : ""}</li>`;
        }).join("")}</ol>`
      : "";
  const trail = steps.map((s) =>
    `<section><h3>${STEP_LABEL[s.step_type] ?? s.step_type} <small>${escapeHtml(new Date(s.created_at).toLocaleString())}</small></h3><p>${escapeHtml(s.content).replace(/\n/g, "<br>")}</p>${cites(s.citations)}</section>`,
  ).join("");
  const evidence = items.length
    ? `<h2>Collected items</h2><ul>${items.map((i) => `<li>${escapeHtml(i.title)} <small>(${escapeHtml(i.entity_type)})</small>${i.note ? ` · ${escapeHtml(i.note)}` : ""}</li>`).join("")}</ul>`
    : "";
  return `<!doctype html><meta charset="utf-8"><title>${escapeHtml(c.name)}</title><style>body{font-family:system-ui,sans-serif;max-width:820px;margin:2rem auto;padding:0 1rem;line-height:1.55;color:#1c1f1a}h3{margin-bottom:.2rem}small{color:#666;font-weight:400}section{border-left:3px solid #ddd;padding-left:12px;margin:14px 0}.c{font-size:.9em}</style>
<h1>${escapeHtml(c.name)}</h1>${c.question ? `<p><b>Question:</b> ${escapeHtml(c.question)}</p>` : ""}<p><small>Status: ${escapeHtml(c.status)} · exported ${escapeHtml(new Date().toLocaleString())} from DevMapper</small></p>
<h2>Trail</h2>${trail || "<p>No steps yet.</p>"}${evidence}${c.conclusion ? `<h2>Conclusion</h2><p>${escapeHtml(c.conclusion).replace(/\n/g, "<br>")}</p>` : ""}
<p><small>AI-generated answers are marked as such; check cited sources before relying on them.</small></p>`;
}

/** Turns a Ndovu answer into an investigation step: readable text plus the cited sources. */
export function answerToStep(s: {
  summary: string;
  keyInsights: { text: string; sources: string[]; basis: string }[];
  risks: { text: string; sources: string[]; basis: string }[];
  recommendedActions: { text: string; sources: string[]; basis: string }[];
  missingData: string[];
  evidence: { id: string; label: string; source: string; path?: string; url?: string; retrievedAt: string }[];
}): { content: string; citations: Json } {
  const line = (c: { text: string; sources: string[]; basis: string }) =>
    `- ${c.text}${c.sources.length ? ` [${c.sources.join(", ")}]` : ""}${c.basis === "inference" ? " (AI inference)" : ""}`;
  const block = (title: string, cs: { text: string; sources: string[]; basis: string }[]) => (cs.length ? `\n\n${title}:\n${cs.map(line).join("\n")}` : "");
  const content = `${s.summary}${block("Findings", s.keyInsights)}${block("Risks", s.risks)}${block("Next steps", s.recommendedActions)}${
    s.missingData.length ? `\n\nNot covered: ${s.missingData.join("; ")}` : ""}`;
  return {
    content: content.slice(0, 20000),
    citations: s.evidence.map((e) => ({ id: e.id, title: e.label, source: e.source, path: e.path ?? null, url: e.url ?? null, retrievedAt: e.retrievedAt })),
  };
}
