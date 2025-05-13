"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2, Plus, Edit, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { mockProjects } from "@/lib/project-data"

export default function ProjectsClientPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching projects:", error)
          setProjects(mockProjects)
          setError("Using mock data - database connection failed")
        } else {
          setProjects(data.length > 0 ? data : mockProjects)
        }
      } catch (err) {
        console.error("Error in fetchProjects:", err)
        setProjects(mockProjects)
        setError("Failed to load projects")
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-serif mb-2">Projects</h1>
          <p className="text-gray-400">Manage your portfolio projects</p>
        </div>
        <Link href="/admin/projects/new">
          <Button>
            <Plus size={16} className="mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4 mb-6">
          <p className="text-yellow-400">{error}</p>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-12 bg-gray-900 rounded-lg">
          <h3 className="text-xl font-medium mb-2">No projects found</h3>
          <p className="text-gray-400 mb-6">Get started by creating your first project</p>
          <Link href="/admin/projects/new">
            <Button>
              <Plus size={16} className="mr-2" />
              Create Project
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-gray-900 rounded-lg overflow-hidden">
              <div className="relative aspect-video">
                <img
                  src={project.image || "/placeholder.svg"}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                  <h3 className="text-lg font-medium text-white">{project.title}</h3>
                  <p className="text-sm text-gray-300">
                    {project.category} • {project.role}
                  </p>
                </div>
              </div>
              <div className="p-4 flex justify-between items-center">
                <div className="text-sm text-gray-400">
                  <span className="capitalize">{project.type}</span>
                </div>
                <div className="flex gap-2">
                  <Link href={`/projects/${project.id}`} target="_blank">
                    <Button variant="ghost" size="icon">
                      <ExternalLink size={16} />
                      <span className="sr-only">View</span>
                    </Button>
                  </Link>
                  <Link href={`/admin/edit-project/${project.id}`}>
                    <Button variant="outline" size="sm">
                      <Edit size={16} className="mr-1" />
                      Edit
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
