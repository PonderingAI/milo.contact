"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { PlusCircle, Edit, Trash2, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { mockProjects } from "@/lib/project-data"

export default function ClientProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true)
        const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching projects:", error)
          setProjects(mockProjects)
          setError("Failed to fetch projects from database. Using mock data instead.")
        } else {
          setProjects(data.length > 0 ? data : mockProjects)
        }
      } catch (err) {
        console.error("Error in fetchProjects:", err)
        setProjects(mockProjects)
        setError("An unexpected error occurred. Using mock data instead.")
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [supabase])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return

    try {
      const { error } = await supabase.from("projects").delete().eq("id", id)

      if (error) {
        console.error("Error deleting project:", error)
        alert("Failed to delete project")
      } else {
        setProjects(projects.filter((p) => p.id !== id))
      }
    } catch (err) {
      console.error("Error in handleDelete:", err)
      alert("An unexpected error occurred")
    }
  }

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
        <Button asChild>
          <Link href="/admin/projects/new">
            <PlusCircle className="mr-2 h-4 w-4" /> New Project
          </Link>
        </Button>
      </div>

      {error && (
        <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4 mb-6">
          <p className="text-yellow-400">{error}</p>
        </div>
      )}

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="overflow-hidden">
              <div className="relative h-48">
                <Image
                  src={project.image || "/placeholder.svg?height=200&width=300"}
                  alt={project.title}
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">{project.title}</h3>
                    <p className="text-sm text-gray-400">
                      {project.category} • {project.role}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/admin/projects/${project.id}/edit-client`)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(project.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">No projects found</p>
          <Button asChild>
            <Link href="/admin/projects/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Project
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
