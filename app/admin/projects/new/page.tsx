"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2, ArrowLeft, Save, X, ImageIcon, Film, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { extractVideoInfo } from "@/lib/project-data"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ProjectMediaUploader from "@/components/admin/project-media-uploader"

export default function NewProjectPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingVideo, setProcessingVideo] = useState(false)
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    role: "",
    image: "",
    video_url: "",
    description: "",
    // Removed special_notes field as it doesn't exist in the database
    project_date: new Date().toISOString().split("T")[0], // Default to today
    is_public: true, // Default to public
    publish_date: null, // No scheduled publish date by default
  })

  // State to track the role input for tag extraction
  const [roleInput, setRoleInput] = useState("")

  // Media state
  const [btsImages, setBtsImages] = useState<string[]>([])
  const [btsVideos, setBtsVideos] = useState<string[]>([])
  const [mainImages, setMainImages] = useState<string[]>([])
  const [mainVideos, setMainVideos] = useState<string[]>([])

  // Helper function to format date for input field
  function formatDateForInput(date: Date): string {
    return date.toISOString().split("T")[0]
  }

  // Helper function to extract date from file metadata
  async function extractDateFromMedia(url: string, type: "image" | "video"): Promise<Date | null> {
    try {
      if (type === "video") {
        const videoInfo = extractVideoInfo(url)
        if (!videoInfo) return null

        if (videoInfo.platform === "vimeo") {
          // Get video metadata from Vimeo
          const response = await fetch(`https://vimeo.com/api/v2/video/${videoInfo.id}.json`)
          if (response.ok) {
            const videoData = await response.json()
            const video = videoData[0]
            if (video.upload_date) {
              return new Date(video.upload_date)
            }
          }
        } else if (videoInfo.platform === "youtube") {
          // YouTube doesn't provide easy access to upload date via API without a key
          // We could potentially fetch the page and parse it, but that's complex
          return null
        }
      } else if (type === "image") {
        // For images in Supabase, check if we have metadata
        const { data } = await supabase.from("media").select("metadata, created_at").eq("public_url", url).maybeSingle()

        if (data) {
          // Try to get date from metadata
          if (data.metadata && data.metadata.dateTaken) {
            return new Date(data.metadata.dateTaken)
          }
          // Fall back to created_at
          if (data.created_at) {
            return new Date(data.created_at)
          }
        }
      }
      return null
    } catch (error) {
      console.error("Error extracting date from media:", error)
      return null
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setRoleInput(value)

    // Update role in form data
    setFormData((prev) => ({
      ...prev,
      role: value,
    }))
  }

  // Handler for main media selection
  const handleMainMediaSelect = async (url: string | string[]) => {
    // Handle both single and multiple selections
    const urls = Array.isArray(url) ? url : [url]
    console.log("handleMainMediaSelect received URLs:", urls)

    for (const mediaUrl of urls) {
      if (!mediaUrl) continue

      // Determine if it's an image or video based on extension or URL
      const isVideo =
        mediaUrl.match(/\.(mp4|webm|ogg|mov)$/) !== null ||
        mediaUrl.includes("youtube.com") ||
        mediaUrl.includes("vimeo.com") ||
        mediaUrl.includes("youtu.be")

      if (isVideo) {
        if (!mainVideos.includes(mediaUrl)) {
          setMainVideos((prev) => [...prev, mediaUrl])
        }
        // Set as main video if none is set
        if (!formData.video_url) {
          setFormData((prev) => ({ ...prev, video_url: mediaUrl }))

          // Try to extract date if project_date is empty
          if (!formData.project_date) {
            const date = await extractDateFromMedia(mediaUrl, "video")
            if (date) {
              setFormData((prev) => ({ ...prev, project_date: formatDateForInput(date) }))
            }
          }
        }
      } else {
        if (!mainImages.includes(mediaUrl)) {
          setMainImages((prev) => [...prev, mediaUrl])
        }
        // Set as cover image if none is set
        if (!formData.image) {
          setFormData((prev) => ({ ...prev, image: mediaUrl }))

          // Try to extract date if project_date is empty
          if (!formData.project_date) {
            const date = await extractDateFromMedia(mediaUrl, "image")
            if (date) {
              setFormData((prev) => ({ ...prev, project_date: formatDateForInput(date) }))
            }
          }
        }
      }

      // If title is empty, try to extract a title from the filename
      if (!formData.title) {
        const filename = mediaUrl.split("/").pop()
        if (filename) {
          // Remove extension and replace dashes/underscores with spaces
          const nameWithoutExt = filename.split(".")[0]
          const title = nameWithoutExt.replace(/[-_]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) // Capitalize first letter of each word

          setFormData((prev) => ({ ...prev, title }))
        }
      }
    }
  }

  // Handler for BTS media selection
  const handleBtsMediaSelect = (url: string | string[]) => {
    // Handle both single and multiple selections
    const urls = Array.isArray(url) ? url : [url]

    urls.forEach((mediaUrl) => {
      // Determine if it's an image or video based on extension or URL
      const isVideo =
        mediaUrl.match(/\.(mp4|webm|ogg|mov)$/) !== null ||
        mediaUrl.includes("youtube.com") ||
        mediaUrl.includes("vimeo.com") ||
        mediaUrl.includes("youtu.be")

      if (isVideo) {
        if (!btsVideos.includes(mediaUrl)) {
          setBtsVideos((prev) => [...prev, mediaUrl])
        }
      } else {
        if (!btsImages.includes(mediaUrl)) {
          setBtsImages((prev) => [...prev, mediaUrl])
        }
      }
    })
  }

  const removeMainImage = (index: number) => {
    const newImages = [...mainImages]
    const removedImage = newImages.splice(index, 1)[0]
    setMainImages(newImages)

    // If the removed image was the cover image, set a new one if available
    if (formData.image === removedImage) {
      if (newImages.length > 0) {
        setFormData((prev) => ({ ...prev, image: newImages[0] }))
      } else {
        setFormData((prev) => ({ ...prev, image: "" }))
      }
    }
  }

  const removeMainVideo = (index: number) => {
    const newVideos = [...mainVideos]
    const removedVideo = newVideos.splice(index, 1)[0]
    setMainVideos(newVideos)

    // If the removed video was the main video, set a new one if available
    if (formData.video_url === removedVideo) {
      if (newVideos.length > 0) {
        setFormData((prev) => ({ ...prev, video_url: newVideos[0] }))
      } else {
        setFormData((prev) => ({ ...prev, video_url: "" }))
      }
    }
  }

  const removeBtsImage = (index: number) => {
    const newImages = [...btsImages]
    newImages.splice(index, 1)
    setBtsImages(newImages)
  }

  const removeBtsVideo = (index: number) => {
    const newVideos = [...btsVideos]
    newVideos.splice(index, 1)
    setBtsVideos(newVideos)
  }

  const setCoverImage = (url: string) => {
    setFormData((prev) => ({ ...prev, image: url }))
  }

  const setMainVideo = (url: string) => {
    setFormData((prev) => ({ ...prev, video_url: url }))
  }

  const addMainVideoUrl = async (url: string) => {
    if (!url.trim()) return

    setProcessingVideo(true)
    const toastId = toast({
      title: "Processing video",
      description: "Fetching video information...",
    }).id

    try {
      // Use the new API route to process the video URL
      const response = await fetch("/api/process-video-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to process video URL")
      }

      const result = await response.json()
      console.log("Video processing result:", result)

      // Add to mainVideos if not already in the list
      if (!mainVideos.includes(url)) {
        setMainVideos((prev) => [...prev, url])
        setFormData((prev) => ({ ...prev, video_url: url }))
      }

      // If we have a thumbnail and no image is set, use the thumbnail
      if (result.thumbnailUrl && !formData.image && !mainImages.includes(result.thumbnailUrl)) {
        setFormData((prev) => ({ ...prev, image: result.thumbnailUrl }))
        setVideoThumbnail(result.thumbnailUrl)
        setMainImages((prev) => [...prev, result.thumbnailUrl])
      }

      // If project title is empty, use video title
      if (!formData.title && result.title) {
        setFormData((prev) => ({ ...prev, title: result.title }))
      }

      // If project date is empty and we have an upload date, use it
      if (!formData.project_date && result.uploadDate) {
        const date = new Date(result.uploadDate)
        setFormData((prev) => ({ ...prev, project_date: formatDateForInput(date) }))
      }

      toast({
        id: toastId,
        title: "Video added",
        description: "Video has been added to the project and media library",
      })
    } catch (error) {
      console.error("Error processing video:", error)
      toast({
        id: toastId,
        title: "Error adding video",
        description: error instanceof Error ? error.message : "Failed to process video URL",
        variant: "destructive",
      })
    } finally {
      setProcessingVideo(false)
    }
  }

  const addBtsVideoUrl = async (url: string) => {
    if (!url.trim()) return

    const toastId = toast({
      title: "Processing BTS video",
      description: "Fetching video information...",
    }).id

    try {
      // Use the new API route to process the video URL
      const response = await fetch("/api/process-video-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, isBts: true }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to process video URL")
      }

      const result = await response.json()
      console.log("BTS video processing result:", result)

      // Add to BTS videos if not already in the list
      if (!btsVideos.includes(url)) {
        setBtsVideos((prev) => [...prev, url])
      }

      // Add thumbnail to BTS images if available and not already in the list
      if (result.thumbnailUrl && !btsImages.includes(result.thumbnailUrl)) {
        setBtsImages((prev) => [...prev, result.thumbnailUrl])
      }

      toast({
        id: toastId,
        title: "BTS Video added",
        description: "Behind the scenes video has been added to the project",
      })
    } catch (error) {
      console.error("Error processing BTS video:", error)
      toast({
        id: toastId,
        title: "Error adding BTS video",
        description: error instanceof Error ? error.message : "Failed to process video URL",
        variant: "destructive",
      })
    }
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
        setError("Cover image is required")
        return
      }

      // Log the data being sent to the server
      console.log("Saving project with data:", formData)

      // Create in Supabase
      const { data, error: projectError } = await supabase.from("projects").insert([formData]).select()

      if (projectError) {
        throw projectError
      }

      const projectId = data[0].id

      // Save BTS images if any
      if (btsImages.length > 0) {
        const btsImagesData = btsImages.map((imageUrl, index) => ({
          project_id: projectId,
          image_url: imageUrl,
          caption: `BTS Image ${index + 1}`,
          size: "medium",
          aspect_ratio: "landscape",
        }))

        const { error: btsError } = await supabase.from("bts_images").insert(btsImagesData)

        if (btsError) {
          console.error("Error saving BTS images:", btsError)
          // Continue anyway, we've already created the project
        }
      }

      // Success
      toast({
        title: "Project created",
        description: "Project created successfully!",
      })

      router.push(`/admin/projects/${projectId}/edit`)
    } catch (err: any) {
      console.error("Error creating project:", err)
      setError(err.message || "Failed to create project")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative pb-20">
      {/* Header with back button and save button */}
      <div className="sticky top-0 z-10 bg-[#070a10]/80 backdrop-blur-sm p-4 flex justify-between items-center mb-4">
        <Link href="/admin/projects" className="flex items-center gap-2 text-gray-300 hover:text-white">
          <ArrowLeft size={18} />
          <span>Back to Projects</span>
        </Link>

        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-[#131a2a]"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="mr-1 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save size={16} className="mr-1" />
                Create Project
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 mb-4 max-w-7xl mx-auto">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Project form */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left column - Upload areas */}
          <div className="space-y-4">
            {/* Main upload area */}
            <ProjectMediaUploader
              title="Main"
              onMediaSelect={handleMainMediaSelect}
              onVideoUrlSubmit={addMainVideoUrl}
              mediaType="all"
              folder="projects"
            />

            {/* BTS upload area */}
            <ProjectMediaUploader
              title="BTS"
              onMediaSelect={handleBtsMediaSelect}
              onVideoUrlSubmit={addBtsVideoUrl}
              mediaType="all"
              folder="bts"
            />
          </div>

          {/* Right column - Project details */}
          <div>
            <Card className="border-gray-800 bg-[#070a10]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-gray-200">Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Title</label>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="border-gray-800 bg-[#0f1520] text-gray-200"
                    placeholder="Project Title"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Category</label>
                  <Input
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="border-gray-800 bg-[#0f1520] text-gray-200"
                    placeholder="e.g. Short Film, Music Video"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Role/Tags</label>
                  <Input
                    name="role"
                    value={roleInput}
                    onChange={handleRoleChange}
                    className="border-gray-800 bg-[#0f1520] text-gray-200"
                    placeholder="e.g. Director, 1st AC (comma-separated)"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate multiple roles/tags with commas</p>

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

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Date</label>
                  <div className="relative">
                    <Input
                      type="date"
                      name="project_date"
                      value={formData.project_date}
                      onChange={handleChange}
                      className="border-gray-800 bg-[#0f1520] text-gray-200 pl-10"
                    />
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Visibility</label>
                  <Select
                    value={formData.is_public ? "true" : "false"}
                    onValueChange={(value) => handleSelectChange("is_public", value === "true")}
                  >
                    <SelectTrigger className="border-gray-800 bg-[#0f1520] text-gray-200">
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#070a10] border-gray-800 text-gray-200">
                      <SelectItem value="true">Public</SelectItem>
                      <SelectItem value="false">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {!formData.is_public && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Scheduled Publish Date</label>
                    <div className="relative">
                      <Input
                        type="datetime-local"
                        name="publish_date"
                        value={formData.publish_date ? new Date(formData.publish_date).toISOString().slice(0, 16) : ""}
                        onChange={(e) => {
                          const value = e.target.value ? new Date(e.target.value).toISOString() : null
                          setFormData((prev) => ({ ...prev, publish_date: value }))
                        }}
                        className="border-gray-800 bg-[#0f1520] text-gray-200 pl-10"
                      />
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-4">
          {/* Description */}
          <Card className="border-gray-800 bg-[#070a10]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-gray-200">Description</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the project..."
                className="min-h-[180px] border-gray-800 bg-[#0f1520] text-gray-200"
              />
            </CardContent>
          </Card>
        </div>

        {/* Media Overview Section */}
        <div className="mt-8">
          <h2 className="text-xl font-medium mb-4 text-gray-200">Media Overview</h2>

          <div className="space-y-6">
            {/* Main Media Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-300 border-b border-gray-800 pb-2">Main Footage</h3>

              {/* Main Images */}
              {mainImages.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-gray-400">Images</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {mainImages.map((image, index) => (
                      <div key={`main-image-${index}`} className="relative group">
                        <div
                          className={`aspect-video bg-[#0f1520] rounded-md overflow-hidden ${formData.image === image ? "ring-2 ring-blue-500" : ""}`}
                        >
                          <img
                            src={image || "/placeholder.svg"}
                            alt={`Main image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() => setCoverImage(image)}
                            className="p-1 bg-blue-600 rounded-full hover:bg-blue-700"
                            title="Set as cover image"
                          >
                            <ImageIcon size={14} />
                          </button>
                          <button
                            onClick={() => removeMainImage(index)}
                            className="p-1 bg-red-600 rounded-full hover:bg-red-700"
                            title="Remove image"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        {formData.image === image && (
                          <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-sm">
                            Cover
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Main Videos */}
              {mainVideos.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-gray-400">Videos</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {mainVideos.map((video, index) => (
                      <div key={`main-video-${index}`} className="relative group">
                        <div
                          className={`aspect-video bg-[#0f1520] rounded-md overflow-hidden flex items-center justify-center ${formData.video_url === video ? "ring-2 ring-blue-500" : ""}`}
                        >
                          {video.includes("youtube.com") ? (
                            <img
                              src={`https://img.youtube.com/vi/${video.split("v=")[1]?.split("&")[0]}/hqdefault.jpg`}
                              alt={`YouTube video ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : video.includes("youtu.be") ? (
                            <img
                              src={`https://img.youtube.com/vi/${video.split("youtu.be/")[1]?.split("?")[0]}/hqdefault.jpg`}
                              alt={`YouTube video ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : video.includes("vimeo.com") ? (
                            <div className="text-gray-400 flex flex-col items-center">
                              <Film size={24} />
                              <span className="text-xs mt-1">Vimeo Video</span>
                            </div>
                          ) : (
                            <div className="text-gray-400 flex flex-col items-center">
                              <Film size={24} />
                              <span className="text-xs mt-1">Video</span>
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            onClick={() => setMainVideo(video)}
                            className="p-1 bg-blue-600 rounded-full hover:bg-blue-700"
                            title="Set as main video"
                          >
                            <Film size={14} />
                          </button>
                          <button
                            onClick={() => removeMainVideo(index)}
                            className="p-1 bg-red-600 rounded-full hover:bg-red-700"
                            title="Remove video"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        {formData.video_url === video && (
                          <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-sm">
                            Main
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mainImages.length === 0 && mainVideos.length === 0 && (
                <div className="text-center py-4 text-gray-400">
                  <p>No main media added yet</p>
                </div>
              )}
            </div>

            {/* BTS Media Section */}
            <div className="space-y-4 pt-4">
              <h3 className="text-lg font-medium text-gray-300 border-b border-gray-800 pb-2">Behind the Scenes</h3>

              {/* BTS Images */}
              {btsImages.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-gray-400">Images</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {btsImages.map((image, index) => (
                      <div key={`bts-image-${index}`} className="relative group">
                        <div className="aspect-video bg-[#0f1520] rounded-md overflow-hidden">
                          <img
                            src={image || "/placeholder.svg"}
                            alt={`BTS image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => removeBtsImage(index)}
                            className="p-1 bg-red-600 rounded-full hover:bg-red-700"
                            title="Remove image"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BTS Videos */}
              {btsVideos.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-gray-400">Videos</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {btsVideos.map((video, index) => (
                      <div key={`bts-video-${index}`} className="relative group">
                        <div className="aspect-video bg-[#0f1520] rounded-md overflow-hidden flex items-center justify-center">
                          {video.includes("youtube.com") ? (
                            <img
                              src={`https://img.youtube.com/vi/${video.split("v=")[1]?.split("&")[0]}/hqdefault.jpg`}
                              alt={`YouTube video ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : video.includes("youtu.be") ? (
                            <img
                              src={`https://img.youtube.com/vi/${video.split("youtu.be/")[1]?.split("?")[0]}/hqdefault.jpg`}
                              alt={`YouTube video ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : video.includes("vimeo.com") ? (
                            <div className="text-gray-400 flex flex-col items-center">
                              <Film size={24} />
                              <span className="text-xs mt-1">Vimeo Video</span>
                            </div>
                          ) : (
                            <div className="text-gray-400 flex flex-col items-center">
                              <Film size={24} />
                              <span className="text-xs mt-1">Video</span>
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            onClick={() => removeBtsVideo(index)}
                            className="p-1 bg-red-600 rounded-full hover:bg-red-700"
                            title="Remove video"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {btsImages.length === 0 && btsVideos.length === 0 && (
                <div className="text-center py-4 text-gray-400">
                  <p>No BTS media added yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom save button */}
        <div className="flex justify-end gap-4 mt-6">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/projects")}
            className="border-gray-700 text-gray-300 hover:bg-[#131a2a]"
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving}
            variant="outline"
            className="border-gray-700 bg-[#0f1520] text-gray-200 hover:bg-[#131a2a]"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Create Project
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
