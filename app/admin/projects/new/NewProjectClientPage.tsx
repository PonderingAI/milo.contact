"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2, ArrowLeft, Save, X, ImageIcon, Film, Calendar, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { extractVideoInfo } from "@/lib/project-data"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import ProjectMediaUploader from "@/components/admin/project-media-uploader"
// Add an import for the Alert component
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SimpleAutocomplete } from "@/components/ui/simple-autocomplete"

export default function NewProjectClientPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingVideo, setProcessingVideo] = useState(false)
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null)
  const [schemaColumns, setSchemaColumns] = useState<string[]>([])
  const [isLoadingSchema, setIsLoadingSchema] = useState(true)

  // Form state - only include basic fields initially
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: "",
    category: "",
    role: "",
    project_date: new Date().toISOString().split("T")[0],
    is_public: true,
  })

  // State to track the role input for tag extraction
  const [roleInput, setRoleInput] = useState("")

  // Media state
  const [btsImages, setBtsImages] = useState<string[]>([])
  const [btsVideos, setBtsVideos] = useState<string[]>([])
  const [mainImages, setMainImages] = useState<string[]>([])
  const [mainVideos, setMainVideos] = useState<string[]>([])
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("")

  // Add state for suggestions
  const [categoryOptions, setCategoryOptions] = useState<string[]>([])
  const [roleOptions, setRoleOptions] = useState<string[]>([])

  // Add refs for the input elements
  const categoryInputRef = useRef<HTMLInputElement>(null)
  const roleInputRef = useRef<HTMLInputElement>(null)

  // Add state for tracking whether autocomplete dropdowns are open
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [isRoleOpen, setIsRoleOpen] = useState(false)

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

  // Add this useEffect to fetch existing categories and roles
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
        // Store video URL in thumbnail_url if that column exists
        if (schemaColumns.includes("thumbnail_url")) {
          setThumbnailUrl(mediaUrl)
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

    // If the removed video was the main video, clear the thumbnail_url
    if (thumbnailUrl === removedVideo) {
      setThumbnailUrl("")
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
    setThumbnailUrl(url)
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
        setThumbnailUrl(url)
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
    } finally {
      setProcessingVideo(false)
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

      // Create a clean data object with only the columns that exist in the database
      const cleanData: Record<string, any> = {}

      // Add all fields from formData that exist in the schema
      Object.entries(formData).forEach(([key, value]) => {
        if (schemaColumns.includes(key)) {
          cleanData[key] = value
        }
      })

      // Add thumbnail_url if it exists in the schema and we have a video
      if (schemaColumns.includes("thumbnail_url") && thumbnailUrl) {
        cleanData.thumbnail_url = thumbnailUrl
      }

      // Log the data being sent to the server
      console.log("Saving project with data:", cleanData)

      // Use the API route instead of direct Supabase client
      const response = await fetch("/api/projects/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create project")
      }

      const result = await response.json()
      const projectId = result.data[0].id

      // Save BTS images if any
      if (btsImages.length > 0) {
        try {
          const btsResponse = await fetch("/api/projects/bts-images", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              projectId,
              images: btsImages,
            }),
          })

          if (!btsResponse.ok) {
            console.error("Error saving BTS images:", await btsResponse.json())
            // Continue anyway, we've already created the project
          }
        } catch (btsError) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
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
        project_date: formData.project_date,
      }

      // Add thumbnail_url if it exists and is not empty
      if (thumbnailUrl) {
        projectData.thumbnail_url = thumbnailUrl.trim()
      }

      // Log the data being sent to the API
      console.log("Sending project data to API:", projectData)

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
    } catch (error: any) {
      console.error("Error saving project:", error)
      setError(error.message || "Failed to save project")
    } finally {
      setSaving(false)
    }
  }

  const validateForm = () => {
    if (!formData.title.trim()) return "Title is required"
    if (!formData.category.trim()) return "Category is required"
    if (!formData.role.trim()) return "Role is required"
    if (!formData.image.trim()) return "Image is required"

    // Validate video URL if provided
    if (thumbnailUrl) {
      const videoInfo = extractVideoInfo(thumbnailUrl)
      if (!videoInfo) return "Invalid video URL. Please use a YouTube, Vimeo, or LinkedIn link."
    }

    return null
  }

  // Find the return statement and add an error display section before the ProjectForm component

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
            disabled={saving || isLoadingSchema}
            size="sm"
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-[#131a2a]"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="mr-1 animate-spin" />
                Creating...
              </>
            ) : isLoadingSchema ? (
              <>
                <Loader2 size={16} className="mr-1 animate-spin" />
                Loading...
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

      {isLoadingSchema && (
        <Alert className="mb-4 max-w-7xl mx-auto bg-blue-900/20 border-blue-800">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          <AlertDescription>Loading database schema...</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="mb-4 max-w-7xl mx-auto bg-red-900/20 border-red-800">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
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

                {/* Replace the category input with Autocomplete (in the Project Details card) */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Category</label>
                  <SimpleAutocomplete
                    ref={categoryInputRef}
                    options={categoryOptions}
                    value={formData.category}
                    onInputChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                    onSelect={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                    placeholder="e.g. Short Film, Music Video"
                    className="border-gray-800 bg-[#0f1520] text-gray-200"
                    allowCustomValues={true}
                    isOpen={isCategoryOpen}
                    onOpenChange={setIsCategoryOpen}
                    onBlur={() => setTimeout(() => setIsCategoryOpen(false), 100)}
                    onFocus={() => setIsCategoryOpen(true)}
                  />
                </div>

                {/* Replace the role input with Autocomplete (in the Project Details card) */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Role/Tags</label>
                  <SimpleAutocomplete
                    ref={roleInputRef}
                    options={roleOptions}
                    value={roleInput}
                    onInputChange={setRoleInput}
                    onSelect={(value) => {
                      setRoleInput(value)
                      setFormData((prev) => ({
                        ...prev,
                        role: value,
                      }))
                    }}
                    placeholder="e.g. Director, 1st AC (comma-separated)"
                    className="border-gray-800 bg-[#0f1520] text-gray-200"
                    allowCustomValues={true}
                    multiple={true}
                    separator=","
                    isOpen={isRoleOpen}
                    onOpenChange={setIsRoleOpen}
                    onBlur={() => setTimeout(() => setIsRoleOpen(false), 100)}
                    onFocus={() => setIsRoleOpen(true)}
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

                {!formData.is_public && schemaColumns.includes("publish_date") && (
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Scheduled Publish Date</label>
                    <div className="relative">
                      <Input
                        type="datetime-local"
                        name="publish_date"
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
                          className={`aspect-video bg-[#0f1520] rounded-md overflow-hidden flex items-center justify-center ${thumbnailUrl === video ? "ring-2 ring-blue-500" : ""}`}
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
                        {thumbnailUrl === video && (
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
            onClick={handleSubmit}
            disabled={saving || isLoadingSchema}
            variant="outline"
            className="border-gray-700 bg-[#0f1520] text-gray-200 hover:bg-[#131a2a]"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Creating...
              </>
            ) : isLoadingSchema ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Loading...
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
      {/* Add this error display section */}
      <div className="mb-6" id="error-display">
        {/* This div will be used by client-side JavaScript to display errors */}
      </div>
    </div>
  )
}

// Also add a simple script to capture and display API errors
export function Script() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          // Capture fetch errors
          const originalFetch = window.fetch;
          window.fetch = async function(...args) {
            try {
              const response = await originalFetch(...args);
              
              // If this is a project creation request and it failed
              if (args[0] === '/api/projects/create' && !response.ok) {
                const data = await response.clone().json();
                const errorDiv = document.getElementById('error-display');
                if (errorDiv) {
                  errorDiv.innerHTML = \`
                    <div class="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-4">
                      <div class="flex">
                        <svg class="h-5 w-5 text-red-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p class="font-medium">Error creating project: \${data.error || 'Unknown error'}</p>
                          <p class="text-sm mt-1">\${data.details ? JSON.stringify(data.details) : ''}</p>
                          <p class="text-sm mt-1">Received data: \${JSON.stringify(data.receivedData || {})}</p>
                        </div>
                      </div>
                    </div>
                  \`;
                }
              }
              
              return response;
            } catch (error) {
              console.error('Fetch error:', error);
              throw error;
            }
          };
        `,
      }}
    />
  )
}
