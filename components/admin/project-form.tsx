"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { extractVideoInfo } from "@/lib/project-data"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import ImageUploader from "@/components/admin/image-uploader"
import MediaSelector from "@/components/admin/media-selector"
import { toast } from "@/components/ui/use-toast"
import Image from "next/image"
import { SimpleAutocomplete } from "@/components/ui/simple-autocomplete"

interface ProjectFormProps {
  project?: {
    id: string
    title: string
    category: string
    type: string
    role: string
    image: string
    thumbnail_url?: string
    description?: string
    is_public: boolean
    publish_date: string | null
    tags: string[]
  }
  mode: "create" | "edit"
}

export default function ProjectForm({ project, mode }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    title: project?.title || "",
    category: project?.category || "",
    role: project?.role || "",
    image: project?.image || "",
    thumbnail_url: project?.thumbnail_url || "",
    description: project?.description || "",
    is_public: project?.is_public ?? true,
    publish_date: project?.publish_date || null,
  })

  // State to track the role input for tag extraction
  const [roleInput, setRoleInput] = useState(project?.role || "")

  // State for suggestions
  const [categoryOptions, setCategoryOptions] = useState<string[]>([])
  const [roleOptions, setRoleOptions] = useState<string[]>([])

  // State for autocomplete dropdowns
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [isRoleOpen, setIsRoleOpen] = useState(false)

  // Refs for input elements
  const categoryInputRef = useRef<HTMLInputElement>(null)
  const roleInputRef = useRef<HTMLInputElement>(null)

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessingVideo, setIsProcessingVideo] = useState(false)
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null)
  const [isUsingVideoThumbnail, setIsUsingVideoThumbnail] = useState(false)
  const [schemaColumns, setSchemaColumns] = useState<string[]>([])
  const [isLoadingSchema, setIsLoadingSchema] = useState(true)
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Fetch the actual schema columns when the component mounts
  useEffect(() => {
    async function fetchSchema() {
      try {
        setIsLoadingSchema(true)
        // First try to get the schema from our API
        const response = await fetch("/api/check-projects-schema")

        if (response.ok) {
          const data = await response.json()
          if (data.columns && Array.isArray(data.columns)) {
            const columnNames = data.columns.map((col: any) => col.column_name)
            setSchemaColumns(columnNames)
            console.log("Available columns in projects table:", columnNames)
          }
        } else {
          // Fallback: direct query to get columns
          const { data, error } = await supabase.from("projects").select("*").limit(1)

          if (!error && data) {
            // Extract column names from the first row
            const sampleRow = data[0] || {}
            const columnNames = Object.keys(sampleRow)
            setSchemaColumns(columnNames)
            console.log("Available columns in projects table (fallback):", columnNames)
          } else {
            console.error("Error fetching schema:", error)
            // Set some default columns as a last resort
            setSchemaColumns([
              "id",
              "title",
              "description",
              "image",
              "category",
              "role",
              "project_date",
              "is_public",
              "created_at",
              "updated_at",
            ])
          }
        }
      } catch (err) {
        console.error("Error fetching schema:", err)
      } finally {
        setIsLoadingSchema(false)
      }
    }

    fetchSchema()
  }, [supabase])

  // Fetch existing categories and roles for suggestions
  useEffect(() => {
    async function fetchExistingValues() {
      try {
        // Fetch categories
        const { data: categoryData } = await supabase.from("projects").select("category")

        if (categoryData) {
          const categories = categoryData.map((item) => item.category).filter(Boolean)
          setCategoryOptions(categories)
        }

        // Fetch roles
        const { data: roleData } = await supabase.from("projects").select("role")

        if (roleData) {
          // Split comma-separated roles and flatten the array
          const roles = roleData
            .flatMap((item) => item.role?.split(",").map((r: string) => r.trim()) || [])
            .filter(Boolean)
          setRoleOptions(roles)
        }
      } catch (err) {
        console.error("Error fetching existing values:", err)
      }
    }

    fetchExistingValues()
  }, [supabase])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoleChange = (value: string) => {
    setRoleInput(value)

    // Update role in form data
    setFormData((prev) => ({
      ...prev,
      role: value,
    }))
  }

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }))
  }

  const handleImageUpload = (url: string) => {
    setFormData((prev) => ({ ...prev, image: url }))
    setIsUsingVideoThumbnail(false)
  }

  // Process video URL and extract thumbnail
  useEffect(() => {
    const processVideoUrl = async () => {
      const url = formData.thumbnail_url?.trim()
      if (!url || isProcessingVideo) return

      const videoInfo = extractVideoInfo(url)
      if (!videoInfo) {
        setVideoThumbnail(null)
        return
      }

      setIsProcessingVideo(true)

      try {
        let thumbnailUrl = null

        if (videoInfo.platform === "vimeo") {
          // Get video thumbnail from Vimeo API
          const response = await fetch(`https://vimeo.com/api/v2/video/${videoInfo.id}.json`)

          if (!response.ok) {
            throw new Error("Failed to fetch Vimeo video info")
          }

          const videoData = await response.json()
          const video = videoData[0]
          thumbnailUrl = video.thumbnail_large
        } else if (videoInfo.platform === "youtube") {
          // Use YouTube thumbnail URL format
          thumbnailUrl = `https://img.youtube.com/vi/${videoInfo.id}/hqdefault.jpg`
        } else if (videoInfo.platform === "linkedin") {
          // LinkedIn doesn't provide easy thumbnail access, use a placeholder
          thumbnailUrl = "/generic-icon.png"
        }

        setVideoThumbnail(thumbnailUrl)

        // If no image is set yet, use the video thumbnail
        if (!formData.image && thumbnailUrl) {
          setFormData((prev) => ({ ...prev, image: thumbnailUrl }))
          setIsUsingVideoThumbnail(true)
        }

        // Check if this video is already in the media library
        const { data: existingMedia } = await supabase
          .from("media")
          .select("id, public_url")
          .eq("public_url", url)
          .maybeSingle()

        if (existingMedia) {
          console.log("Video already exists in media library:", existingMedia.id)
          return // Already in the library
        }

        // Get current user session
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const userId = session?.user?.id || "anonymous"

        // Add video to media library
        const videoTitle =
          videoInfo.platform === "vimeo"
            ? (await fetch(`https://vimeo.com/api/v2/video/${videoInfo.id}.json`).then((r) => r.json()))[0]?.title ||
              `Vimeo ${videoInfo.id}`
            : videoInfo.platform === "youtube"
              ? `YouTube ${videoInfo.id}`
              : `LinkedIn Post ${videoInfo.id}`

        // Save to media table
        const { error: dbError } = await supabase.from("media").insert({
          filename: videoTitle,
          filepath: url,
          filesize: 0, // Not applicable for external videos
          filetype: videoInfo.platform,
          public_url: url,
          thumbnail_url: thumbnailUrl,
          tags: ["video", videoInfo.platform, "project"],
          metadata: {
            [videoInfo.platform + "Id"]: videoInfo.id,
            uploadedBy: userId,
          },
        })

        if (dbError) throw dbError

        toast({
          title: "Video added to media library",
          description: `${videoInfo.platform.charAt(0).toUpperCase() + videoInfo.platform.slice(1)} video has been added to your media library`,
        })
      } catch (err) {
        console.error("Error processing video URL:", err)
        // Don't show error to user, just log it
      } finally {
        setIsProcessingVideo(false)
      }
    }

    if (formData.thumbnail_url) {
      processVideoUrl()
    } else {
      setVideoThumbnail(null)
    }
  }, [formData.thumbnail_url, formData.image, supabase])

  const useVideoThumbnail = () => {
    if (videoThumbnail) {
      setFormData((prev) => ({ ...prev, image: videoThumbnail }))
      setIsUsingVideoThumbnail(true)
      toast({
        title: "Video thumbnail applied",
        description: "The video thumbnail has been set as the project image",
      })
    }
  }

  const validateForm = () => {
    if (!formData.title) return "Title is required"
    if (!formData.category) return "Category is required"
    if (!formData.role) return "Role is required"
    if (!formData.image) return "Image is required"

    // Validate video URL if provided
    if (formData.thumbnail_url) {
      const videoInfo = extractVideoInfo(formData.thumbnail_url)
      if (!videoInfo) return "Invalid video URL. Please use a YouTube, Vimeo, or LinkedIn link."
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Log the form data for debugging
      console.log("Form data before submission:", formData)

      // Create a clean data object with only the required fields
      const projectData = {
        title: formData.title.trim(),
        category: formData.category.trim(),
        role: formData.role.trim(),
        image: formData.image.trim(),
        description: formData.description,
        is_public: formData.is_public,
        project_date: formData.project_date || new Date().toISOString().split("T")[0],
      }

      // Add thumbnail_url if it exists and is not empty
      if (formData.thumbnail_url) {
        projectData.thumbnail_url = formData.thumbnail_url.trim()
      }

      // Log the data being sent to the API
      console.log("Sending project data to API:", projectData)

      if (mode === "create") {
        // Create new project using API route
        const response = await fetch("/api/projects/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(projectData),
        })

        const responseData = await response.json()

        if (!response.ok) {
          console.error("API error response:", responseData)
          throw new Error(responseData.error || responseData.details || "Failed to create project")
        }

        // Show success message
        toast({
          title: "Project created",
          description: "Project created successfully!",
        })

        // Redirect to the project edit page
        router.push(`/admin/projects/${responseData.data[0].id}/edit`)
      } else {
        // Update existing project
        const response = await fetch(`/api/projects/update/${project?.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(projectData),
        })

        const responseData = await response.json()

        if (!response.ok) {
          console.error("API error response:", responseData)
          throw new Error(responseData.error || responseData.details || "Failed to update project")
        }

        // Show success message
        toast({
          title: "Project updated",
          description: "Project updated successfully!",
        })

        // Refresh the page
        router.refresh()
      }
    } catch (error: any) {
      console.error("Error saving project:", error)
      setError(error.message || "Failed to save project")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {isLoadingSchema && (
        <Alert className="bg-blue-900/20 border-blue-800">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <AlertDescription>Loading database schema...</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="title">Project Title *</Label>
          <Input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter project title"
            className="bg-gray-800 border-gray-700"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <SimpleAutocomplete
            options={categoryOptions}
            value={formData.category}
            onInputChange={handleCategoryChange}
            onSelect={handleCategoryChange}
            placeholder="e.g. Short Film, Music Video, etc."
            className="bg-gray-800 border-gray-700"
            allowCustomValues={true}
            isOpen={isCategoryOpen}
            onOpenChange={setIsCategoryOpen}
            onFocus={() => setIsCategoryOpen(true)}
            onBlur={() => setTimeout(() => setIsCategoryOpen(false), 100)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role/Tags *</Label>
          <SimpleAutocomplete
            options={roleOptions}
            value={roleInput}
            onInputChange={handleRoleChange}
            onSelect={handleRoleChange}
            placeholder="e.g. Director, 1st AC, etc. (comma-separated)"
            className="bg-gray-800 border-gray-700"
            allowCustomValues={true}
            multiple={true}
            separator=","
            isOpen={isRoleOpen}
            onOpenChange={setIsRoleOpen}
            onFocus={() => setIsRoleOpen(true)}
            onBlur={() => setTimeout(() => setIsRoleOpen(false), 100)}
          />
          <p className="text-xs text-gray-400">Separate multiple roles/tags with commas</p>

          {roleInput && (
            <div className="flex flex-wrap gap-2 mt-2">
              {roleInput.split(",").map(
                (tag, index) =>
                  tag.trim() && (
                    <span key={index} className="px-2 py-1 bg-gray-700 rounded-md text-xs">
                      {tag.trim()}
                    </span>
                  ),
              )}
            </div>
          )}
        </div>
      </div>

      {schemaColumns.includes("thumbnail_url") && (
        <div className="space-y-2">
          <Label>Video URL (YouTube, Vimeo, or LinkedIn)</Label>
          <div className="flex items-center gap-2">
            <div className="flex-grow">
              <Input
                id="thumbnail_url"
                name="thumbnail_url"
                value={formData.thumbnail_url}
                onChange={handleChange}
                placeholder="https://www.youtube.com/watch?v=..."
                className="bg-gray-800 border-gray-700"
              />
            </div>
            <div className="flex-shrink-0">
              <MediaSelector
                type="video"
                onSelect={(url) => setFormData((prev) => ({ ...prev, thumbnail_url: url }))}
                buttonLabel="Browse Videos"
                currentUrl={formData.thumbnail_url}
              />
            </div>
          </div>
          {isProcessingVideo && (
            <p className="text-sm text-blue-500 flex items-center gap-1 mt-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Processing video...
            </p>
          )}
          {formData.thumbnail_url && extractVideoInfo(formData.thumbnail_url) && (
            <p className="text-sm text-green-500">Valid video URL</p>
          )}
          {formData.thumbnail_url && !extractVideoInfo(formData.thumbnail_url) && (
            <p className="text-sm text-red-500">Invalid video URL. Please use a YouTube, Vimeo, or LinkedIn link.</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label>Cover Image *</Label>

        {/* Video thumbnail section */}
        {videoThumbnail && (
          <div className="mb-4 p-4 border border-gray-700 rounded-md bg-gray-800/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative w-40 h-24 overflow-hidden rounded-md">
                <Image
                  src={videoThumbnail || "/placeholder.svg"}
                  alt="Video thumbnail"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium mb-1">Video Thumbnail Available</h4>
                <p className="text-xs text-gray-400 mb-2">
                  {isUsingVideoThumbnail
                    ? "You're currently using the video thumbnail as your project image."
                    : "You can use this thumbnail as your project image."}
                </p>
                {!isUsingVideoThumbnail && (
                  <Button type="button" variant="secondary" size="sm" onClick={useVideoThumbnail}>
                    Use Video Thumbnail
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <ImageUploader currentImage={formData.image} onImageUploaded={handleImageUpload} folder="projects" />
          </div>
          <div>
            <MediaSelector
              type="image"
              onSelect={handleImageUpload}
              buttonLabel="Select from Media Library"
              currentUrl={formData.image}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe the project..."
          className="bg-gray-800 border-gray-700 min-h-[100px]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <Label htmlFor="is_public" className="flex items-center space-x-2 mb-2">
            <span>Visibility</span>
          </Label>
          <Select
            name="is_public"
            value={formData.is_public ? "true" : "false"}
            onValueChange={(value) => handleSelectChange("is_public", value === "true")}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Public</SelectItem>
              <SelectItem value="false">Private</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-sm text-gray-500 mt-1">
            {formData.is_public ? "This project is visible to everyone" : "This project is only visible to admins"}
          </p>
        </div>

        {schemaColumns.includes("publish_date") && !formData.is_public && (
          <div>
            <Label htmlFor="publish_date" className="mb-2">
              Scheduled Publish Date
            </Label>
            <Input
              type="datetime-local"
              id="publish_date"
              name="publish_date"
              value={formData.publish_date ? new Date(formData.publish_date).toISOString().slice(0, 16) : ""}
              onChange={(e) => {
                const value = e.target.value ? new Date(e.target.value).toISOString() : null
                setFormData((prev) => ({ ...prev, publish_date: value }))
              }}
              className="w-full"
              disabled={formData.is_public}
            />
            <p className="text-sm text-gray-500 mt-1">
              {formData.is_public ? "Project is already public" : "When to automatically make this project public"}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/projects")}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || isLoadingSchema}
          className="bg-white text-black hover:bg-gray-200"
        >
          {isSubmitting ? "Saving..." : mode === "create" ? "Create Project" : "Update Project"}
        </Button>
      </div>
    </form>
  )
}
