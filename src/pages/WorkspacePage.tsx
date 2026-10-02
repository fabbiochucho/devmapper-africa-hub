import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Bookmark, Eye, Folder, Plus, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/seo/SEOHead";
import { ItemRow } from "@/components/workspace/ItemRow";
import { useAuth } from "@/contexts/AuthContext";
import { errorMessageOf } from "@/lib/error-handler";
import {
  useCollections, useCreateCollection, useRemoveItem, useSavedItems, useToggleWatch, useWatches,
} from "@/lib/workspace";

// The vision's specialised workspaces, as entry points into shared search and Ndovu Akili.
const AREAS = [
  { name: "Research", type: "research", what: "Studies and evidence from OpenAlex and DevMapper reports.", ask: "What evidence exists that cash transfers reduce child malnutrition in Africa?" },
  { name: "Funding", type: "funding_opportunity", what: "Open calls, funders and funded programmes (EU, World Bank, IATI).", ask: "Which funders support clean cooking in East Africa?" },
  { name: "Policy", type: "policy", what: "Regulations, frameworks and the countries they apply in.", ask: "What climate disclosure rules apply to companies in Nigeria?" },
  { name: "Climate & sustainability", type: "dataset", what: "Datasets, indicators and climate programmes.", ask: "Which datasets track drought risk in the Sahel?" },
  { name: "Organisations", type: "organization", what: "Who works where, on what, and with whom.", ask: "Which organisations work on maternal health in Kano?" },
  { name: "Projects & programmes", type: "programme", what: "Projects on DevMapper and programmes from IATI and the World Bank.", ask: "What water and sanitation programmes are running in Malawi?" },
];

function NewCollection({ kind }: { kind: "collection" | "investigation" }) {
  const [name, setName] = useState("");
  const create = useCreateCollection();
  const navigate = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      const c = await create.mutateAsync(kind === "investigation" ? { name: name.trim().slice(0, 200), kind, question: name.trim() } : { name: name.trim(), kind });
      setName("");
      navigate(`/workspace/${c.id}`);
    } catch (err) {
      toast.error("Couldn't create it", { description: errorMessageOf(err) });
    }
  };
  return (
    <form onSubmit={submit} className="flex gap-2">
      <Input id={`new-${kind}`} value={name} onChange={(e) => setName(e.target.value)}
        placeholder={kind === "investigation" ? "What do you want to find out? e.g. Who funds maternal health in Kano?" : "Collection name, e.g. Lagos solar projects"} />
      <Button type="submit" disabled={create.isPending || !name.trim()}><Plus className="h-4 w-4 mr-1" />{kind === "investigation" ? "Start" : "Create"}</Button>
    </form>
  );
}

export default function WorkspacePage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "investigations";
  const { data: library = [], isLoading: libLoading } = useSavedItems(null);
  const { data: collections = [] } = useCollections("collection");
  const { data: investigations = [] } = useCollections("investigation");
  const { data: watches = [] } = useWatches();
  const remove = useRemoveItem();
  const unwatch = useToggleWatch();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl text-center space-y-3">
        <h1 className="text-2xl font-bold">Your workspace</h1>
        <p className="text-muted-foreground">Sign in to save what you find, build investigations and follow updates.</p>
        <Button asChild><Link to="/auth">Sign in</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <SEOHead title="Workspace" description="Your saved items, collections and investigations." />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Workspace</h1>
          <p className="text-muted-foreground">Save what you find, build evidence trails and follow what changes.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/search"><Search className="h-4 w-4 mr-1.5" />Search</Link></Button>
          <Button asChild><Link to="/ndovu"><Sparkles className="h-4 w-4 mr-1.5" />Ask Ndovu Akili</Link></Button>
        </div>
      </div>

      <section aria-labelledby="areas-heading">
        <h2 id="areas-heading" className="text-sm font-medium text-muted-foreground mb-2">Start from an area</h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {AREAS.map((a) => (
            <li key={a.name} className="rounded-lg border p-3 text-sm">
              <div className="font-medium">{a.name}</div>
              <p className="text-xs text-muted-foreground mb-2">{a.what}</p>
              <div className="flex flex-wrap gap-3 text-xs">
                <Link className="text-primary hover:underline" to={`/search?live=1${a.type ? `&type=${a.type}` : ""}`}>Search</Link>
                <Link className="text-primary hover:underline" to={`/ndovu?q=${encodeURIComponent(a.ask)}`}>Ask: "{a.ask}"</Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Tabs value={tab} onValueChange={(v) => setParams({ tab: v })}>
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="investigations">Investigations ({investigations.length})</TabsTrigger>
          <TabsTrigger value="collections">Collections ({collections.length})</TabsTrigger>
          <TabsTrigger value="library">Library ({library.length})</TabsTrigger>
          <TabsTrigger value="following">Following ({watches.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="investigations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Start an investigation</CardTitle>
              <CardDescription>Write down the question, then collect answers, evidence and notes until you can decide what the evidence says.</CardDescription>
            </CardHeader>
            <CardContent><NewCollection kind="investigation" /></CardContent>
          </Card>
          <CollectionList items={investigations} empty="No investigations yet." />
        </TabsContent>

        <TabsContent value="collections" className="space-y-4">
          <Card><CardContent className="pt-6"><NewCollection kind="collection" /></CardContent></Card>
          <CollectionList items={collections} empty="No collections yet. Use Save on any search result or page to add to one." />
        </TabsContent>

        <TabsContent value="library">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bookmark className="h-4 w-4" />Saved items</CardTitle></CardHeader>
            <CardContent>
              {libLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : library.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing saved yet. Use <b>Save</b> on search results, projects or any explore page.</p>
              ) : (
                <ul className="divide-y">{library.map((i) => <ItemRow key={i.id} item={i} onRemove={() => remove.mutate(i.id)} />)}</ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="following">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Eye className="h-4 w-4" />Following</CardTitle>
              <CardDescription>You get a notification when something new is connected to these (checked nightly).</CardDescription>
            </CardHeader>
            <CardContent>
              {watches.length === 0 ? <p className="text-sm text-muted-foreground">You're not following anything yet.</p> : (
                <ul className="divide-y">
                  {watches.map((w) => (
                    <ItemRow key={w.id} item={{ entity_type: w.entity_type, entity_id: w.entity_id, title: w.title, note: null }}
                      onRemove={() => unwatch.mutate({ type: w.entity_type, id: w.entity_id, title: w.title, watching: true })} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CollectionList({ items, empty }: { items: { id: string; name: string; status: string; kind: string; updated_at: string; question: string | null }[]; empty: string }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((c) => (
        <li key={c.id}>
          <Link to={`/workspace/${c.id}`} className="block rounded-lg border p-4 hover:bg-muted/50 h-full">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium truncate">{c.name}</span>
              {c.kind === "investigation" && <Badge variant={c.status === "concluded" ? "default" : "outline"} className="ml-auto capitalize">{c.status}</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Updated {new Date(c.updated_at).toLocaleDateString()}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
