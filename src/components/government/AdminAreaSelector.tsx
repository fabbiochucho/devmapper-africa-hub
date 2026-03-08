import { useState, useEffect } from "react";
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
  value?: string;
  onChange: (areaId: string, breadcrumb: string) => void;
}

const LEVELS = ["country", "state", "district", "ward"] as const;

const AdminAreaSelector = ({ countryCode, value, onChange }: AdminAreaSelectorProps) => {
  const [areas, setAreas] = useState<Record<string, AdminArea[]>>({});
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (countryCode) {
      loadAreas("country", null);
    }
  }, [countryCode]);

  const loadAreas = async (level: string, parentId: string | null) => {
    setLoading(true);
    try {
      let query = supabase
        .from("admin_areas")
        .select("*")
        .eq("level", level)
        .eq("country_code", countryCode);

      if (parentId) {
        query = query.eq("parent_id", parentId);
      } else {
        query = query.is("parent_id", null);
      }

      const { data, error } = await query.order("name");
      if (error) throw error;

      setAreas((prev) => ({ ...prev, [level]: data || [] }));
    } catch (error) {
      console.error("Error loading admin areas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (level: string, areaId: string) => {
    const levelIndex = LEVELS.indexOf(level as any);
    const newSelections = { ...selections, [level]: areaId };

    // Clear child selections
    for (let i = levelIndex + 1; i < LEVELS.length; i++) {
      delete newSelections[LEVELS[i]];
      setAreas((prev) => {
        const copy = { ...prev };
        delete copy[LEVELS[i]];
        return copy;
      });
    }

    setSelections(newSelections);

    // Load children
    const nextLevel = LEVELS[levelIndex + 1];
    if (nextLevel) {
      loadAreas(nextLevel, areaId);
    }

    // Build breadcrumb
    const breadcrumbParts: string[] = [];
    for (let i = 0; i <= levelIndex; i++) {
      const sel = i === levelIndex ? areaId : newSelections[LEVELS[i]];
      if (sel) {
        const area = areas[LEVELS[i]]?.find((a) => a.id === sel);
        if (area) breadcrumbParts.push(area.name);
      }
    }

    onChange(areaId, breadcrumbParts.join(" → "));
  };

  const getBreadcrumb = () => {
    const parts: string[] = [];
    for (const level of LEVELS) {
      if (selections[level]) {
        const area = areas[level]?.find((a) => a.id === selections[level]);
        if (area) parts.push(area.name);
      }
    }
    return parts;
  };

  const breadcrumb = getBreadcrumb();

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
              <Select
                value={selections[level] || ""}
                onValueChange={(v) => handleSelect(level, v)}
              >
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

      {(areas["country"]?.length === 0 && !loading) && (
        <p className="text-xs text-muted-foreground">
          No administrative areas configured for this country yet. Contact an admin.
        </p>
      )}
    </div>
  );
};

export default AdminAreaSelector;
