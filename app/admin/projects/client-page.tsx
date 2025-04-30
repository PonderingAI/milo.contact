"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2, Plus, Edit, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { mockProjects } from "@/lib/project-data"

export default function ClientProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true)
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
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif">Projects</h1>
        <Link href="/admin/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
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
        <div className="text-center py-12 bg-gray-900/50 rounded-lg">
          <p className="text-gray-400 mb-4">No projects found</p>
          <Link href="/admin/projects/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Project
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800">
              <div className="aspect-video relative">
                <img
                  src={project.image || "/placeholder.svg"}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-medium mb-1">{project.title}</h3>
                <p className="text-gray-400 text-sm mb-3">
                  {project.category} • {project.role}
                </p>
                <div className="flex justify-between items-center">
                  <Link href={`/projects/${project.id}`} target="_blank">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </Link>
                  <Link href={`/admin/edit-project/${project.id}`}>
                    <Button size="sm">
                      <Edit className="h-4 w-4 mr-1" />
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
