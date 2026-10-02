import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Network, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { errorMessageOf } from "@/lib/error-handler";
import { entityMeta, relationLabel, searchEntities, sourceName, type EntityHit } from "@/lib/entities";

// Relations users can assert, phrased from this entity towards the other.
const USER_RELATIONS = ["related_to", "funded_by", "implemented_by", "partner_of", "located_in", "addresses", "evidence_for", "affects", "part_of", "cites"];

function useEntityLinks(type: string, id: string) {
  return useQuery({
    queryKey: ["entity-links", type, id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_entity_links", { p_type: type, p_id: id });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function RelatedEntities({ type, id }: { type: string; id: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: links = [], isLoading, error } = useEntityLinks(type, id);
  const [adding, setAdding] = useState(false);

  const remove = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase.from("entity_links").delete().eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["entity-links"] }),
    onError: (e) => toast.error("Couldn't remove the connection", { description: errorMessageOf(e) }),
  });

  // Group by relation + direction so "funded by" and "funds" read naturally.
  const groups = new Map<string, typeof links>();
  for (const l of links) {
    const key = l.direction === "out" ? relationLabel(l.relation) : `${relationLabel(l.relation)} (from)`;
    groups.set(key, [...(groups.get(key) ?? []), l]);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-base flex items-center gap-2"><Network className="h-4 w-4" />Connections</CardTitle>
          <CardDescription>How this connects to projects, organisations, places, policies and evidence.</CardDescription>
        </div>
        {user && !adding && (
          <Button size="sm" variant="outline" onClick={() => setAdding(true)}><Plus className="h-4 w-4 mr-1" />Add</Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {adding && <AddLink fromType={type} fromId={id} onDone={() => setAdding(false)} />}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading connections…</p>
        ) : error ? (
          <p className="text-sm text-muted-foreground">Connections are unavailable right now.</p>
        ) : links.length === 0 ? (
          <p className="text-sm text-muted-foreground">No connections yet.{user ? " Add one if you know of a related project, organisation or source." : ""}</p>
        ) : (
          [...groups.entries()].map(([label, rows]) => (
            <div key={label}>
              <h4 className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">{label}</h4>
              <ul className="space-y-1.5">
                {rows.map((l) => {
                  const Icon = entityMeta(l.other_type).icon;
                  return (
                    <li key={l.link_id} className="flex items-center gap-2 text-sm">
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
                      <Link to={l.other_path} className="hover:underline truncate">{l.other_title}</Link>
                      <Badge variant="outline" className="text-[10px] shrink-0">{entityMeta(l.other_type).label}</Badge>
                      <span className="text-xs text-muted-foreground shrink-0" title={l.source_ref ?? undefined}>
                        {sourceName(l.source)}{l.confidence < 1 ? ` · ${Math.round(l.confidence * 100)}% match` : ""}
                      </span>
                      {l.source === "user" && user && (
                        <button type="button" className="ml-auto text-muted-foreground hover:text-destructive" aria-label="Remove connection"
                          onClick={() => remove.mutate(l.link_id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function AddLink({ fromType, fromId, onDone }: { fromType: string; fromId: string; onDone: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<EntityHit[] | null>(null);
  const [target, setTarget] = useState<EntityHit | null>(null);
  const [relation, setRelation] = useState("related_to");
  const [searching, setSearching] = useState(false);

  const search = async () => {
    if (q.trim().length < 2) return;
    setSearching(true);
    try {
      setHits((await searchEntities(q.trim(), { signedIn: !!user })).filter((h) => !(h.type === fromType && h.id === fromId)));
    } catch (e) {
      toast.error("Search failed", { description: errorMessageOf(e) });
    } finally {
      setSearching(false);
    }
  };

  const add = useMutation({
    mutationFn: async () => {
      if (!target || !user) return;
      const { error } = await supabase.from("entity_links").insert({
        from_type: fromType, from_id: fromId, to_type: target.type, to_id: target.id, relation, source: "user", created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["entity-links"] });
      toast.success("Connection added");
      onDone();
    },
    onError: (e) => toast.error("Couldn't add the connection", { description: errorMessageOf(e) }),
  });

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex gap-2">
        <Input id="add-link-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a project, organisation, policy…"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); search(); } }} />
        <Button type="button" size="sm" variant="secondary" onClick={search} disabled={searching}>
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find"}
        </Button>
      </div>
      {hits && !target && (
        <ul className="max-h-48 overflow-y-auto text-sm divide-y">
          {hits.length === 0 && <li className="py-1.5 text-muted-foreground">Nothing found.</li>}
          {hits.slice(0, 15).map((h) => (
            <li key={`${h.type}:${h.id}`}>
              <button type="button" className="w-full text-left py-1.5 hover:bg-muted/50" onClick={() => setTarget(h)}>
                {h.title} <span className="text-xs text-muted-foreground">· {entityMeta(h.type).label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {hits && !target && q.trim().length >= 2 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          Not listed? Create
          {(["issue", "community", "intervention", "sector", "risk"] as const).map((type) => (
            <button key={type} type="button" className="underline hover:text-foreground" onClick={async () => {
              const { data: id, error } = await supabase.rpc("create_user_entity", { p_type: type, p_title: q.trim() });
              if (error || !id) return toast.error("Couldn't create it", { description: error?.message });
              setTarget({ type, id, title: q.trim(), snippet: null, path: `/explore/${type}/${id}`, source: "user", sourceUrl: null, countryCode: null, score: 1, match: "keyword" });
            }}>
              {entityMeta(type).label.toLowerCase()}
            </button>
          ))}
          named "{q.trim()}"
        </div>
      )}
      {target && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>This</span>
          <Select value={relation} onValueChange={setRelation}>
            <SelectTrigger className="w-44 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>{USER_RELATIONS.map((r) => <SelectItem key={r} value={r}>{relationLabel(r)}</SelectItem>)}</SelectContent>
          </Select>
          <b className="truncate max-w-[16rem]">{target.title}</b>
          <Button size="sm" onClick={() => add.mutate()} disabled={add.isPending}>Add</Button>
          <Button size="sm" variant="ghost" onClick={() => setTarget(null)}>Change</Button>
        </div>
      )}
      <Button size="sm" variant="ghost" onClick={onDone}>Cancel</Button>
    </div>
  );
}
