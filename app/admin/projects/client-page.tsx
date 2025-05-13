"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, Search, Eye, EyeOff, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"

export default function ProjectsClientPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      setProjects(data || [])
    } catch (err: any) {
      console.error("Error fetching projects:", err)
      setError(err.message || "Failed to load projects")
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter((project) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      project.title?.toLowerCase().includes(searchLower) ||
      project.category?.toLowerCase().includes(searchLower) ||
      project.type?.toLowerCase().includes(searchLower) ||
      project.role?.toLowerCase().includes(searchLower)
    )
  })

  // Helper function to determine project visibility status
  const getVisibilityStatus = (project) => {
    if (project.published) {
      return { status: "public", icon: <Eye className="h-4 w-4" />, label: "Public" }
    } else if (project.scheduled_publish_date) {
      const scheduledDate = new Date(project.scheduled_publish_date)
      const now = new Date()
      if (scheduledDate <= now) {
        return { status: "public", icon: <Eye className="h-4 w-4" />, label: "Public" }
      } else {
        return {
          status: "scheduled",
          icon: <Clock className="h-4 w-4" />,
          label: `Scheduled for ${scheduledDate.toLocaleDateString()}`,
        }
      }
    } else {
      return { status: "private", icon: <EyeOff className="h-4 w-4" />, label: "Private" }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Link href="/admin/projects/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search projects..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
          <p className="text-red-400">{error}</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-700 rounded-lg">
          <p className="text-gray-400">No projects found</p>
          {searchQuery && (
            <p className="text-gray-500 mt-2">
              Try adjusting your search query or{" "}
              <button className="text-blue-500 hover:underline" onClick={() => setSearchQuery("")}>
                clear the search
              </button>
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredProjects.map((project) => {
            const visibility = getVisibilityStatus(project)
            return (
              <Link
                key={project.id}
                href={`/admin/edit-project/${project.id}`}
                className="block bg-gray-900 hover:bg-gray-800 rounded-lg p-4 transition-colors"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-32 h-20 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                    {project.image ? (
                      <img
                        src={project.image || "/placeholder.svg"}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">No image</div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <h2 className="text-lg font-medium">{project.title}</h2>
                      <div className="flex flex-wrap gap-2">
                        {project.category && (
                          <Badge variant="outline" className="text-xs">
                            {project.category}
                          </Badge>
                        )}
                        {project.type && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {project.type}
                          </Badge>
                        )}
                        <Badge
                          variant={
                            visibility.status === "public"
                              ? "default"
                              : visibility.status === "scheduled"
                                ? "secondary"
                                : "destructive"
                          }
                          className="text-xs flex items-center gap-1"
                        >
                          {visibility.icon}
                          {visibility.label}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm mt-1 line-clamp-2">{project.description || "No description"}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                      {project.role && <span>Role: {project.role}</span>}
                      {project.project_date && <span>Date: {new Date(project.project_date).toLocaleDateString()}</span>}
                      <span>Created: {new Date(project.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
