"use client"

import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, X, MapPin, User, Building } from "lucide-react"

import { mockReports, Report } from '@/data/mockReports';
import { mockUsers, MockUser } from '@/data/mockUsers';
import { mockOrganizations, Organization } from '@/data/mockOrganizations';

interface SearchResult {
  projects: Report[]
  users: MockUser[]
  organizations: Organization[]
}

interface SearchInterfaceProps {
  onProjectSelect?: (project: Report) => void
  onUserSelect?: (user: MockUser) => void
  onOrganizationSelect?: (org: Organization) => void;
}

export default function SearchInterface({ onProjectSelect, onUserSelect, onOrganizationSelect }: SearchInterfaceProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.length >= 2) {
      const debounceTimer = setTimeout(() => {
        performSearch()
      }, 300)

      return () => clearTimeout(debounceTimer)
    } else {
      setResults(null)
      setIsOpen(false)
    }
  }, [query])

  const performSearch = () => {
    setIsSearching(true);
    const lowerCaseQuery = query.toLowerCase();

    const filteredProjects = mockReports.filter(p =>
      p.title.toLowerCase().includes(lowerCaseQuery) ||
      p.description?.toLowerCase().includes(lowerCaseQuery)
    );

    const filteredUsers = mockUsers.filter(u =>
      u.name.toLowerCase().includes(lowerCaseQuery) ||
      u.organization?.toLowerCase().includes(lowerCaseQuery)
    );

    const filteredOrganizations = mockOrganizations.filter(o =>
      o.name.toLowerCase().includes(lowerCaseQuery)
    );

    setResults({
      projects: filteredProjects,
      users: filteredUsers,
      organizations: filteredOrganizations,
    });
    setIsOpen(true);
    setIsSearching(false);
  }

  const clearSearch = () => {
    setQuery("")
    setResults(null)
    setIsOpen(false)
  }

  const handleProjectClick = (project: Report) => {
    onProjectSelect?.(project)
    setIsOpen(false)
  }

  const handleUserClick = (user: MockUser) => {
    onUserSelect?.(user)
    setIsOpen(false)
  }
  
  const handleOrganizationClick = (org: Organization) => {
    onOrganizationSelect?.(org);
    setIsOpen(false);
  }

  const handleSearchSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim().length > 0) {
      e.preventDefault()
      setIsOpen(false)
      navigate(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  const getStatusColor = (status: Report['project_status']) => {
    switch (status) {
      case "in_progress":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "planned":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      case "completed":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200"
      case "stalled":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200"
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  const getRoleColor = (role: MockUser['role'] | Organization['type']) => {
    switch (role) {
      case "Government Official":
      case "government":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200"
      case "Company Representative":
      case "company":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200"
      case "NGO Member":
      case "ngo":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearchSubmit}
          placeholder="Search projects, users, organizations..."
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {isOpen && results && (
        <Card className="absolute top-12 left-0 right-0 z-50 max-h-96 overflow-y-auto shadow-lg">
          <CardContent className="p-0">
            {isSearching ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Searching...</p>
              </div>
            ) : (
              <div className="space-y-1">
                {results.projects.length > 0 && (
                  <div>
                    <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-700 border-b">
                      PROJECTS ({results.projects.length})
                    </div>
                    {results.projects.map((project) => (
                      <div
                        key={`project-${project.id}`}
                        className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                        onClick={() => handleProjectClick(project)}
                      >
                        <h4 className="font-medium text-sm">{project.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            SDG {project.sdg_goal}
                          </Badge>
                          <Badge className={`text-xs ${getStatusColor(project.project_status)}`}>{project.project_status.replace('_', ' ')}</Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {project.country_code}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {results.users.length > 0 && (
                  <div>
                    <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-700 border-b">
                      USERS ({results.users.length})
                    </div>
                    {results.users.map((user) => (
                      <div
                        key={`user-${user.id}`}
                        className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                        onClick={() => handleUserClick(user)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{user.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={`text-xs ${getRoleColor(user.role)}`}>{user.role}</Badge>
                              {user.organization && <span className="text-xs text-muted-foreground">{user.organization}</span>}
                              {user.country && <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {user.country}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {results.organizations.length > 0 && (
                  <div>
                    <div className="px-3 py-2 bg-gray-50 text-xs font-medium text-gray-700 border-b">
                      ORGANIZATIONS ({results.organizations.length})
                    </div>
                    {results.organizations.map((org) => (
                      <div
                        key={`org-${org.id}`}
                        className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                        onClick={() => handleOrganizationClick(org)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                            <Building className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div>
                            <h4 className="font-medium text-sm">{org.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={`text-xs ${getRoleColor(org.type)}`}>{org.type}</Badge>
                              <span className="text-xs text-muted-foreground">{org.projects_count} projects</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {org.country}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {results.projects.length === 0 && results.users.length === 0 && results.organizations.length === 0 && (
                  <div className="p-6 text-center text-muted-foreground">
                    <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No results found for "{query}"</p>
                    <p className="text-xs mt-1">Try different keywords or check spelling</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
