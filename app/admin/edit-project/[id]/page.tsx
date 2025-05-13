"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2, ArrowLeft, Save, Trash2, Plus, X, Edit, Eye, EyeOff, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockProjects } from "@/lib/project-data"
import ImageUploader from "@/components/admin/image-uploader"
import Link from "next/link"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

interface BtsImage {
  id?: string
  project_id: string
  image_url: string
  caption?: string
  size?: "small" | "medium" | "large"
  aspect_ratio?: "square" | "portrait" | "landscape"
}

export default function EditProjectPage() {
  const params = useParams()
  const router = useRouter()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const supabase = createClientComponentClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [project, setProject] = useState<any>(null)
  const [btsImages, setBtsImages] = useState<BtsImage[]>([])
  const [showAddBtsForm, setShowAddBtsForm] = useState(false)
  const [editingBtsId, setEditingBtsId] = useState<string | null>(null)

  // Visibility state
  const [visibilityType, setVisibilityType] = useState<"public" | "private" | "scheduled">("public")
  const [scheduledDate, setScheduledDate] = useState<string>("")
  const [scheduledTime, setScheduledTime] = useState<string>("12:00")

  // New BTS image form state
  const [newBtsImage, setNewBtsImage] = useState<BtsImage>({
    project_id: id,
    image_url: "",
    caption: "",
    size: "medium",
    aspect_ratio: "landscape",
  })

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
    project_date: "",
    published: true,
    scheduled_publish_date: null as string | null,
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
              project_date: mockProject.project_date || "",
              published: true,
              scheduled_publish_date: null,
            })

            // Get mock BTS images
            const mockBts = mockProjects
              .filter((p) => p.id === id && p.bts_images)
              .flatMap((p) => p.bts_images || [])
              .map((img) => ({
                id: `mock-${Math.random().toString(36).substring(2, 9)}`,
                project_id: id,
                image_url: img,
                caption: "Mock BTS image",
                size: "medium",
                aspect_ratio: "landscape",
              }))

            setBtsImages(mockBts)
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
            project_date: data.project_date || "",
            published: data.published !== false, // Default to true if not set
            scheduled_publish_date: data.scheduled_publish_date || null,
          })

          // Set visibility type based on project data
          if (data.published === false) {
            if (data.scheduled_publish_date) {
              setVisibilityType("scheduled")
              const date = new Date(data.scheduled_publish_date)
              setScheduledDate(date.toISOString().split("T")[0])
              setScheduledTime(date.toTimeString().substring(0, 5))
            } else {
              setVisibilityType("private")
            }
          } else {
            setVisibilityType("public")
          }

          try {
            // Fetch BTS images
            const { data: btsData, error: btsError } = await supabase
              .from("bts_images")
              .select("*")
              .eq("project_id", id)
              .order("created_at", { ascending: true })

            if (btsError) {
              console.error("Error fetching BTS images:", btsError)
            } else {
              setBtsImages(btsData || [])
            }
          } catch (btsErr) {
            console.error("Failed to fetch BTS images:", btsErr)
            // Continue without BTS images
          }
        }
      } catch (err) {
        console.error("Error fetching project:", err)
        setError("Failed to load project")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchProject()
    }
  }, [id, supabase])

  // Update form data when visibility type changes
  useEffect(() => {
    if (visibilityType === "public") {
      setFormData((prev) => ({
        ...prev,
        published: true,
        scheduled_publish_date: null,
      }))
    } else if (visibilityType === "private") {
      setFormData((prev) => ({
        ...prev,
        published: false,
        scheduled_publish_date: null,
      }))
    } else if (visibilityType === "scheduled") {
      // Only update if we have a valid date and time
      if (scheduledDate) {
        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`)
        setFormData((prev) => ({
          ...prev,
          published: false,
          scheduled_publish_date: scheduledDateTime.toISOString(),
        }))
      }
    }
  }, [visibilityType, scheduledDate, scheduledTime])

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
        setSaving(false)
        return
      }

      if (!formData.image) {
        setError("Image is required")
        setSaving(false)
        return
      }

      // Validate scheduled date if using scheduled visibility
      if (visibilityType === "scheduled") {
        if (!scheduledDate) {
          setError("Please select a publication date")
          setSaving(false)
          return
        }

        const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`)
        if (isNaN(scheduledDateTime.getTime())) {
          setError("Invalid publication date or time")
          setSaving(false)
          return
        }
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

      // First delete BTS images
      try {
        await supabase.from("bts_images").delete().eq("project_id", id)
      } catch (btsErr) {
        console.error("Error deleting BTS images:", btsErr)
        // Continue with project deletion
      }

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

  // BTS Image functions
  const handleBtsImageUpload = (url: string) => {
    setNewBtsImage((prev) => ({ ...prev, image_url: url }))
  }

  const handleBtsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewBtsImage((prev) => ({ ...prev, [name]: value }))
  }

  const handleBtsSelectChange = (name: string, value: string) => {
    setNewBtsImage((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddBtsImage = async () => {
    if (!newBtsImage.image_url) {
      alert("Please upload an image")
      return
    }

    try {
      // Check if bts_images table exists
      const { error: tableCheckError } = await supabase.from("bts_images").select("id").limit(1)

      if (tableCheckError) {
        // Table doesn't exist, create it
        console.error("BTS images table doesn't exist:", tableCheckError)

        // Add to state anyway (will be lost on refresh)
        const mockId = `temp-${Math.random().toString(36).substring(2, 9)}`
        setBtsImages((prev) => [...prev, { ...newBtsImage, id: mockId }])

        alert("BTS images will be displayed but not saved permanently until the database is set up.")
      } else {
        // Table exists, insert data
        const { data, error } = await supabase
          .from("bts_images")
          .insert([{ ...newBtsImage, project_id: id }])
          .select()

        if (error) throw error

        // Add to state
        setBtsImages((prev) => [...prev, data[0]])
      }

      // Reset form
      setNewBtsImage({
        project_id: id,
        image_url: "",
        caption: "",
        size: "medium",
        aspect_ratio: "landscape",
      })

      setShowAddBtsForm(false)
    } catch (err: any) {
      console.error("Error adding BTS image:", err)
      alert(`Failed to add image: ${err.message}`)
    }
  }

  const handleDeleteBtsImage = async (btsId: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return

    try {
      // If it's a mock ID (starts with 'mock-' or 'temp-'), just remove from state
      if (btsId.startsWith("mock-") || btsId.startsWith("temp-")) {
        setBtsImages((prev) => prev.filter((img) => img.id !== btsId))
        return
      }

      const { error } = await supabase.from("bts_images").delete().eq("id", btsId)

      if (error) throw error

      // Remove from state
      setBtsImages((prev) => prev.filter((img) => img.id !== btsId))
    } catch (err: any) {
      console.error("Error deleting BTS image:", err)
      alert(`Failed to delete image: ${err.message}`)
    }
  }

  const handleUpdateBtsImage = async (btsId: string) => {
    const imageToUpdate = btsImages.find((img) => img.id === btsId)
    if (!imageToUpdate) return

    try {
      // If it's a mock ID (starts with 'mock-' or 'temp-'), just update state
      if (btsId.startsWith("mock-") || btsId.startsWith("temp-")) {
        setEditingBtsId(null)
        return
      }

      const { error } = await supabase
        .from("bts_images")
        .update({
          caption: imageToUpdate.caption,
          size: imageToUpdate.size,
          aspect_ratio: imageToUpdate.aspect_ratio,
        })
        .eq("id", btsId)

      if (error) throw error

      setEditingBtsId(null)
    } catch (err: any) {
      console.error("Error updating BTS image:", err)
      alert(`Failed to update image: ${err.message}`)
    }
  }

  const handleBtsImageChange = (id: string, field: string, value: string) => {
    setBtsImages((images) => images.map((img) => (img.id === id ? { ...img, [field]: value } : img)))
  }

  // Get min date for scheduled publishing (today)
  const today = new Date().toISOString().split("T")[0]

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

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Project Date</label>
              <Input
                type="date"
                name="project_date"
                value={formData.project_date}
                onChange={handleChange}
                placeholder="Project date"
              />
            </div>
          </div>
        </div>

        {/* Visibility section */}
        <div className="mb-12">
          <h2 className="text-xl font-medium mb-4">Visibility</h2>
          <Card>
            <CardContent className="pt-6">
              <RadioGroup
                value={visibilityType}
                onValueChange={(value) => setVisibilityType(value as "public" | "private" | "scheduled")}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="public" id="visibility-public" />
                  <Label htmlFor="visibility-public" className="flex items-center cursor-pointer">
                    <Eye className="h-4 w-4 mr-2 text-green-500" />
                    <span>Public (visible to everyone)</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="private" id="visibility-private" />
                  <Label htmlFor="visibility-private" className="flex items-center cursor-pointer">
                    <EyeOff className="h-4 w-4 mr-2 text-red-500" />
                    <span>Private (only visible to admins)</span>
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="scheduled" id="visibility-scheduled" />
                  <Label htmlFor="visibility-scheduled" className="flex items-center cursor-pointer">
                    <Clock className="h-4 w-4 mr-2 text-blue-500" />
                    <span>Scheduled publication</span>
                  </Label>
                </div>
              </RadioGroup>

              {visibilityType === "scheduled" && (
                <div className="pt-4 mt-4 border-t border-gray-800">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Publication Date</label>
                      <Input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={today}
                        className="border-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">Publication Time</label>
                      <Input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="border-gray-700"
                      />
                    </div>
                  </div>

                  {scheduledDate && scheduledTime && (
                    <div className="mt-2 text-xs text-gray-400">
                      Project will be published on {new Date(`${scheduledDate}T${scheduledTime}:00`).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
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

        {/* BTS Images Section */}
        <div className="mt-16 mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-serif">Behind the Scenes Images</h2>
            <Button onClick={() => setShowAddBtsForm(!showAddBtsForm)} variant="outline" size="sm">
              {showAddBtsForm ? (
                <>Cancel</>
              ) : (
                <>
                  <Plus size={16} className="mr-1" /> Add BTS Image
                </>
              )}
            </Button>
          </div>

          {/* Add new BTS image form */}
          {showAddBtsForm && (
            <div className="bg-gray-900 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-medium mb-4">Add New BTS Image</h3>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-400">Image *</label>
                  <ImageUploader onImageUploaded={handleBtsImageUpload} folder="bts-images" />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-400">Caption</label>
                  <Input
                    name="caption"
                    value={newBtsImage.caption || ""}
                    onChange={handleBtsChange}
                    placeholder="Image caption"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-400">Size</label>
                    <Select value={newBtsImage.size} onValueChange={(value) => handleBtsSelectChange("size", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-400">Aspect Ratio</label>
                    <Select
                      value={newBtsImage.aspect_ratio}
                      onValueChange={(value) => handleBtsSelectChange("aspect_ratio", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select aspect ratio" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="square">Square</SelectItem>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="landscape">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleAddBtsImage} disabled={!newBtsImage.image_url}>
                    Add Image
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* BTS images grid */}
          {btsImages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {btsImages.map((image) => (
                <div key={image.id} className="bg-gray-900 rounded-lg overflow-hidden">
                  <div className="relative h-48">
                    <img
                      src={image.image_url || "/placeholder.svg"}
                      alt={image.caption || "BTS image"}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {editingBtsId === image.id ? (
                    <div className="p-4 space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-400">Caption</label>
                        <Input
                          value={image.caption || ""}
                          onChange={(e) => handleBtsImageChange(image.id!, "caption", e.target.value)}
                          placeholder="Image caption"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-400">Size</label>
                          <Select
                            value={image.size || "medium"}
                            onValueChange={(value) => handleBtsImageChange(image.id!, "size", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="small">Small</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="large">Large</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-400">Aspect Ratio</label>
                          <Select
                            value={image.aspect_ratio || "landscape"}
                            onValueChange={(value) => handleBtsImageChange(image.id!, "aspect_ratio", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select aspect ratio" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="square">Square</SelectItem>
                              <SelectItem value="portrait">Portrait</SelectItem>
                              <SelectItem value="landscape">Landscape</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingBtsId(null)}>
                          Cancel
                        </Button>
                        <Button variant="default" size="sm" onClick={() => handleUpdateBtsImage(image.id!)}>
                          <Save className="mr-2 h-4 w-4" /> Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-gray-300">{image.caption || "No caption"}</p>
                          <p className="text-xs text-gray-500">
                            {image.size || "medium"} • {image.aspect_ratio || "landscape"}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditingBtsId(image.id!)}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteBtsImage(image.id!)}>
                            <X className="h-4 w-4 text-red-500" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-900 rounded-lg">
              <p className="text-gray-400 mb-4">No BTS images added yet</p>
              <Button onClick={() => setShowAddBtsForm(true)} variant="outline">
                <Plus className="mr-2 h-4 w-4" /> Add Your First BTS Image
              </Button>
            </div>
          )}
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
