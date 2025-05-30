"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useParams, useRouter } from "next/navigation"
import { mockProjects, mockBtsImages } from "@/lib/project-data"
import { Button } from "@/components/ui/button"

export default function ClientEditProjectPage() {
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const id = params.id as string

  useEffect(() => {
    async function fetchProject() {
      try {
        setLoading(true)
        const { data, error } = await supabase.from("projects").select("*").eq("id", id).single()

        if (error) {
          console.error("Error fetching project:", error)
          // Try to find in mock data
          const mockProject = mockProjects.find((p) => p.id === id)
          if (mockProject) {
            setProject({
              ...mockProject,
              bts_images: mockBtsImages.filter((img) => img.project_id === id),
            })
            setError("Using mock data - database connection failed")
          } else {
            setError("Project not found")
          }
        } else {
          // Get BTS images
          const { data: btsImages, error: btsError } = await supabase
            .from("bts_images")
            .select("*")
            .eq("project_id", id)

          if (btsError) {
            console.error("Error fetching BTS images:", btsError)
          }

          setProject({
            ...data,
            bts_images: btsImages || [],
          })
        }
      } catch (err) {
        console.error("Error in fetchProject:", err)
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [id, supabase])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/projects"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Projects
          </Link>
        </div>

        <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
          <p className="text-gray-300">{error || "Project not found"}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/projects"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Projects
        </Link>
      </div>

      <h1 className="text-3xl font-serif mb-8">Edit Project: {project.title}</h1>

      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl mb-4">Project Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400">Title</p>
            <p>{project.title}</p>
          </div>
          <div>
            <p className="text-gray-400">Category</p>
            <p>{project.category}</p>
          </div>
          <div>
            <p className="text-gray-400">Type</p>
            <p>{project.type}</p>
          </div>
          <div>
            <p className="text-gray-400">Role</p>
            <p>{project.role}</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-gray-400">Description</p>
          <p>{project.description}</p>
        </div>

        <div className="mt-4">
          <p className="text-gray-400">Special Notes</p>
          <p>{project.special_notes}</p>
        </div>

        <div className="mt-6">
          <Button onClick={() => alert("Edit functionality coming soon. This is a read-only view for now.")}>
            Edit Project
          </Button>
        </div>
      </div>

      <div className="mt-12 border-t border-gray-800 pt-8">
        <h2 className="text-2xl font-serif mb-6">Behind the Scenes Images</h2>
        {project.bts_images && project.bts_images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {project.bts_images.map((image: any) => (
              <div key={image.id} className="relative aspect-square">
                <img
                  src={image.image_url || "/placeholder.svg"}
                  alt={image.caption || "Behind the scenes"}
                  className="object-cover w-full h-full rounded-md"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400">No behind the scenes images found.</p>
        )}
      </div>
    </div>
  )
}
