import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { sdgGoalColors } from "@/lib/constants";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface HeatmapProps {
  projects: Array<{
    sdg_goals: number[];
    budget: number | null;
    status: string;
    location: string | null;
    admin_area_id: string | null;
  }>;
  areasById: Record<string, string>;
}

export default function GovernmentSdgHeatmap({ projects, areasById }: HeatmapProps) {
  const heatmapData = useMemo(() => {
    const regions = new Map<string, Map<number, { count: number; budget: number; completed: number }>>();

    for (const p of projects) {
      const regionKey = (p.admin_area_id && areasById[p.admin_area_id]) || p.location || "Unspecified";
      if (!regions.has(regionKey)) regions.set(regionKey, new Map());
      const regionMap = regions.get(regionKey)!;

      for (const goal of p.sdg_goals || []) {
        const existing = regionMap.get(goal) || { count: 0, budget: 0, completed: 0 };
        existing.count += 1;
        existing.budget += p.budget || 0;
        if (p.status === "completed") existing.completed += 1;
        regionMap.set(goal, existing);
      }
    }

    return regions;
  }, [projects, areasById]);

  const allGoals = useMemo(() => {
    const goals = new Set<number>();
    for (const regionMap of heatmapData.values()) {
      for (const goal of regionMap.keys()) goals.add(goal);
    }
    return Array.from(goals).sort((a, b) => a - b);
  }, [heatmapData]);

  const regionNames = useMemo(() => Array.from(heatmapData.keys()).sort(), [heatmapData]);

  const maxCount = useMemo(() => {
    let max = 1;
    for (const regionMap of heatmapData.values()) {
      for (const v of regionMap.values()) {
        if (v.count > max) max = v.count;
      }
    }
    return max;
  }, [heatmapData]);

  if (regionNames.length === 0 || allGoals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Regional SDG Heatmap</CardTitle>
          <CardDescription>Create projects with regions and SDG goals to see the heatmap.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Regional SDG Heatmap</CardTitle>
        <CardDescription>Project intensity by region and SDG goal. Darker = more projects.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <TooltipProvider>
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left p-1 font-medium text-muted-foreground sticky left-0 bg-background z-10">Region</th>
                  {allGoals.map(g => (
                    <th key={g} className="p-1 text-center font-medium" style={{ color: sdgGoalColors[g] }}>
                      {g}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {regionNames.map(region => {
                  const regionMap = heatmapData.get(region)!;
                  return (
                    <tr key={region} className="border-t border-border/50">
                      <td className="p-1.5 font-medium truncate max-w-[120px] sticky left-0 bg-background z-10">{region}</td>
                      {allGoals.map(goal => {
                        const cell = regionMap.get(goal);
                        if (!cell) {
                          return <td key={goal} className="p-1 text-center"><div className="w-8 h-8 rounded bg-muted/30 mx-auto" /></td>;
                        }
                        const intensity = Math.min(cell.count / maxCount, 1);
                        const bgColor = sdgGoalColors[goal] || "#6b7280";
                        return (
                          <td key={goal} className="p-1 text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className="w-8 h-8 rounded mx-auto flex items-center justify-center text-[10px] font-bold cursor-default"
                                  style={{
                                    backgroundColor: bgColor,
                                    opacity: 0.2 + intensity * 0.8,
                                    color: intensity > 0.5 ? "white" : "currentColor",
                                  }}
                                >
                                  {cell.count}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-medium">{region} — SDG {goal}</p>
                                <p>{cell.count} projects • ${(cell.budget / 1000).toFixed(0)}k budget</p>
                                <p>{cell.completed} completed ({cell.count > 0 ? Math.round((cell.completed / cell.count) * 100) : 0}%)</p>
                              </TooltipContent>
                            </Tooltip>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
