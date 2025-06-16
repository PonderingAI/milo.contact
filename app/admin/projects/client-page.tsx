"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Plus, Search, Filter, X, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ProjectCard } from "@/components/project-card"
import type { Project } from "@/lib/project-data"

export default function ClientProjectsPage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedRole, setSelectedRole] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [privacyFilter, setPrivacyFilter] = useState<"all" | "public" | "private">("all")

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in?redirect_url=/admin/projects")
    }
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchProjects()
    }
  }, [isLoaded, isSignedIn])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      
      const response = await fetch("/api/admin/projects")
      
      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`)
      }

      const { projects: data } = await response.json()

      if (data) {
        setProjects(data)
        setFilteredProjects(data)

        // Extract unique categories and roles
        const uniqueCategories = Array.from(new Set(data.map((p) => p.category).filter(Boolean)))
        const uniqueRoles = Array.from(
          new Set(data.flatMap((p) => (p.role ? p.role.split(",").map((r) => r.trim()) : [])).filter(Boolean)),
        )

        setCategories(uniqueCategories as string[])
        setRoles(uniqueRoles as string[])
      }
    } catch (err) {
      console.error("Error fetching projects:", err)
      setError("Failed to load projects. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Apply filters when dependencies change
  useEffect(() => {
    let result = projects

    // Apply category filter
    if (selectedCategory) {
      result = result.filter((project) => project.category?.toLowerCase() === selectedCategory.toLowerCase())
    }

    // Apply role filter
    if (selectedRole) {
      result = result.filter((project) => project.role?.toLowerCase().includes(selectedRole.toLowerCase()))
    }

    // Apply privacy filter using both is_public and project_date
    const now = new Date()
    if (privacyFilter === "public") {
      result = result.filter((project) => {
        // Project is public if is_public is not false AND (no project_date OR project_date is today or in past)
        const isPublicFlag = project.is_public !== false
        const isProjectDatePublic = !project.project_date || new Date(project.project_date) <= now
        return isPublicFlag && isProjectDatePublic
      })
    } else if (privacyFilter === "private") {
      result = result.filter((project) => {
        // Project is private if is_public is false OR project_date is in future
        const isPrivateFlag = project.is_public === false
        const hasPrivateDate = project.project_date && new Date(project.project_date) > now
        return isPrivateFlag || hasPrivateDate
      })
    }

    // Apply search filter
    if (searchQuery) {
      result = result.filter((project) => {
        const searchableText = [project.title, project.description, project.category, project.role]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()

        return searchableText.includes(searchQuery.toLowerCase())
      })
    }

    setFilteredProjects(result)
  }, [projects, selectedCategory, selectedRole, searchQuery, privacyFilter])

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === selectedCategory ? "" : category)
  }

  const handleRoleChange = (role: string) => {
    setSelectedRole(role === selectedRole ? "" : role)
  }

  const clearFilters = () => {
    setSelectedCategory("")
    setSelectedRole("")
    setSearchQuery("")
    setPrivacyFilter("all")
  }

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  if (!isSignedIn) {
    return <div>Please sign in to access this page.</div>
  }

  return (
    <>
      <div className="container mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold">Projects</h1>
          <div className="flex gap-2">
            <Button onClick={() => router.push("/admin/projects/new")}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* Search Input - simplified without box */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-transparent border-gray-800 focus:border-gray-700"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Privacy Filter Toggles */}
            <div className="flex items-center gap-2">
              <Button
                variant={privacyFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setPrivacyFilter("all")}
              >
                All
              </Button>
              <Button
                variant={privacyFilter === "public" ? "default" : "outline"}
                size="sm"
                onClick={() => setPrivacyFilter("public")}
              >
                Public
              </Button>
              <Button
                variant={privacyFilter === "private" ? "default" : "outline"}
                size="sm"
                onClick={() => setPrivacyFilter("private")}
              >
                Private
              </Button>
            </div>

            {/* More Filters Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 max-h-80 overflow-y-auto">
                {/* Categories */}
                {categories.length > 0 && (
                  <>
                    <DropdownMenuLabel>Categories</DropdownMenuLabel>
                    {categories.map((category) => (
                      <DropdownMenuCheckboxItem
                        key={category}
                        checked={selectedCategory === category}
                        onCheckedChange={() => handleCategoryChange(category)}
                      >
                        {category}
                      </DropdownMenuCheckboxItem>
                    ))}
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* Roles */}
                {roles.length > 0 && (
                  <>
                    <DropdownMenuLabel>Roles</DropdownMenuLabel>
                    {roles.map((role) => (
                      <DropdownMenuCheckboxItem
                        key={role}
                        checked={selectedRole === role}
                        onCheckedChange={() => handleRoleChange(role)}
                      >
                        {role}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Clear Filters Button */}
            {(selectedCategory || selectedRole || searchQuery || privacyFilter !== "all") && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>

          {/* Selected Filters Display */}
          {(selectedCategory || selectedRole) && (
            <div className="flex flex-wrap gap-2">
              {selectedCategory && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-red-900/50"
                  onClick={() => setSelectedCategory("")}
                >
                  {selectedCategory} ×
                </Badge>
              )}
              {selectedRole && (
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-red-900/50"
                  onClick={() => setSelectedRole("")}
                >
                  {selectedRole} ×
                </Badge>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading projects...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-800 text-white p-4 rounded-md">
            <p>{error}</p>
            <button onClick={fetchProjects} className="mt-2 text-sm underline">
              Try again
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            {projects.length === 0 ? (
              <>
                <p className="text-gray-400 mb-4">No projects found. Create your first project!</p>
                <Button onClick={() => router.push("/admin/projects/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </>
            ) : (
              <>
                <p className="text-gray-400 mb-4">No projects match your search criteria.</p>
                <button onClick={clearFilters} className="text-blue-400 hover:text-blue-300 underline">
                  Clear filters
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                title={project.title}
                category={project.category}
                role={project.role}
                image={project.image}
                project_date={project.project_date}
                is_public={project.is_public}
                isAdmin={true}
                onEdit={() => router.push(`/admin/projects/${project.id}/edit`)}
                onDelete={fetchProjects}
                link={`/projects/${project.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
