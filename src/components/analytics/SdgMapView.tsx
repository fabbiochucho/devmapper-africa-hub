
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MapPin, Filter, BarChart3, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ProjectMap from "@/components/ProjectMap"
import { Report } from "@/data/mockReports"

interface MapProject {
  id: number
  title: string
  content: string
  sdg_goal: number
  sdg_target: string
  status: string
  lat: number
  lng: number
  budget: number
  verification_score: number
  color: string
  created_at: string
}

interface MapFilters {
  country_code: string
  sdg_goal: string
  project_status: string
}

function mapProjectToReport(project: MapProject): Report {
  let project_status: Report['project_status'] = 'planned';
  if (project.status === 'pending') {
    project_status = 'planned';
  } else if (project.status === 'confirmed') {
    project_status = 'in_progress';
  } else if (project.status === 'completed') {
    project_status = 'completed';
  } else if (project.status === 'invalid') {
    project_status = 'cancelled';
  }

  return {
    id: `REP-MAP-${project.id.toString().padStart(3, '0')}`,
    title: project.title,
    description: project.content,
    sdg_goal: project.sdg_goal.toString(),
    sdg_target: project.sdg_target,
    project_status,
    location: '', 
    submitted_at: project.created_at,
    lat: project.lat,
    lng: project.lng,
    validations: 0,
    verifications: [],
    verification_score: project.verification_score,
    cost: project.budget,
    costCurrency: 'USD',
    official: false,
  };
}


export default function SdgMapView() {
  const [projects, setProjects] = useState<MapProject[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [filters, setFilters] = useState<MapFilters>({
    country_code: "",
    sdg_goal: "",
    project_status: "",
  })
  const [selectedProject, setSelectedProject] = useState<MapProject | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMapData()
  }, [filters])

  const fetchMapData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== "all") params.append(key, value)
      })

      const response = await fetch(`/api/sdg/map-data?${params}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()

      if (Array.isArray(data)) {
        setProjects(data)
        setReports(data.map(mapProjectToReport))
        if (data.length > 0 && !selectedProject) {
          setSelectedProject(data[0])
        } else if (data.length === 0) {
          setSelectedProject(null)
        }
      } else {
        throw new Error("Invalid data format received")
      }
    } catch (error) {
      console.error("Failed to fetch map data:", error)
      setError(error instanceof Error ? error.message : "Failed to fetch map data")

      const mockProjects = getMockProjects();
      setProjects(mockProjects)
      setReports(mockProjects.map(mapProjectToReport))
      if (mockProjects.length > 0 && !selectedProject) {
        setSelectedProject(mockProjects[0])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkerClick = (report: Report) => {
    const projectId = parseInt(report.id.split('-').pop() || '0');
    if (projectId) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
          setSelectedProject(project);
      }
    }
  }

  const getMockProjects = (): MapProject[] => {
    return [
      {
        id: 1,
        title: "Clean Water Project - Nairobi",
        content: "Installing water purification systems in Kibera slum to provide clean drinking water access...",
        sdg_goal: 6,
        sdg_target: "6.1",
        status: "confirmed",
        lat: -1.2921,
        lng: 36.8219,
        budget: 50000,
        verification_score: 85,
        color: "#26BDE2",
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 2,
        title: "Education Center - Lagos",
        content: "Building a new primary school to serve 500 children in underserved communities...",
        sdg_goal: 4,
        sdg_target: "4.1",
        status: "pending",
        lat: 6.5244,
        lng: 3.3792,
        budget: 120000,
        verification_score: 72,
        color: "#C5192D",
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 3,
        title: "Solar Energy Initiative - Cape Town",
        content: "Installing solar panels in rural communities to provide affordable clean energy...",
        sdg_goal: 7,
        sdg_target: "7.1",
        status: "completed",
        lat: -33.9249,
        lng: 18.4241,
        budget: 75000,
        verification_score: 92,
        color: "#FCC30B",
        created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]
  }

  const getStatusColor = (status: string): string => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      invalid: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
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
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error} Showing sample data for demonstration.</AlertDescription>
        </Alert>
      )}

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
                onValueChange={(value) => setFilters((prev) => ({ ...prev, country_code: value === 'all' ? '' : value }))}
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
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">SDG Goal</label>
              <Select
                value={filters.sdg_goal}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, sdg_goal: value === 'all' ? '' : value }))}
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
                onValueChange={(value) => setFilters((prev) => ({ ...prev, project_status: value === 'all' ? '' : value }))}
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
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              SDG Projects Map
              {isLoading && <span className="text-sm font-normal text-muted-foreground">(Loading...)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectMap projects={reports} onMarkerClick={handleMarkerClick} />
          </CardContent>
        </Card>

        {/* Project Details */}
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedProject ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedProject.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedProject.content}</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedProject.color }} />
                  <span className="text-sm font-medium">
                    SDG {selectedProject.sdg_goal}
                    {selectedProject.sdg_target && ` - ${selectedProject.sdg_target}`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(selectedProject.status)}>{selectedProject.status}</Badge>
                  <span className="text-sm text-gray-600">
                    {Math.round(selectedProject.verification_score)}% verified
                  </span>
                </div>

                {selectedProject.budget > 0 && (
                  <div className="text-sm">
                    <span className="font-medium">Budget: </span>
                    {formatBudget(selectedProject.budget)}
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  Reported: {new Date(selectedProject.created_at).toLocaleDateString()}
                </div>

                <div className="text-xs text-gray-400">
                  Location: {selectedProject.lat.toFixed(4)}, {selectedProject.lng.toFixed(4)}
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
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">Loading projects...</div>
          ) : projects.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${selectedProject?.id === project.id ? 'bg-blue-50 border-blue-200' : ''}`}
                  onClick={() => setSelectedProject(project)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
                    <div>
                      <h4 className="font-medium text-sm">{project.title}</h4>
                      <p className="text-xs text-gray-600">
                        SDG {project.sdg_goal} • {project.status}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {project.budget > 0 && <div className="text-sm font-medium">{formatBudget(project.budget)}</div>}
                    <div className="text-xs text-gray-500">{Math.round(project.verification_score)}% verified</div>
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
