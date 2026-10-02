import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MapPin, Filter, BarChart3 } from "lucide-react"
import LazyEnhancedProjectMap from "@/components/map/LazyEnhancedProjectMap"
import { sdgGoalColors, projectStatuses } from "@/lib/constants"
import { useReportsList } from "@/hooks/useReportsList"

const statusLabel = new Map(projectStatuses.map((s) => [s.value, s.label]))

const formatBudget = (budget: number, currency: string | null): string => {
  const c = currency || "USD"
  if (budget >= 1_000_000) return `${c} ${(budget / 1_000_000).toFixed(1)}M`
  if (budget >= 1_000) return `${c} ${(budget / 1_000).toFixed(1)}K`
  return `${c} ${budget}`
}

export default function SdgMapView() {
  const { data: reports = [], isLoading } = useReportsList()
  const [filters, setFilters] = useState({ country_code: "all", sdg_goal: "all", project_status: "all" })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const countries = useMemo(
    () => [...new Set(reports.map((r) => r.country_code).filter((c): c is string => !!c))].sort(),
    [reports],
  )
  const filteredReports = useMemo(
    () =>
      reports.filter(
        (r) =>
          (filters.country_code === "all" || r.country_code === filters.country_code) &&
          (filters.sdg_goal === "all" || r.sdg_goal === Number(filters.sdg_goal)) &&
          (filters.project_status === "all" || r.project_status === filters.project_status),
      ),
    [reports, filters],
  )
  const selected = filteredReports.find((r) => r.id === selectedId) ?? filteredReports[0] ?? null

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Country</label>
              <Select value={filters.country_code} onValueChange={(v) => setFilters((p) => ({ ...p, country_code: v }))}>
                <SelectTrigger><SelectValue placeholder="All Countries" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">SDG Goal</label>
              <Select value={filters.sdg_goal} onValueChange={(v) => setFilters((p) => ({ ...p, sdg_goal: v }))}>
                <SelectTrigger><SelectValue placeholder="All Goals" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Goals</SelectItem>
                  {Array.from({ length: 17 }, (_, i) => i + 1).map((g) => (
                    <SelectItem key={g} value={String(g)}>SDG {g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filters.project_status} onValueChange={(v) => setFilters((p) => ({ ...p, project_status: v }))}>
                <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {projectStatuses.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              SDG Projects Map with Earth Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LazyEnhancedProjectMap />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Project Details</CardTitle></CardHeader>
          <CardContent>
            {selected ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selected.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-5">{selected.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: sdgGoalColors[selected.sdg_goal] || "#ccc" }} />
                  <span className="text-sm font-medium">SDG {selected.sdg_goal}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{statusLabel.get(selected.project_status) || selected.project_status}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {selected.verification_count ?? 0} verifications{selected.is_verified ? " · verified" : ""}
                  </span>
                </div>
                {!!selected.cost && (
                  <div className="text-sm"><span className="font-medium">Budget: </span>{formatBudget(selected.cost, selected.cost_currency)}</div>
                )}
                <div className="text-xs text-muted-foreground">Reported: {new Date(selected.submitted_at).toLocaleDateString()}</div>
                {selected.lat != null && selected.lng != null && (
                  <div className="text-xs text-muted-foreground">Location: {selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}</div>
                )}
                <Link className="text-sm text-primary underline" to={`/project/${selected.id}`}>Open project</Link>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p>{isLoading ? "Loading projects…" : "No projects match the current filters."}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Filtered Projects ({filteredReports.length})</CardTitle></CardHeader>
        <CardContent>
          {filteredReports.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredReports.map((report) => (
                <button
                  type="button"
                  key={report.id}
                  className={`w-full text-left flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors ${selected?.id === report.id ? "bg-muted" : ""}`}
                  onClick={() => setSelectedId(report.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sdgGoalColors[report.sdg_goal] || "#ccc" }} />
                    <div>
                      <h4 className="font-medium text-sm">{report.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        SDG {report.sdg_goal} • {statusLabel.get(report.project_status) || report.project_status}
                      </p>
                    </div>
                  </div>
                  {!!report.cost && <div className="text-sm font-medium">{formatBudget(report.cost, report.cost_currency)}</div>}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>{isLoading ? "Loading projects…" : "No projects match the current filters."}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
