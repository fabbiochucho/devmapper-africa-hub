import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Globe, Target, BookOpen, MapPin, BarChart3, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { africaCountries } from "@/lib/constants";

interface SdgAlignment {
  id: string;
  sdg_goal: number;
  sdg_target: string;
  agenda2063_goal: string;
  agenda2063_aspiration: string;
  alignment_description: string;
  created_at: string;
}

interface ProjectCount {
  sdg_goal: number;
  count: number;
  country_code: string | null;
}

const SDG_COLORS: Record<number, string> = {
  1: "#e5243b", 2: "#dda63a", 3: "#4c9f38", 4: "#c5192d", 5: "#ff3a21",
  6: "#26bde2", 7: "#fcc30b", 8: "#a21942", 9: "#fd6925", 10: "#dd1367",
  11: "#fd9d24", 12: "#bf8b2e", 13: "#3f7e44", 14: "#0a97d9", 15: "#56c02b",
  16: "#00689d", 17: "#19486a"
};

const SDG_NAMES: Record<number, string> = {
  1: "No Poverty", 2: "Zero Hunger", 3: "Good Health", 4: "Quality Education",
  5: "Gender Equality", 6: "Clean Water", 7: "Clean Energy", 8: "Decent Work",
  9: "Industry Innovation", 10: "Reduced Inequalities", 11: "Sustainable Cities",
  12: "Responsible Consumption", 13: "Climate Action", 14: "Life Below Water",
  15: "Life on Land", 16: "Peace and Justice", 17: "Partnerships"
};

export default function SdgAgenda2063Alignment() {
  const [alignments, setAlignments] = useState<SdgAlignment[]>([]);
  const [projectCounts, setProjectCounts] = useState<ProjectCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAspiration, setFilterAspiration] = useState<string>("all");
  const [filterSDG, setFilterSDG] = useState<string>("all");
  const [filterCountry, setFilterCountry] = useState<string>("all");

  useEffect(() => {
    Promise.all([fetchAlignments(), fetchProjectCounts()]).finally(() => setLoading(false));
  }, []);

  const fetchAlignments = async () => {
    const { data } = await supabase
      .from("sdg_agenda2063_alignment")
      .select("*")
      .order("sdg_goal", { ascending: true });
    if (data) setAlignments(data);
  };

  const fetchProjectCounts = async () => {
    const { data } = await supabase
      .from("reports")
      .select("sdg_goal, country_code");
    if (data) {
      const counts: ProjectCount[] = [];
      const map = new Map<string, number>();
      data.forEach(r => {
        const key = `${r.sdg_goal}-${r.country_code || "global"}`;
        map.set(key, (map.get(key) || 0) + 1);
      });
      map.forEach((count, key) => {
        const [goal, cc] = key.split("-");
        counts.push({ sdg_goal: parseInt(goal), count, country_code: cc === "global" ? null : cc });
      });
      setProjectCounts(counts);
    }
  };

  const getProjectCountForSDG = (sdg: number) => {
    return projectCounts
      .filter(p => p.sdg_goal === sdg && (filterCountry === "all" || p.country_code === filterCountry))
      .reduce((sum, p) => sum + p.count, 0);
  };

  const totalProjects = useMemo(() => {
    return projectCounts
      .filter(p => filterCountry === "all" || p.country_code === filterCountry)
      .reduce((sum, p) => sum + p.count, 0);
  }, [projectCounts, filterCountry]);

  const filteredAlignments = alignments.filter(a => {
    const matchesSearch = searchTerm === "" ||
      a.sdg_target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.agenda2063_goal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.alignment_description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAspiration = filterAspiration === "all" || a.agenda2063_aspiration.includes(filterAspiration);
    const matchesSDG = filterSDG === "all" || a.sdg_goal.toString() === filterSDG;
    return matchesSearch && matchesAspiration && matchesSDG;
  });

  const groupedByAspiration = filteredAlignments.reduce((acc, a) => {
    (acc[a.agenda2063_aspiration] ??= []).push(a);
    return acc;
  }, {} as Record<string, SdgAlignment[]>);

  const groupedBySDG = filteredAlignments.reduce((acc, a) => {
    (acc[a.sdg_goal] ??= []).push(a);
    return acc;
  }, {} as Record<number, SdgAlignment[]>);

  const uniqueAspirations = [...new Set(alignments.map(a => a.agenda2063_aspiration))];

  // Gap analysis: SDGs with alignments but no projects
  const sdgsWithNoProjects = Array.from({ length: 17 }, (_, i) => i + 1).filter(
    sdg => alignments.some(a => a.sdg_goal === sdg) && getProjectCountForSDG(sdg) === 0
  );

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="mt-4 text-muted-foreground">Loading SDG-Agenda 2063 alignments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">SDG-Agenda 2063 Alignment</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explore how the United Nations Sustainable Development Goals align with
          Africa's Agenda 2063 aspirations, linked to real project data.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SDG Goals Mapped</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{new Set(alignments.map(a => a.sdg_goal)).size}</div>
            <p className="text-xs text-muted-foreground">Out of 17 SDGs</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aspirations Covered</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueAspirations.length}</div>
            <p className="text-xs text-muted-foreground">Agenda 2063 aspirations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">Linked to SDG targets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coverage Gaps</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sdgsWithNoProjects.length}</div>
            <p className="text-xs text-muted-foreground">SDGs with no projects</p>
          </CardContent>
        </Card>
      </div>

      {/* Heat Map: SDG alignment density */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">SDG Alignment Heat Map</CardTitle>
          <p className="text-sm text-muted-foreground">Density of alignments and active projects per SDG</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 sm:grid-cols-9 lg:grid-cols-17 gap-2">
            {Array.from({ length: 17 }, (_, i) => i + 1).map(sdg => {
              const alignCount = alignments.filter(a => a.sdg_goal === sdg).length;
              const projCount = getProjectCountForSDG(sdg);
              const intensity = Math.min(alignCount / 5, 1);
              return (
                <div
                  key={sdg}
                  className="relative aspect-square rounded-lg flex flex-col items-center justify-center text-white text-xs cursor-pointer hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: SDG_COLORS[sdg],
                    opacity: 0.3 + intensity * 0.7,
                  }}
                  title={`SDG ${sdg}: ${alignCount} alignments, ${projCount} projects`}
                  onClick={() => setFilterSDG(sdg.toString())}
                >
                  <span className="font-bold text-sm">{sdg}</span>
                  {projCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-foreground text-background rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                      {projCount}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Gap Analysis */}
      {sdgsWithNoProjects.length > 0 && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Gap Analysis: SDGs with No Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {sdgsWithNoProjects.map(sdg => (
                <Badge
                  key={sdg}
                  className="cursor-pointer"
                  style={{ backgroundColor: SDG_COLORS[sdg], color: "white" }}
                  onClick={() => setFilterSDG(sdg.toString())}
                >
                  SDG {sdg}: {SDG_NAMES[sdg]}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              These SDGs have alignment targets but no active projects. Consider submitting projects to fill these gaps.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search alignments..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1"
        />
        <Select value={filterCountry} onValueChange={setFilterCountry}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Filter by Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {africaCountries.map(c => (
              <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterAspiration} onValueChange={setFilterAspiration}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Filter by Aspiration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Aspirations</SelectItem>
            {uniqueAspirations.map(a => (
              <SelectItem key={a} value={a.split(":")[0]}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSDG} onValueChange={setFilterSDG}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by SDG" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All SDGs</SelectItem>
            {Object.entries(SDG_NAMES).map(([num, name]) => (
              <SelectItem key={num} value={num}>SDG {num}: {name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="by-sdg" className="w-full">
        <TabsList>
          <TabsTrigger value="by-sdg">By SDG Goal</TabsTrigger>
          <TabsTrigger value="by-aspiration">By Aspiration</TabsTrigger>
          <TabsTrigger value="progress">Progress Tracker</TabsTrigger>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
        </TabsList>

        <TabsContent value="by-sdg" className="space-y-6">
          {Object.entries(groupedBySDG).map(([sdgNum, list]) => {
            const sdg = parseInt(sdgNum);
            const projCount = getProjectCountForSDG(sdg);
            return (
              <Card key={sdg}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge style={{ backgroundColor: SDG_COLORS[sdg], color: "white" }}>SDG {sdg}</Badge>
                    {SDG_NAMES[sdg]}
                    <Badge variant="outline" className="ml-auto">{projCount} projects</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {list.map(a => (
                    <div key={a.id} className="border rounded-lg p-3 space-y-1">
                      <p className="text-sm"><strong>Target:</strong> {a.sdg_target}</p>
                      <p className="text-sm text-muted-foreground"><strong>Agenda 2063:</strong> {a.agenda2063_aspiration}</p>
                      <p className="text-sm text-muted-foreground"><strong>Goal:</strong> {a.agenda2063_goal}</p>
                      <p className="text-sm">{a.alignment_description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="by-aspiration" className="space-y-6">
          {Object.entries(groupedByAspiration).map(([aspiration, list]) => (
            <Card key={aspiration}>
              <CardHeader><CardTitle className="text-lg">{aspiration}</CardTitle></CardHeader>
              <CardContent className="grid gap-3">
                {list.map(a => (
                  <div key={a.id} className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge style={{ backgroundColor: SDG_COLORS[a.sdg_goal], color: "white" }}>SDG {a.sdg_goal}</Badge>
                      <span className="font-medium">{SDG_NAMES[a.sdg_goal]}</span>
                      <Badge variant="outline" className="ml-auto">{getProjectCountForSDG(a.sdg_goal)} projects</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground"><strong>Target:</strong> {a.sdg_target}</p>
                    <p className="text-sm">{a.alignment_description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Coverage by SDG</CardTitle>
              <p className="text-sm text-muted-foreground">Progress of active projects mapped to each SDG alignment target</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 17 }, (_, i) => i + 1).map(sdg => {
                const alignCount = alignments.filter(a => a.sdg_goal === sdg).length;
                const projCount = getProjectCountForSDG(sdg);
                if (alignCount === 0) return null;
                const coverage = Math.min((projCount / Math.max(alignCount, 1)) * 100, 100);
                return (
                  <div key={sdg} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: SDG_COLORS[sdg] }}>{sdg}</div>
                        <span className="font-medium">{SDG_NAMES[sdg]}</span>
                      </div>
                      <span className="text-muted-foreground">{projCount}/{alignCount} targets</span>
                    </div>
                    <Progress value={coverage} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAlignments.map(a => (
              <Card key={a.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge style={{ backgroundColor: SDG_COLORS[a.sdg_goal], color: "white" }}>SDG {a.sdg_goal}</Badge>
                    <span className="font-medium text-sm">{SDG_NAMES[a.sdg_goal]}</span>
                  </div>
                  <p className="text-xs text-muted-foreground"><strong>Target:</strong> {a.sdg_target}</p>
                  <p className="text-xs text-muted-foreground"><strong>Aspiration:</strong> {a.agenda2063_aspiration.split(":")[0]}</p>
                  <p className="text-xs">{a.alignment_description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
