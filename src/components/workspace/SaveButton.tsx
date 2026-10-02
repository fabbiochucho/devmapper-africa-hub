import { Bookmark, BookmarkCheck, Eye, EyeOff, FolderPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { errorMessageOf } from "@/lib/error-handler";
import { useCollections, useEntitySavedState, useRemoveItem, useSaveItem, useToggleWatch } from "@/lib/workspace";

/** Save an entity to the library or a collection/investigation, and follow it for updates. */
export function SaveButton({ type, id, title, size = "sm" }: { type: string; id: string; title: string; size?: "sm" | "default" }) {
  const { user } = useAuth();
  const { data: state, isLoading } = useEntitySavedState(type, id, !!user);
  const { data: collections = [] } = useCollections();
  const save = useSaveItem();
  const remove = useRemoveItem();
  const watch = useToggleWatch();
  if (!user) return null;

  const run = (p: Promise<unknown>, ok: string) =>
    p.then(() => toast.success(ok)).catch((e) => toast.error("Couldn't update your workspace", { description: errorMessageOf(e) }));
  const busy = isLoading || save.isPending || remove.isPending || watch.isPending;
  const saved = !!state?.libraryItemId || (state?.collectionIds.length ?? 0) > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={size} aria-label={saved ? "Saved - change" : "Save"}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          <span className="ml-1.5 hidden sm:inline">{saved ? "Saved" : "Save"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {state?.libraryItemId ? (
          <DropdownMenuItem onClick={() => run(remove.mutateAsync(state.libraryItemId!), "Removed from your library")}>
            <BookmarkCheck className="h-4 w-4 mr-2" />Remove from library
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => run(save.mutateAsync({ type, id, title }), "Saved to your library")}>
            <Bookmark className="h-4 w-4 mr-2" />Save to library
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => run(watch.mutateAsync({ type, id, title, watching: !!state?.watching }), state?.watching ? "Stopped following" : "Following - you'll be notified of new connections")}>
          {state?.watching ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
          {state?.watching ? "Stop following" : "Follow for updates"}
        </DropdownMenuItem>
        {collections.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Add to collection or investigation</DropdownMenuLabel>
            {collections.slice(0, 12).map((c) => {
              const inIt = state?.collectionIds.includes(c.id);
              return (
                <DropdownMenuItem key={c.id} disabled={inIt} onClick={() => run(save.mutateAsync({ type, id, title, collectionId: c.id }), `Added to ${c.name}`)}>
                  <FolderPlus className="h-4 w-4 mr-2 shrink-0" />
                  <span className="truncate">{c.name}</span>
                  {inIt && <span className="ml-auto text-xs text-muted-foreground">added</span>}
                </DropdownMenuItem>
              );
            })}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
