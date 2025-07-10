import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Target, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SdgAlignment {
  id: string;
  sdg_goal: number;
  sdg_target: string;
  agenda2063_goal: string;
  agenda2063_aspiration: string;
  alignment_description: string;
  created_at: string;
}

const SDG_COLORS = {
  1: "#e5243b", 2: "#dda63a", 3: "#4c9f38", 4: "#c5192d", 5: "#ff3a21",
  6: "#26bde2", 7: "#fcc30b", 8: "#a21942", 9: "#fd6925", 10: "#dd1367",
  11: "#fd9d24", 12: "#bf8b2e", 13: "#3f7e44", 14: "#0a97d9", 15: "#56c02b",
  16: "#00689d", 17: "#19486a"
};

const SDG_NAMES = {
  1: "No Poverty", 2: "Zero Hunger", 3: "Good Health", 4: "Quality Education",
  5: "Gender Equality", 6: "Clean Water", 7: "Clean Energy", 8: "Decent Work",
  9: "Industry Innovation", 10: "Reduced Inequalities", 11: "Sustainable Cities",
  12: "Responsible Consumption", 13: "Climate Action", 14: "Life Below Water",
  15: "Life on Land", 16: "Peace and Justice", 17: "Partnerships"
};

export default function SdgAgenda2063Alignment() {
  const [alignments, setAlignments] = useState<SdgAlignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAspiration, setFilterAspiration] = useState<string>("all");
  const [filterSDG, setFilterSDG] = useState<string>("all");

  useEffect(() => {
    fetchAlignments();
  }, []);

  const fetchAlignments = async () => {
    try {
      const { data, error } = await supabase
        .from('sdg_agenda2063_alignment')
        .select('*')
        .order('sdg_goal', { ascending: true });

      if (error) throw error;
      
      setAlignments(data || []);
    } catch (error) {
      console.error('Error fetching alignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAlignments = alignments.filter(alignment => {
    const matchesSearch = 
      alignment.sdg_target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alignment.agenda2063_goal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alignment.alignment_description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAspiration = filterAspiration === "all" || 
      alignment.agenda2063_aspiration.includes(filterAspiration);
    
    const matchesSDG = filterSDG === "all" || 
      alignment.sdg_goal.toString() === filterSDG;
    
    return matchesSearch && matchesAspiration && matchesSDG;
  });

  const groupedByAspiration = filteredAlignments.reduce((acc, alignment) => {
    const aspiration = alignment.agenda2063_aspiration;
    if (!acc[aspiration]) {
      acc[aspiration] = [];
    }
    acc[aspiration].push(alignment);
    return acc;
  }, {} as Record<string, SdgAlignment[]>);

  const groupedBySDG = filteredAlignments.reduce((acc, alignment) => {
    const sdg = alignment.sdg_goal;
    if (!acc[sdg]) {
      acc[sdg] = [];
    }
    acc[sdg].push(alignment);
    return acc;
  }, {} as Record<number, SdgAlignment[]>);

  const uniqueAspirations = [...new Set(alignments.map(a => a.agenda2063_aspiration))];

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
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
          Africa's Agenda 2063 aspirations and goals for continental development.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <CardTitle className="text-sm font-medium">Agenda 2063 Aspirations</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueAspirations.length}</div>
            <p className="text-xs text-muted-foreground">Continental aspirations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alignments</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alignments.length}</div>
            <p className="text-xs text-muted-foreground">Documented connections</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Search alignments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterAspiration} onValueChange={setFilterAspiration}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="Filter by Aspiration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Aspirations</SelectItem>
            {uniqueAspirations.map(aspiration => (
              <SelectItem key={aspiration} value={aspiration.split(':')[0]}>
                {aspiration}
              </SelectItem>
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
              <SelectItem key={num} value={num}>
                SDG {num}: {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="by-aspiration" className="w-full">
        <TabsList>
          <TabsTrigger value="by-aspiration">By Agenda 2063 Aspiration</TabsTrigger>
          <TabsTrigger value="by-sdg">By SDG Goal</TabsTrigger>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
        </TabsList>

        <TabsContent value="by-aspiration" className="space-y-6">
          {Object.entries(groupedByAspiration).map(([aspiration, alignmentList]) => (
            <Card key={aspiration}>
              <CardHeader>
                <CardTitle className="text-lg">{aspiration}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {alignmentList.map((alignment) => (
                    <div key={alignment.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge 
                          style={{ 
                            backgroundColor: SDG_COLORS[alignment.sdg_goal as keyof typeof SDG_COLORS],
                            color: 'white'
                          }}
                        >
                          SDG {alignment.sdg_goal}
                        </Badge>
                        <span className="font-medium">{SDG_NAMES[alignment.sdg_goal as keyof typeof SDG_NAMES]}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <strong>SDG Target:</strong> {alignment.sdg_target}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <strong>Agenda 2063 Goal:</strong> {alignment.agenda2063_goal}
                      </p>
                      <p className="text-sm">
                        <strong>Alignment:</strong> {alignment.alignment_description}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="by-sdg" className="space-y-6">
          {Object.entries(groupedBySDG).map(([sdgNum, alignmentList]) => {
            const sdg = parseInt(sdgNum);
            return (
              <Card key={sdg}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge 
                      style={{ 
                        backgroundColor: SDG_COLORS[sdg as keyof typeof SDG_COLORS],
                        color: 'white'
                      }}
                    >
                      SDG {sdg}
                    </Badge>
                    {SDG_NAMES[sdg as keyof typeof SDG_NAMES]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {alignmentList.map((alignment) => (
                      <div key={alignment.id} className="border rounded-lg p-4 space-y-2">
                        <p className="text-sm text-muted-foreground">
                          <strong>SDG Target:</strong> {alignment.sdg_target}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Agenda 2063:</strong> {alignment.agenda2063_aspiration}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Goal:</strong> {alignment.agenda2063_goal}
                        </p>
                        <p className="text-sm">
                          <strong>Alignment:</strong> {alignment.alignment_description}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAlignments.map((alignment) => (
              <Card key={alignment.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge 
                      style={{ 
                        backgroundColor: SDG_COLORS[alignment.sdg_goal as keyof typeof SDG_COLORS],
                        color: 'white'
                      }}
                    >
                      SDG {alignment.sdg_goal}
                    </Badge>
                    <span className="font-medium text-sm">
                      {SDG_NAMES[alignment.sdg_goal as keyof typeof SDG_NAMES]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <strong>Target:</strong> {alignment.sdg_target}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Aspiration:</strong> {alignment.agenda2063_aspiration.split(':')[0]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Goal:</strong> {alignment.agenda2063_goal}
                  </p>
                  <p className="text-xs">{alignment.alignment_description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}