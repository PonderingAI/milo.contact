"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase"
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

interface ProjectFormProps {
  project?: {
    id: string
    title: string
    category: string
    type: string
    role: string
    image: string
    video_url?: string
    description?: string
    special_notes?: string
  }
  mode: "create" | "edit"
}

export default function ProjectForm({ project, mode }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    title: project?.title || "",
    category: project?.category || "",
    type: project?.type || "directed",
    role: project?.role || "",
    image: project?.image || "",
    video_url: project?.video_url || "",
    description: project?.description || "",
    special_notes: project?.special_notes || "",
  })

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessingVideo, setIsProcessingVideo] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

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

  // Process video URL and add to media library
  useEffect(() => {
    const processVideoUrl = async () => {
      const url = formData.video_url.trim()
      if (!url || isProcessingVideo) return

      const videoInfo = extractVideoInfo(url)
      if (!videoInfo) return

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

      setIsProcessingVideo(true)

      try {
        let thumbnailUrl = null
        let videoTitle = null
        let videoMetadata = {}

        if (videoInfo.platform === "vimeo") {
          // Get video thumbnail and metadata
          const response = await fetch(`https://vimeo.com/api/v2/video/${videoInfo.id}.json`)

          if (!response.ok) {
            throw new Error("Failed to fetch Vimeo video info")
          }

          const videoData = await response.json()
          const video = videoData[0]

          thumbnailUrl = video.thumbnail_large
          videoTitle = video.title || `Vimeo ${videoInfo.id}`
          videoMetadata = {
            vimeoId: videoInfo.id,
            description: video.description,
            duration: video.duration,
            uploadDate: video.upload_date,
          }
        } else if (videoInfo.platform === "youtube") {
          // Use YouTube thumbnail URL format
          thumbnailUrl = `https://img.youtube.com/vi/${videoInfo.id}/hqdefault.jpg`
          videoTitle = `YouTube ${videoInfo.id}`
          videoMetadata = {
            youtubeId: videoInfo.id,
          }
        } else if (videoInfo.platform === "linkedin") {
          // LinkedIn doesn't provide easy thumbnail access, use a placeholder
          thumbnailUrl = "/generic-icon.png"
          videoTitle = `LinkedIn Post ${videoInfo.id}`
          videoMetadata = {
            linkedinId: videoInfo.id,
          }
        }

        // Get current user session
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const userId = session?.user?.id || "anonymous"

        // Add user ID to metadata
        videoMetadata.uploadedBy = userId

        // Save to media table
        const { error: dbError } = await supabase.from("media").insert({
          filename: videoTitle,
          filepath: url,
          filesize: 0, // Not applicable for external videos
          filetype: videoInfo.platform,
          public_url: url,
          thumbnail_url: thumbnailUrl,
          tags: ["video", videoInfo.platform, "project"],
          metadata: videoMetadata,
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

    if (formData.video_url) {
      processVideoUrl()
    }
  }, [formData.video_url, supabase])

  const validateForm = () => {
    if (!formData.title) return "Title is required"
    if (!formData.category) return "Category is required"
    if (!formData.type) return "Type is required"
    if (!formData.role) return "Role is required"
    if (!formData.image) return "Image is required"

    // Validate video URL if provided
    if (formData.video_url) {
      const videoInfo = extractVideoInfo(formData.video_url)
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
      if (mode === "create") {
        // Create new project
        const { data, error } = await supabase.from("projects").insert([formData]).select()

        if (error) throw error

        // Redirect to the project edit page
        router.push(`/admin/projects/${data[0].id}/edit`)
      } else {
        // Update existing project
        const { error } = await supabase.from("projects").update(formData).eq("id", project?.id)

        if (error) throw error

        // Refresh the page
        router.refresh()
      }

      // Show success message
      toast({
        title: mode === "create" ? "Project created" : "Project updated",
        description: mode === "create" ? "Project created successfully!" : "Project updated successfully!",
      })
    } catch (error: any) {
      console.error("Error saving project:", error)
      setError(error.message || "Failed to save project")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
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
          <Input
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            placeholder="e.g. Short Film, Music Video, etc."
            className="bg-gray-800 border-gray-700"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Type *</Label>
          <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
            <SelectTrigger className="bg-gray-800 border-gray-700">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="directed">Directed</SelectItem>
              <SelectItem value="camera">Camera</SelectItem>
              <SelectItem value="production">Production</SelectItem>
              <SelectItem value="photography">Photography</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Input
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            placeholder="e.g. Director, 1st AC, etc."
            className="bg-gray-800 border-gray-700"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Video URL (YouTube, Vimeo, or LinkedIn)</Label>
        <div className="flex items-center gap-2">
          <div className="flex-grow">
            <Input
              id="video_url"
              name="video_url"
              value={formData.video_url}
              onChange={handleChange}
              placeholder="https://www.youtube.com/watch?v=..."
              className="bg-gray-800 border-gray-700"
            />
          </div>
          <div className="flex-shrink-0">
            <MediaSelector
              type="video"
              onSelect={(url) => setFormData((prev) => ({ ...prev, video_url: url }))}
              buttonLabel="Browse Videos"
              currentUrl={formData.video_url}
            />
          </div>
        </div>
        {isProcessingVideo && (
          <p className="text-sm text-blue-500 flex items-center gap-1 mt-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processing video...
          </p>
        )}
        {formData.video_url && extractVideoInfo(formData.video_url) && (
          <p className="text-sm text-green-500">Valid video URL</p>
        )}
        {formData.video_url && !extractVideoInfo(formData.video_url) && (
          <p className="text-sm text-red-500">Invalid video URL. Please use a YouTube, Vimeo, or LinkedIn link.</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Cover Image *</Label>
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

      <div className="space-y-2">
        <Label htmlFor="special_notes">Special Notes</Label>
        <Textarea
          id="special_notes"
          name="special_notes"
          value={formData.special_notes}
          onChange={handleChange}
          placeholder="Any special notes about this project..."
          className="bg-gray-800 border-gray-700 min-h-[100px]"
        />
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.push("/admin/projects")}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-white text-black hover:bg-gray-200">
          {isSubmitting ? "Saving..." : mode === "create" ? "Create Project" : "Update Project"}
        </Button>
      </div>
    </form>
  )
}
