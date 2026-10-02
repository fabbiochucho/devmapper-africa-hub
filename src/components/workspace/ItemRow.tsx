import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { entityMeta } from "@/lib/entities";
import type { SavedItem } from "@/lib/workspace";

const entityPath = (type: string, id: string) => (type === "project" ? `/project/${id}` : `/explore/${type}/${id}`);

export function ItemRow({ item, onRemove }: { item: Pick<SavedItem, "entity_type" | "entity_id" | "title" | "note">; onRemove?: () => void }) {
  const meta = entityMeta(item.entity_type);
  const Icon = meta.icon;
  return (
    <li className="flex items-center gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <Link to={entityPath(item.entity_type, item.entity_id)} className="hover:underline">{item.title}</Link>
        <span className="text-xs text-muted-foreground ml-2">{meta.label}</span>
        {item.note && <p className="text-xs text-muted-foreground">{item.note}</p>}
      </div>
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remove ${item.title}`} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </li>
  );
}
