import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MapPin, Filter, BarChart3 } from "lucide-react"
import ProjectMap from "@/components/ProjectMap"
import { mockReports, Report } from "@/data/mockReports"
import { sdgGoalColors, projectStatusColors } from "@/lib/constants"
import SdgDistributionChart from "@/components/SdgDistributionChart";

interface MapFilters {
  country_code: string
  sdg_goal: string
  project_status: string
}

const filterStatusMap: Record<string, Report['project_status']> = {
  pending: 'planned',
  confirmed: 'in_progress',
  completed: 'completed',
  invalid: 'cancelled',
};

const statusDisplayMap: Record<Report['project_status'], string> = {
    planned: 'Pending',
    in_progress: 'Confirmed',
    completed: 'Completed',
    cancelled: 'Invalid',
    stalled: 'Stalled',
};

export default function SdgMapView() {
  const [filteredReports, setFilteredReports] = useState<Report[]>(mockReports)
  const [filters, setFilters] = useState<MapFilters>({
    country_code: "all",
    sdg_goal: "all",
    project_status: "all",
  })
  const [selectedReport, setSelectedReport] = useState<Report | null>(
    mockReports.length > 0 ? mockReports[0] : null
  );

  useEffect(() => {
    let newFilteredReports = mockReports.filter(report => {
      if (filters.country_code !== "all" && report.country_code !== filters.country_code) {
        return false;
      }
      if (filters.sdg_goal !== "all" && report.sdg_goal !== filters.sdg_goal) {
        return false;
      }
      if (filters.project_status !== "all") {
          const mappedStatus = filterStatusMap[filters.project_status];
          if (report.project_status !== mappedStatus) return false;
      }
      return true;
    });

    setFilteredReports(newFilteredReports);

    if (newFilteredReports.length > 0) {
      if (!selectedReport || !newFilteredReports.find(r => r.id === selectedReport.id)) {
        setSelectedReport(newFilteredReports[0]);
      }
    } else {
      setSelectedReport(null);
    }
  }, [filters, selectedReport]);

  const handleMarkerClick = (report: Report) => {
    setSelectedReport(report);
  }

  const formatBudget = (budget: number): string => {
    if (budget >= 1000000) {
      return `$${(budget / 1000000).toFixed(1)}M`
    } else if (budget >= 1000) {
      return `$${(budget / 1000).toFixed(1)}K`
    }
    return `$${budget}`
  }

  return (
    <div className="w-full space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Map Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Country</label>
              <Select
                value={filters.country_code}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, country_code: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  <SelectItem value="NGA">Nigeria</SelectItem>
                  <SelectItem value="KEN">Kenya</SelectItem>
                  <SelectItem value="ZAF">South Africa</SelectItem>
                  <SelectItem value="GHA">Ghana</SelectItem>
                  <SelectItem value="ETH">Ethiopia</SelectItem>
                  <SelectItem value="RWA">Rwanda</SelectItem>
                  <SelectItem value="UGA">Uganda</SelectItem>
                  <SelectItem value="TZA">Tanzania</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">SDG Goal</label>
              <Select
                value={filters.sdg_goal}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, sdg_goal: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Goals" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Goals</SelectItem>
                  {Array.from({ length: 17 }, (_, i) => i + 1).map((goal) => (
                    <SelectItem key={goal} value={goal.toString()}>
                      SDG {goal}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={filters.project_status}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, project_status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="invalid">Invalid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  SDG Projects Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProjectMap projects={filteredReports} onMarkerClick={handleMarkerClick} />
              </CardContent>
            </Card>
            <SdgDistributionChart topN={5} />
        </div>

        {/* Project Details */}
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedReport ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedReport.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedReport.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: sdgGoalColors[selectedReport.sdg_goal] || '#ccc' }} />
                  <span className="text-sm font-medium">
                    SDG {selectedReport.sdg_goal}
                    {selectedReport.sdg_target && ` - ${selectedReport.sdg_target}`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={projectStatusColors[selectedReport.project_status]}>
                    {statusDisplayMap[selectedReport.project_status] || selectedReport.project_status}
                  </Badge>
                  {selectedReport.verification_score && <span className="text-sm text-gray-600">
                    {Math.round(selectedReport.verification_score)}% verified
                  </span>}
                </div>

                {selectedReport.cost && selectedReport.cost > 0 && (
                  <div className="text-sm">
                    <span className="font-medium">Budget: </span>
                    {formatBudget(selectedReport.cost)}
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Reported: {new Date(selectedReport.submitted_at).toLocaleDateString()}
                </div>

                <div className="text-xs text-gray-400">
                  Location: {selectedReport.lat?.toFixed(4)}, {selectedReport.lng?.toFixed(4)}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Select a project on the map to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <Card>
        <CardHeader>
          <CardTitle>Filtered Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReports.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredReports.map((report) => (
                <div
                  key={report.id}
                  className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${selectedReport?.id === report.id ? 'bg-blue-50 border-blue-200' : ''}`}
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sdgGoalColors[report.sdg_goal] || '#ccc' }} />
                    <div>
                      <h4 className="font-medium text-sm">{report.title}</h4>
                      <p className="text-xs text-gray-600">
                        SDG {report.sdg_goal} • {statusDisplayMap[report.project_status] || report.project_status}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {report.cost && report.cost > 0 && <div className="text-sm font-medium">{formatBudget(report.cost)}</div>}
                    {report.verification_score && <div className="text-xs text-gray-500">{Math.round(report.verification_score)}% verified</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center text-gray-500 py-8">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No projects match the current filters.</p>
              </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
