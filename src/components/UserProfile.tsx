
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, MapPin, Calendar, Award, TrendingUp } from "lucide-react"
import { MockUser } from "@/data/mockUsers"
import { Report, mockReports } from "@/data/mockReports"
import { UserRole } from "@/contexts/UserRoleContext"

interface UserProfileProps {
  user: MockUser
  onLogout: () => void
}

export default function UserProfile({ user, onLogout }: UserProfileProps) {
  const [userProjects, setUserProjects] = useState<Report[]>([])
  const [userStats, setUserStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    totalVerifications: 0,
    averageRating: 4.2, // Mocked for now
  })

  useEffect(() => {
    if (user) {
      let projects: Report[] = [];
      if (user.country) {
        // Map 3-letter country code (GHA) to 2-letter (GH)
        const countryCode = user.country.substring(0, 2).toUpperCase();
        projects = mockReports.filter(p => p.country_code === countryCode);
      }
      // If no country or no projects in country, show some projects for demo
      if (projects.length === 0) {
        projects = mockReports.slice(0, 5);
      }
      
      setUserProjects(projects);

      // Calculate stats from projects
      setUserStats({
        totalProjects: projects.length,
        completedProjects: projects.filter(p => p.project_status === 'completed').length,
        totalVerifications: projects.reduce((acc, p) => acc + (p.verifications?.length || 0), 0),
        averageRating: 4.2, // Mocked
      })
    }
  }, [user])

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case "Government Official": return "bg-blue-100 text-blue-800"
      case "Company Representative": return "bg-purple-100 text-purple-800"
      case "NGO Member": return "bg-green-100 text-green-800"
      case "Platform Admin": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: Report['project_status']) => {
    switch (status) {
      case "in_progress": return "bg-green-100 text-green-800"
      case "planned": return "bg-yellow-100 text-yellow-800"
      case "completed": return "bg-blue-100 text-blue-800"
      case "stalled": return "bg-orange-100 text-orange-800"
      case "cancelled": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-green-500 rounded-full flex items-center justify-center shrink-0">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">{user.name}</CardTitle>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                  {user.verified ? (
                    <Badge variant="outline" className="border-green-600 text-green-600">Verified</Badge>
                  ) : (
                    <Badge variant="outline" className="border-yellow-500 text-yellow-600">Pending</Badge>
                  )}
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={onLogout} className="w-full sm:w-auto">
              Logout
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{userStats.totalProjects}</div>
              <div className="text-sm text-muted-foreground">Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{userStats.completedProjects}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{userStats.totalVerifications}</div>
              <div className="text-sm text-muted-foreground">Verifications</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{userStats.averageRating.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Avg Rating</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-flex">
          <TabsTrigger value="projects">My Projects</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          {user.role === "Company Representative" && <TabsTrigger value="esg">ESG Targets</TabsTrigger>}
          {user.role === "Government Official" && <TabsTrigger value="dashboard">Dashboard</TabsTrigger>}
        </TabsList>

        <TabsContent value="projects">
          <Card>
            <CardHeader><CardTitle>My Projects</CardTitle></CardHeader>
            <CardContent>
              {userProjects.length > 0 ? (
                <div className="space-y-4">
                  {userProjects.map((project: Report) => (
                    <div key={project.id} className="border rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex-grow">
                          <h3 className="font-semibold">{project.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{project.country_code}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(project.submitted_at)}</span>
                            <span className="flex items-center gap-1"><Award className="w-4 h-4" />SDG {project.sdg_goal}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge className={getStatusColor(project.project_status)}>
                            {project.project_status.replace('_', ' ')}
                          </Badge>
                          <div className="text-sm text-muted-foreground mt-1">{project.verification_score}% verified</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No projects found for your profile.</p>
                  <p className="text-sm">You can submit a new report to get started.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium">Project verified</p>
                  <p className="text-sm text-muted-foreground">Your "Clean Water Project" was confirmed by the community</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Award className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">New verification</p>
                  <p className="text-sm text-muted-foreground">You verified "Solar Panel Installation" project</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {user.role === "Company Representative" && (
          <TabsContent value="esg">
            <Card>
              <CardHeader><CardTitle>ESG Targets & Progress</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Clean Water Access</h3>
                    <Badge>SDG 6</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span>Progress</span><span>75%</span></div>
                    <div className="w-full bg-muted rounded-full h-2"><div className="bg-primary h-2 rounded-full" style={{ width: "75%" }}></div></div>
                  </div>
                </div>
              </TabsContent>
            </Card>
          </TabsContent>
        )}

        {user.role === "Government Official" && (
          <TabsContent value="dashboard">
            <Card>
              <CardHeader><CardTitle>Government Dashboard</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">234</div>
                    <div className="text-sm text-muted-foreground">Total Projects</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">$45.6M</div>
                    <div className="text-sm text-muted-foreground">Total Budget</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
