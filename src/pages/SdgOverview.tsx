import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Target, TrendingUp, TrendingDown, Minus, AlertTriangle,
  ExternalLink, BarChart3, Globe, BookOpen, ChevronLeft, ChevronRight, Info
} from "lucide-react";
import { sdgGoalDetails, africaRegionalProgress, sdgReportLinks, type SdgGoalDetail } from "@/data/sdgProgressData";
import { sdgGoalColors } from "@/lib/constants";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { SEOHead } from "@/components/seo/SEOHead";

const trendIcons: Record<string, React.ReactNode> = {
  improving: <TrendingUp className="h-4 w-4 text-green-500" />,
  declining: <TrendingDown className="h-4 w-4 text-destructive" />,
  stagnating: <Minus className="h-4 w-4 text-orange-500" />,
  insufficient_data: <Info className="h-4 w-4 text-muted-foreground" />,
};

const trendColors: Record<string, string> = {
  improving: "text-green-600 bg-green-500/10",
  declining: "text-destructive bg-destructive/10",
  stagnating: "text-orange-600 bg-orange-500/10",
  insufficient_data: "text-muted-foreground bg-muted",
};

function GoalDetailPanel({ goal }: { goal: SdgGoalDetail }) {
  const color = sdgGoalColors[goal.goal.toString()] || "#333";
  const latestProgress = goal.africaProgress[goal.africaProgress.length - 1];
  const chartData = goal.africaProgress.map(p => ({ year: p.year, score: p.score }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <img
          src={goal.icon}
          alt={`SDG ${goal.goal}`}
          className="w-20 h-20 rounded-lg shadow-md"
        />
        <div className="flex-1">
          <h2 className="text-2xl font-bold" style={{ color }}>
            SDG {goal.goal}: {goal.title}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{goal.fullTitle}</p>
          <p className="text-sm mt-2">{goal.description}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold" style={{ color }}>{latestProgress?.score}%</div>
          <div className="flex items-center gap-1 justify-end">
            {trendIcons[latestProgress?.trend || "insufficient_data"]}
            <span className={`text-xs px-2 py-0.5 rounded-full ${trendColors[latestProgress?.trend || "insufficient_data"]}`}>
              {latestProgress?.trend?.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Africa Progress Index (2016–2025)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="year" className="text-xs" />
              <YAxis domain={[0, 100]} className="text-xs" />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Line type="monotone" dataKey="score" stroke={color} strokeWidth={3} dot={{ fill: color, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1">
            {goal.africaProgress.map(p => (
              <div key={p.year} className="flex items-center gap-2 text-xs">
                <span className="w-10 font-medium">{p.year}</span>
                {trendIcons[p.trend]}
                <span className="text-muted-foreground flex-1">{p.notes}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {goal.keyStats.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold" style={{ color }}>{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-[10px] text-muted-foreground">({stat.year})</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Targets */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" /> Targets ({goal.targets.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {goal.targets.map(t => (
            <div key={t.id} className="border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" style={{ borderColor: color, color }}>{t.id}</Badge>
                <span className="text-sm font-medium">{t.description}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {t.indicators.map((ind, j) => (
                  <span key={j} className="text-xs bg-muted px-2 py-0.5 rounded">{ind}</span>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Challenges & Opportunities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> Key Challenges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {goal.challenges.map((c, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span> {c}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-green-600">
              <TrendingUp className="h-4 w-4" /> Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {goal.opportunities.map((o, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span> {o}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SdgOverview() {
  const [searchParams, setSearchParams] = useSearchParams();
  const goalParam = searchParams.get("goal");
  const [selectedGoal, setSelectedGoal] = useState<number>(goalParam ? parseInt(goalParam) : 0);
  const [activeTab, setActiveTab] = useState(goalParam ? "detail" : "overview");

  const handleGoalSelect = (goal: number) => {
    setSelectedGoal(goal);
    setActiveTab("detail");
    setSearchParams({ goal: goal.toString() });
  };

  // Overview data
  const overviewChartData = sdgGoalDetails.map(g => {
    const latest = g.africaProgress[g.africaProgress.length - 1];
    return { name: `SDG ${g.goal}`, score: latest?.score || 0, goal: g.goal, fill: sdgGoalColors[g.goal.toString()] };
  });

  const radarData = sdgGoalDetails.map(g => {
    const latest = g.africaProgress[g.africaProgress.length - 1];
    return { subject: `${g.goal}`, score: latest?.score || 0 };
  });

  const avgScore = Math.round(overviewChartData.reduce((s, d) => s + d.score, 0) / overviewChartData.length);
  const improving = sdgGoalDetails.filter(g => g.africaProgress[g.africaProgress.length - 1]?.trend === "improving").length;
  const declining = sdgGoalDetails.filter(g => g.africaProgress[g.africaProgress.length - 1]?.trend === "declining").length;

  const selectedDetail = sdgGoalDetails.find(g => g.goal === selectedGoal);

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-7xl">
      <SEOHead
        title="SDG Implementation Progress in Africa | DevMapper"
        description="Track progress on all 17 UN Sustainable Development Goals across African countries with data from UN SDG Reports 2016-2025."
      />

      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">SDG Implementation Progress in Africa</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Comprehensive overview of the 17 Sustainable Development Goals, their targets,
          and implementation progress for African countries based on UN SDG Reports (2016–2025).
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Globe className="h-3 w-3" />
          Sources: <a href="https://unstats.un.org/sdgs" target="_blank" rel="noopener noreferrer" className="underline">UN Stats</a>,
          <a href="https://sdgs.un.org/gsdr/gsdr2023" target="_blank" rel="noopener noreferrer" className="underline">GSDR 2023</a>,
          <a href="https://www.un.org/sustainabledevelopment/" target="_blank" rel="noopener noreferrer" className="underline">UN SDGs</a>
        </div>
      </div>

      {/* SDG Grid with official logos */}
      <div className="grid grid-cols-6 sm:grid-cols-9 lg:grid-cols-17 gap-2">
        {sdgGoalDetails.map(g => (
          <button
            key={g.goal}
            onClick={() => handleGoalSelect(g.goal)}
            className={`rounded-lg overflow-hidden transition-all hover:scale-110 hover:shadow-lg ${
              selectedGoal === g.goal ? "ring-2 ring-primary ring-offset-2 scale-110" : ""
            }`}
          >
            <img src={g.icon} alt={`SDG ${g.goal}: ${g.title}`} className="w-full aspect-square object-cover" />
          </button>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview"><BarChart3 className="mr-1 h-4 w-4" />Overview</TabsTrigger>
          <TabsTrigger value="detail" disabled={!selectedGoal}><Target className="mr-1 h-4 w-4" />Goal Detail</TabsTrigger>
          <TabsTrigger value="regional"><Globe className="mr-1 h-4 w-4" />Regional</TabsTrigger>
          <TabsTrigger value="reports"><BookOpen className="mr-1 h-4 w-4" />Reports & Sources</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Average Score</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{avgScore}%</div>
                <p className="text-xs text-muted-foreground">Across all 17 SDGs</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Improving</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{improving}</div>
                <p className="text-xs text-muted-foreground">Goals with positive trend</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Off-Track</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive">{declining}</div>
                <p className="text-xs text-muted-foreground">Goals declining</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Data Points</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">10</div>
                <p className="text-xs text-muted-foreground">Years of tracking (2016–2025)</p>
              </CardContent>
            </Card>
          </div>

          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>SDG Progress Scores — Africa (Latest)</CardTitle>
              <p className="text-sm text-muted-foreground">Click any bar to see goal details</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={overviewChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" angle={-45} textAnchor="end" height={60} />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]} cursor="pointer" onClick={(d: any) => handleGoalSelect(d.goal)}>
                    {overviewChartData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>SDG Performance Radar</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid className="stroke-muted" />
                  <PolarAngleAxis dataKey="subject" className="text-xs" />
                  <PolarRadiusAxis domain={[0, 100]} className="text-xs" />
                  <Radar name="Africa Score" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Goal cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sdgGoalDetails.map(g => {
              const latest = g.africaProgress[g.africaProgress.length - 1];
              const color = sdgGoalColors[g.goal.toString()];
              return (
                <Card
                  key={g.goal}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleGoalSelect(g.goal)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <img src={g.icon} alt={g.title} className="w-12 h-12 rounded" />
                      <div>
                        <h3 className="font-semibold" style={{ color }}>SDG {g.goal}</h3>
                        <p className="text-sm text-muted-foreground">{g.title}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <span className="text-lg font-bold" style={{ color }}>{latest?.score}%</span>
                      </div>
                    </div>
                    <Progress value={latest?.score || 0} className="h-2 mb-2" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {trendIcons[latest?.trend || "insufficient_data"]}
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${trendColors[latest?.trend || "insufficient_data"]}`}>
                          {latest?.trend?.replace("_", " ")}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">{g.targets.length} targets</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Goal Detail */}
        <TabsContent value="detail">
          {selectedDetail ? (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={selectedGoal <= 1}
                  onClick={() => handleGoalSelect(selectedGoal - 1)}
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <span className="text-sm text-muted-foreground flex-1 text-center">
                  Goal {selectedGoal} of 17
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={selectedGoal >= 17}
                  onClick={() => handleGoalSelect(selectedGoal + 1)}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <GoalDetailPanel goal={selectedDetail} />
              <div className="mt-4 text-center">
                <Link to={`/sdg-agenda2063?sdg=${selectedGoal}`}>
                  <Button variant="outline">
                    <Globe className="mr-2 h-4 w-4" /> View Agenda 2063 Alignment for SDG {selectedGoal}
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Click on an SDG above to view detailed progress data.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Regional */}
        <TabsContent value="regional" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Regional SDG Performance</CardTitle>
              <p className="text-sm text-muted-foreground">Average progress scores across Africa's sub-regions</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={africaRegionalProgress} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 100]} className="text-xs" />
                  <YAxis dataKey="region" type="category" width={120} className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Bar dataKey="avgScore" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {africaRegionalProgress.map(r => (
              <Card key={r.region}>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg">{r.region}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Progress value={r.avgScore} className="flex-1 h-2" />
                    <span className="font-bold text-primary">{r.avgScore}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Top performing: <Badge variant="outline">SDG {r.topSDG}</Badge>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Challenges: {r.challenges}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Reports */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>UN SDG Reports & Data Sources</CardTitle>
              <p className="text-sm text-muted-foreground">
                Data compiled from official UN SDG progress reports, Global Sustainable Development Reports, and UN Statistics Division
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <h3 className="font-semibold">Annual SDG Reports</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {sdgReportLinks.filter(r => !r.label).map(r => (
                  <a key={r.year + r.url} href={r.url} target="_blank" rel="noopener noreferrer"
                    className="border rounded-lg p-3 text-center hover:bg-accent transition-colors">
                    <div className="text-lg font-bold text-primary">{r.year}</div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      UN SDG Report <ExternalLink className="h-3 w-3" />
                    </div>
                  </a>
                ))}
              </div>

              <Separator className="my-4" />

              <h3 className="font-semibold">Global Sustainable Development Reports</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {sdgReportLinks.filter(r => r.label).map(r => (
                  <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer"
                    className="border rounded-lg p-3 text-center hover:bg-accent transition-colors">
                    <div className="text-lg font-bold text-primary">{r.label}</div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      View report <ExternalLink className="h-3 w-3" />
                    </div>
                  </a>
                ))}
              </div>

              <Separator className="my-4" />

              <h3 className="font-semibold">Additional Resources</h3>
              <div className="space-y-2">
                {[
                  { label: "UN SDG Indicators Database", url: "https://unstats.un.org/sdgs" },
                  { label: "UN Sustainable Development", url: "https://www.un.org/sustainabledevelopment/" },
                  { label: "UN Communications Material", url: "https://www.un.org/sustainabledevelopment/news/communications-material/" },
                  { label: "Africa SDG Center", url: "https://sdgcafrica.org/" },
                  { label: "AU Agenda 2063", url: "https://au.int/en/agenda2063/overview" },
                ].map(link => (
                  <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    {link.label}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
