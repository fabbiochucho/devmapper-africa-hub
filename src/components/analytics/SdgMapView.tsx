
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { africanCountries } from "@/data/countries"
import { Badge } from "@/components/ui/badge"
import { MapPin, SlidersHorizontal, Filter, Info } from "lucide-react"
import ProjectMap from "@/components/ProjectMap"
import { mockReports, Report } from "@/data/mockReports"
import { sdgGoalColors, projectStatusColors } from "@/lib/constants"

interface MapFilters {
  country: string | null
  sdgGoal: string | null
  status: string | null
}

const SdgMapView = () => {
  const [filters, setFilters] = useState<MapFilters>({
    country: null,
    sdgGoal: null,
    status: null,
  })
  const [filteredReports, setFilteredReports] = useState<Report[]>(mockReports)
  const [selectedProject, setSelectedProject] = useState<Report | null>(null);

  const handleMarkerClick = (report: Report) => {
    setSelectedProject(report);
  };

  useEffect(() => {
    let newReports = [...mockReports]

    if (filters.country) {
      newReports = newReports.filter((report) => report.country_code === filters.country)
    }

    if (filters.sdgGoal) {
      newReports = newReports.filter((report) => report.sdg_goal === filters.sdgGoal)
    }

    if (filters.status) {
      newReports = newReports.filter((report) => report.project_status === filters.status)
    }

    setFilteredReports(newReports)
  }, [filters])

  const selectedProjectCountry = selectedProject ? africanCountries.find(c => c.code === selectedProject.country_code) : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block text-muted-foreground">Country</label>
              <Select onValueChange={(value) => setFilters({ ...filters, country: value === 'all' ? null : value })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {africanCountries.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block text-muted-foreground">SDG Goal</label>
              <Select onValueChange={(value) => setFilters({ ...filters, sdgGoal: value === 'all' ? null : value })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select SDG Goal" />
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
              <label className="text-sm font-medium mb-1 block text-muted-foreground">Project Status</label>
              <Select onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? null : value })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="stalled">Stalled</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
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

        {/* Project Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Project Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedProject ? (
              <div className="space-y-4">
                <h3 className="font-bold text-lg">{selectedProject.title}</h3>
                <p className="text-sm text-muted-foreground">{selectedProject.description}</p>
                <div>
                  <Badge style={{ backgroundColor: sdgGoalColors[selectedProject.sdg_goal] }} className="text-white">
                    SDG {selectedProject.sdg_goal}
                  </Badge>
                  <Badge variant="outline" style={{ borderColor: projectStatusColors[selectedProject.project_status], color: projectStatusColors[selectedProject.project_status] }} className="ml-2">
                    {selectedProject.project_status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div className="text-sm">
                  <strong>Country:</strong> {selectedProjectCountry ? selectedProjectCountry.name : selectedProject.country_code}
                </div>
                {selectedProject.cost && <div className="text-sm"><strong>Budget:</strong> ${selectedProject.cost.toLocaleString()}</div>}
                <div className="text-sm">
                  <strong>Submitted:</strong> {new Date(selectedProject.submitted_at).toLocaleDateString()}
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground pt-10">
                <p>Select a project on the map to see details.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SdgMapView
