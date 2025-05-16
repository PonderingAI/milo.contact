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
import { AlertCircle, Loader2, X } from "lucide-react"
import ImageUploader from "@/components/admin/image-uploader"
import MediaSelector from "@/components/admin/media-selector"
import { toast } from "@/components/ui/use-toast"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"

interface ProjectFormProps {
  project?: {
    id: string
    title: string
    category: string
    role: string
    image: string
    video_url?: string
    description?: string
    special_notes?: string
    is_public: boolean
    publish_date: string | null
    tags?: string[]
    project_date?: string | null
  }
  mode: "create" | "edit"
}

export default function ProjectForm({ project, mode }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    title: project?.title || "",
    category: project?.category || "",
    role: project?.role || "",
    image: project?.image || "",
    video_url: project?.video_url || "",
    description: project?.description || "",
    special_notes: project?.special_notes || "",
    is_public: project?.is_public ?? true,
    publish_date: project?.publish_date || null,
    tags: project?.tags || [],
    project_date: project?.project_date || null,
  })

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessingVideo, setIsProcessingVideo] = useState(false)
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null)
  const [isUsingVideoThumbnail, setIsUsingVideoThumbnail] = useState(false)
  const [parsedTags, setParsedTags] = useState<string[]>([])
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  // Parse tags from role field
  useEffect(() => {
    if (formData.role) {
      // Split by commas and trim whitespace
      const roleTags = formData.role
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      // Combine with existing tags, remove duplicates
      const allTags = [...new Set([...roleTags, ...formData.tags])]
      setParsedTags(allTags)
    } else {
      setParsedTags(formData.tags)
    }
  }, [formData.role, formData.tags])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = (url: string) => {
    setFormData((prev) => ({ ...prev, image: url }))
    setIsUsingVideoThumbnail(false)
  }

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  // Process video URL and extract thumbnail
  useEffect(() => {
    const processVideoUrl = async () => {
      const url = formData.video_url.trim()
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

    if (formData.video_url) {
      processVideoUrl()
    } else {
      setVideoThumbnail(null)
    }
  }, [formData.video_url, formData.image, supabase])

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
      // Extract tags from role field
      const roleTags = formData.role
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)

      // Combine with existing tags, remove duplicates
      const allTags = [...new Set([...roleTags, ...formData.tags])]

      // Prepare data for submission
      const dataToSubmit = {
        ...formData,
        tags: allTags,
      }

      if (mode === "create") {
        // Create new project
        const { data, error } = await supabase.from("projects").insert([dataToSubmit]).select()

        if (error) throw error

        // Redirect to the project edit page
        router.push(`/admin/projects/${data[0].id}/edit`)
      } else {
        // Update existing project
        const { error } = await supabase.from("projects").update(dataToSubmit).eq("id", project?.id)

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

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="role">Roles/Tags *</Label>
          <Input
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            placeholder="e.g. Director, 1st AC, Drone Operator (separate with commas)"
            className="bg-gray-800 border-gray-700"
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            Separate multiple roles with commas. These will be used as tags for filtering.
          </p>

          {parsedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {parsedTags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  {formData.tags.includes(tag) && (
                    <button type="button" onClick={() => removeTag(tag)} className="text-gray-400 hover:text-gray-200">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          )}
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
        <Label htmlFor="project_date">Project Date</Label>
        <Input
          type="date"
          id="project_date"
          name="project_date"
          value={formData.project_date ? new Date(formData.project_date).toISOString().split("T")[0] : ""}
          onChange={(e) => {
            const value = e.target.value ? new Date(e.target.value).toISOString() : null
            setFormData((prev) => ({ ...prev, project_date: value }))
          }}
          className="bg-gray-800 border-gray-700"
        />
        <p className="text-xs text-gray-400">When was this project completed?</p>
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
