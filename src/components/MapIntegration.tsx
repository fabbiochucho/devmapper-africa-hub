"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Layers, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"

interface MapProject {
  id: number
  title: string
  lat: number
  lng: number
  sdg_goal: number
  status: string
  color: string
  budget: number
}

interface MapIntegrationProps {
  projects: MapProject[]
  onProjectSelect?: (project: MapProject) => void
  selectedProject?: MapProject | null
}

export default function MapIntegration({ projects, onProjectSelect, selectedProject }: MapIntegrationProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [zoom, setZoom] = useState(5)
  const [center, setCenter] = useState({ lat: 0, lng: 20 }) // Center on Africa

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => {
      setMapLoaded(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 1, 18))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 1, 2))
  }

  const handleReset = () => {
    setZoom(5)
    setCenter({ lat: 0, lng: 20 })
  }

  const getProjectPosition = (project: MapProject) => {
    // Convert lat/lng to pixel position (simplified)
    const mapWidth = mapRef.current?.offsetWidth || 800
    const mapHeight = mapRef.current?.offsetHeight || 600

    // Africa bounds approximately
    const bounds = {
      north: 37,
      south: -35,
      east: 52,
      west: -18,
    }

    const x = ((project.lng - bounds.west) / (bounds.east - bounds.west)) * mapWidth
    const y = ((bounds.north - project.lat) / (bounds.north - bounds.south)) * mapHeight

    return { x: Math.max(0, Math.min(x, mapWidth)), y: Math.max(0, Math.min(y, mapHeight)) }
  }

  const formatBudget = (budget: number) => {
    if (budget >= 1000000) return `$${(budget / 1000000).toFixed(1)}M`
    if (budget >= 1000) return `$${(budget / 1000).toFixed(1)}K`
    return `$${budget}`
  }

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Interactive Project Map
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Badge variant="outline">
              <Layers className="w-3 h-3 mr-1" />
              Zoom: {zoom}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <div className="relative flex-grow">
          {/* Map Container */}
          <div
            ref={mapRef}
            className="w-full h-full bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border relative overflow-hidden"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%23e5e7eb' fillOpacity='0.3'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          >
            {/* Loading State */}
            {!mapLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading map...</p>
                </div>
              </div>
            )}

            {/* Africa Outline (Simplified) */}
            {mapLoaded && (
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="none" style={{ opacity: 0.3 }}>
                <path
                  d="M398.8,121.2c-16-14.8-44.1-13.2-60.1-13.2c-20.9,0-40.4,8.1-59.5,14.2c-13,4.2-25.7,9-38.9,12.2c-11.3,2.8-22.9,5.2-34.5,5.6c-21.7,0.8-43.2-6.1-63.8-1.3c-11.8,2.7-22,8.8-31.5,16.5c-9.1,7.3-17.5,16.1-21.9,27c-5.8,14.4-4.8,30.3,0.2,44.7c3.3,9.5,8.4,18.2,12.8,27.3c9,18.6,17.4,37.6,23,57.5c11,39.1,12.8,80.4,24.1,119.2c5.9,20.4,15.4,39.6,28.2,56.1c11.6,14.9,27.8,25.8,45.3,32.3c15,5.6,31,7.1,46.7,6.5c15.9-0.6,31.4-4.7,46.5-9.6c20.3-6.6,39.6-16.7,58.3-27.5c11.5-6.7,22.6-14,33.4-21.8c13.7-10,27-20.7,38.6-33.1c15.1-16.1,28-34.6,36.4-55.2c5.8-14.2,9.6-29.3,12.9-44.4c3.9-17.8,7-35.8,5.4-54.2c-1.3-14.7-7.3-28.5-15.6-40.6c-9.7-14-23.7-25-39.2-31.7c-13.4-5.8-27.9-7.9-42.3-8.6c-18.3-0.8-36.4,2.9-54,8.1C420.2,112.5,409.2,116.6,398.8,121.2z"
                  fill="#a7f3d0"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              </svg>
            )}

            {/* Project Markers */}
            {mapLoaded &&
              projects.map((project) => {
                const position = getProjectPosition(project)
                const isSelected = selectedProject?.id === project.id

                return (
                  <div
                    key={project.id}
                    className={`absolute cursor-pointer transition-all duration-200 ${
                      isSelected ? "scale-150 z-20" : "hover:scale-125 z-10"
                    }`}
                    style={{
                      left: `${position.x}px`,
                      top: `${position.y}px`,
                      transform: "translate(-50%, -50%)",
                    }}
                    onClick={() => onProjectSelect?.(project)}
                    title={project.title}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${
                        isSelected ? "ring-2 ring-blue-500" : ""
                      }`}
                      style={{ backgroundColor: project.color }}
                    />
                    {isSelected && (
                      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 min-w-48 z-30">
                        <h4 className="font-semibold text-sm">{project.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="text-xs">SDG {project.sdg_goal}</Badge>
                          <Badge variant="outline" className="text-xs">
                            {project.status}
                          </Badge>
                        </div>
                        {project.budget > 0 && (
                          <p className="text-xs text-gray-600 mt-1">Budget: {formatBudget(project.budget)}</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

            {/* Map Legend */}
            <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
              <h4 className="font-semibold text-sm mb-2">Project Status</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-xs">Confirmed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-xs">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-xs">Completed</span>
                </div>
              </div>
            </div>

            {/* Project Count */}
            <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2">
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{projects.length}</div>
                <div className="text-xs text-gray-600">Projects</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
