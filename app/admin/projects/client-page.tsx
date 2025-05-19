"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Search, Filter, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ProjectCard } from "@/components/project-card"
import TagFilter from "@/components/tag-filter"
import AdminCheck from "@/components/admin/admin-check"
import { getSupabaseBrowserClient } from "@/lib/supabase"
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
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in?redirect_url=/admin/projects")
    }
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    if (isSignedIn) {
      fetchProjects()
    }
  }, [isSignedIn])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      const supabase = getSupabaseBrowserClient()
      
      // Check if Supabase client is properly initialized
      if (!supabase) {
        throw new Error('Supabase client initialization failed')
      }

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }

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
  }, [projects, selectedCategory, selectedRole, searchQuery])

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
  }

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  if (!isSignedIn) {
    return <div>Please sign in to access this page.</div>
  }

  return (
    <AdminCheck>
      <div className="container mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold">Projects</h1>
          <div className="flex gap-2">
            <Button onClick={() => setShowFilters(!showFilters)} variant="outline" className="border-gray-700">
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            <Button onClick={() => router.push("/admin/projects/new")}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        <Card className="bg-gray-900 border-gray-800 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 bg-gray-800 border-gray-700"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {showFilters && (
                <div className="space-y-4 pt-2">
                  <TagFilter
                    title="Categories"
                    tags={categories}
                    selectedTag={selectedCategory}
                    onChange={handleCategoryChange}
                  />

                  <TagFilter title="Roles" tags={roles} selectedTag={selectedRole} onChange={handleRoleChange} />

                  {(selectedCategory || selectedRole || searchQuery) && (
                    <div className="flex justify-end">
                      <button onClick={clearFilters} className="text-sm text-gray-400 hover:text-white underline">
                        Clear all filters
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

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
                project={project}
                isAdmin={true}
                onEdit={() => router.push(`/admin/projects/${project.id}/edit`)}
              />
            ))}
          </div>
        )}
      </div>
    </AdminCheck>
  )
}
