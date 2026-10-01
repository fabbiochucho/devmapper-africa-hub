import { useState, useEffect, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

interface AdminArea {
  id: string;
  name: string;
  level: string;
  parent_id: string | null;
  country_code: string;
}

interface AdminAreaSelectorProps {
  countryCode: string;
  /** Id of the deepest selected area. Pre-fills every level above it. */
  value?: string;
  onChange: (areaId: string, breadcrumb: string) => void;
}

const LEVELS = ["country", "state", "district", "ward"] as const;
type Level = (typeof LEVELS)[number];

async function fetchLevel(countryCode: string, level: Level, parentId: string | null): Promise<AdminArea[]> {
  let query = supabase.from("admin_areas").select("*").eq("level", level).eq("country_code", countryCode);
  query = parentId ? query.eq("parent_id", parentId) : query.is("parent_id", null);
  const { data, error } = await query.order("name");
  if (error) throw error;
  return data || [];
}

// Walks parent_id links from the given area up to the top level, returning root-first.
async function fetchAncestry(areaId: string): Promise<AdminArea[]> {
  const chain: AdminArea[] = [];
  for (let id: string | null = areaId; id && chain.length < LEVELS.length; ) {
    const { data, error } = await supabase.from("admin_areas").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!data) break;
    chain.unshift(data);
    id = data.parent_id;
  }
  return chain;
}

const AdminAreaSelector = ({ countryCode, value, onChange }: AdminAreaSelectorProps) => {
  const [areas, setAreas] = useState<Record<string, AdminArea[]>>({});
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  // The id we last reported via onChange; when the parent echoes it back as `value`
  // there's nothing to re-load.
  const lastEmitted = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!countryCode) return;
    if (value && value === lastEmitted.current) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const nextAreas: Record<string, AdminArea[]> = {};
        const nextSelections: Record<string, string> = {};
        const chain = value ? await fetchAncestry(value) : [];
        // Options for each pre-selected level (siblings under the same parent)...
        for (const area of chain) {
          nextAreas[area.level] = await fetchLevel(countryCode, area.level as Level, area.parent_id);
          nextSelections[area.level] = area.id;
        }
        // ...plus the next level down, ready for the user's next pick.
        const deepest = chain[chain.length - 1];
        const nextLevel = deepest ? LEVELS[LEVELS.indexOf(deepest.level as Level) + 1] : "country";
        if (nextLevel) {
          const children = await fetchLevel(countryCode, nextLevel, deepest?.id ?? null);
          if (children.length || nextLevel === "country") nextAreas[nextLevel] = children;
        }
        if (cancelled) return;
        setAreas(nextAreas);
        setSelections(nextSelections);
      } catch (error) {
        console.error("Error loading admin areas:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [countryCode, value]);

  const handleSelect = async (level: Level, areaId: string) => {
    const levelIndex = LEVELS.indexOf(level);
    const newSelections: Record<string, string> = {};
    for (let i = 0; i < levelIndex; i++) if (selections[LEVELS[i]]) newSelections[LEVELS[i]] = selections[LEVELS[i]];
    newSelections[level] = areaId;
    setSelections(newSelections);

    const keptAreas: Record<string, AdminArea[]> = {};
    for (let i = 0; i <= levelIndex; i++) if (areas[LEVELS[i]]) keptAreas[LEVELS[i]] = areas[LEVELS[i]];

    const breadcrumb = LEVELS.slice(0, levelIndex + 1)
      .map((l) => keptAreas[l]?.find((a) => a.id === newSelections[l])?.name)
      .filter(Boolean)
      .join(" → ");
    lastEmitted.current = areaId;
    onChange(areaId, breadcrumb);

    const nextLevel = LEVELS[levelIndex + 1];
    if (nextLevel) {
      setLoading(true);
      try {
        const children = await fetchLevel(countryCode, nextLevel, areaId);
        if (children.length) keptAreas[nextLevel] = children;
      } catch (error) {
        console.error("Error loading admin areas:", error);
      } finally {
        setLoading(false);
      }
    }
    setAreas(keptAreas);
  };

  const breadcrumb = LEVELS.map((level) => areas[level]?.find((a) => a.id === selections[level])?.name).filter(
    (name): name is string => !!name,
  );

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        Administrative Area
      </Label>

      {breadcrumb.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {breadcrumb.map((part, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {part}
              {i < breadcrumb.length - 1 && " →"}
            </Badge>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {LEVELS.map((level) => {
          const levelAreas = areas[level] || [];
          if (levelAreas.length === 0 && level !== "country") return null;

          return (
            <div key={level} className="space-y-1">
              <Label className="text-xs text-muted-foreground capitalize">{level}</Label>
              <Select value={selections[level] || ""} onValueChange={(v) => handleSelect(level, v)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder={`Select ${level}`} />
                </SelectTrigger>
                <SelectContent>
                  {levelAreas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>

      {areas["country"]?.length === 0 && !loading && (
        <p className="text-xs text-muted-foreground">
          No administrative areas configured for this country yet. Contact an admin.
        </p>
      )}
    </div>
  );
};

export default AdminAreaSelector;
