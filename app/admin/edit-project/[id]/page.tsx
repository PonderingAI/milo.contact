"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2, ArrowLeft, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockProjects } from "@/lib/project-data"
import ImageUploader from "@/components/admin/image-uploader"
import Link from "next/link"

export default function EditProjectPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const supabase = createClientComponentClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [project, setProject] = useState<any>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    type: "directed",
    role: "",
    image: "",
    video_url: "",
    description: "",
    special_notes: "",
  })

  useEffect(() => {
    async function fetchProject() {
      try {
        setLoading(true)
        setError(null)

        // Try to get from Supabase
        const { data, error } = await supabase.from("projects").select("*").eq("id", id).single()

        if (error) {
          console.error("Supabase error:", error)
          // Try to find in mock data as fallback
          const mockProject = mockProjects.find((p) => p.id === id)
          if (mockProject) {
            setProject(mockProject)
            setFormData({
              title: mockProject.title || "",
              category: mockProject.category || "",
              type: mockProject.type || "directed",
              role: mockProject.role || "",
              image: mockProject.image || "",
              video_url: mockProject.video_url || "",
              description: mockProject.description || "",
              special_notes: mockProject.special_notes || "",
            })
            setError("Using mock data - database connection failed")
          } else {
            setError("Project not found")
          }
        } else {
          setProject(data)
          setFormData({
            title: data.title || "",
            category: data.category || "",
            type: data.type || "directed",
            role: data.role || "",
            image: data.image || "",
            video_url: data.video_url || "",
            description: data.description || "",
            special_notes: data.special_notes || "",
          })
        }
      } catch (err) {
        console.error("Error fetching project:", err)
        setError("Failed to load project")
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [id, supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = (url: string) => {
    setFormData((prev) => ({ ...prev, image: url }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      // Validate form
      if (!formData.title) {
        setError("Title is required")
        return
      }

      if (!formData.image) {
        setError("Image is required")
        return
      }

      // Update in Supabase
      const { error } = await supabase.from("projects").update(formData).eq("id", id)

      if (error) {
        throw error
      }

      // Success
      alert("Project updated successfully!")
      router.push("/admin/projects")
    } catch (err: any) {
      console.error("Error saving project:", err)
      setError(err.message || "Failed to save project")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this project?")) {
      return
    }

    try {
      setSaving(true)

      const { error } = await supabase.from("projects").delete().eq("id", id)

      if (error) {
        throw error
      }

      alert("Project deleted successfully!")
      router.push("/admin/projects")
    } catch (err: any) {
      console.error("Error deleting project:", err)
      setError(err.message || "Failed to delete project")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!project && !loading) {
    return (
      <div className="p-6">
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error</h2>
          <p>{error || "Project not found"}</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push("/admin/projects")}>
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative pb-20">
      {/* Header with back button and save button */}
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm p-4 flex justify-between items-center mb-6">
        <Link href="/admin/projects" className="flex items-center gap-2 text-gray-300 hover:text-white">
          <ArrowLeft size={18} />
          <span>Back to Projects</span>
        </Link>

        <div className="flex gap-2">
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={saving}>
            <Trash2 size={16} className="mr-1" />
            Delete
          </Button>

          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? (
              <>
                <Loader2 size={16} className="mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-1" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Project preview with editable fields */}
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif mb-2">Edit Project</h1>
          <p className="text-gray-400">Make changes to your project and click Save Changes when done.</p>
        </div>

        {/* Project header section */}
        <div className="mb-12">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
            <Input
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="text-2xl font-serif py-3"
              placeholder="Project Title"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
              <Input
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g. Short Film, Music Video"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
              <Input name="role" value={formData.role} onChange={handleChange} placeholder="e.g. Director, 1st AC" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
              <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="directed">Directed</SelectItem>
                  <SelectItem value="camera">Camera</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="photography">Photography</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Video URL</label>
              <Input
                name="video_url"
                value={formData.video_url}
                onChange={handleChange}
                placeholder="YouTube or Vimeo URL"
              />
              <p className="text-xs text-gray-500 mt-1">Supports YouTube and Vimeo links</p>
            </div>
          </div>
        </div>

        {/* Cover image */}
        <div className="mb-12">
          <label className="block text-sm font-medium text-gray-400 mb-2">Cover Image</label>
          <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-900 mb-2">
            {formData.image ? (
              <img
                src={formData.image || "/placeholder.svg"}
                alt={formData.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">No image selected</div>
            )}
          </div>

          <ImageUploader currentImage={formData.image} onImageUploaded={handleImageUpload} folder="projects" />
        </div>

        {/* Description */}
        <div className="mb-12">
          <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
          <Textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the project..."
            className="min-h-[150px]"
          />
        </div>

        {/* Special notes */}
        <div className="mb-12">
          <label className="block text-sm font-medium text-gray-400 mb-1">Special Notes</label>
          <Textarea
            name="special_notes"
            value={formData.special_notes}
            onChange={handleChange}
            placeholder="Any special notes about this project..."
            className="min-h-[150px]"
          />
        </div>

        {/* Bottom save button */}
        <div className="flex justify-end gap-4 mt-8">
          <Button variant="outline" onClick={() => router.push("/admin/projects")}>
            Cancel
          </Button>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
