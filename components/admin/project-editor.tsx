"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { extractVideoInfo } from "@/lib/project-data"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, Calendar, Film, ImageIcon, X, ArrowLeft, Save } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { SimpleAutocomplete } from "@/components/ui/simple-autocomplete"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import UnifiedMediaInput from "@/components/admin/unified-media-input"
import ProjectEditorErrorBoundary from "@/components/admin/project-editor-error-boundary"

interface ProjectEditorProps {
  project?: {
    id: string
    title: string
    category: string
    type?: string
    role: string
    image: string
    thumbnail_url?: string
    description?: string
    is_public?: boolean
    tags?: string[]
    project_date?: string
  }
  mode: "create" | "edit"
}

function ProjectEditorComponent({ project, mode }: ProjectEditorProps) {
  // Add a ref to track if component is mounted
  const isMountedRef = useRef(true)
  
  const [formData, setFormData] = useState({
    title: project?.title || "",
    category: project?.category || "",
    role: project?.role || "",
    image: project?.image || "",
    thumbnail_url: project?.thumbnail_url || "",
    description: project?.description || "",
    project_date: project?.project_date || new Date().toISOString().split("T")[0],
    is_public: project?.is_public !== undefined ? project.is_public : true,
  })

  // Derived state for private toggle based on project_date
  const isPrivate = formData.project_date ? new Date(formData.project_date) > new Date() : !formData.is_public

  // State to track the role input for tag extraction
  const [roleInput, setRoleInput] = useState(project?.role || "")

  // State for suggestions
  const [categoryOptions, setCategoryOptions] = useState<string[]>([])
  const [roleOptions, setRoleOptions] = useState<string[]>([])

  // State for autocomplete dropdowns
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [isRoleOpen, setIsRoleOpen] = useState(false)

  // Media state
  const [btsImages, setBtsImages] = useState<string[]>([])
  const [btsVideos, setBtsVideos] = useState<string[]>([])
  const [mainImages, setMainImages] = useState<string[]>([])
  const [mainVideos, setMainVideos] = useState<string[]>([])
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(project?.thumbnail_url || "")

  // Refs for input elements
  const categoryInputRef = useRef<HTMLInputElement>(null)
  const roleInputRef = useRef<HTMLInputElement>(null)

  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessingVideo, setIsProcessingVideo] = useState(false)
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null)
  const [isUsingVideoThumbnail, setIsUsingVideoThumbnail] = useState(false)
  const [videoReleaseDates, setVideoReleaseDates] = useState<Map<string, Date>>(new Map())
  const [schemaColumns, setSchemaColumns] = useState<string[]>([])
  const [isLoadingSchema, setIsLoadingSchema] = useState(true)
  const [isLoadingBtsImages, setIsLoadingBtsImages] = useState(mode === "edit")
  const [processedVideoUrls, setProcessedVideoUrls] = useState<Set<string>>(new Set())
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  // Cleanup effect to track component mount status
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Safe state setter that checks if component is still mounted
  const safeSetFormData = useCallback((updater: any) => {
    if (isMountedRef.current) {
      try {
        setFormData(updater)
      } catch (error) {
        console.error("safeSetFormData: Error updating form data:", error)
      }
    } else {
      console.warn("safeSetFormData: Attempted to update form data after component unmounted")
    }
  }, [])

  const safeSetMainVideos = useCallback((updater: any) => {
    if (isMountedRef.current) {
      try {
        setMainVideos(updater)
      } catch (error) {
        console.error("safeSetMainVideos: Error updating main videos:", error)
      }
    } else {
      console.warn("safeSetMainVideos: Attempted to update main videos after component unmounted")
    }
  }, [])

  const safeSetMainImages = useCallback((updater: any) => {
    if (isMountedRef.current) {
      try {
        setMainImages(updater)
      } catch (error) {
        console.error("safeSetMainImages: Error updating main images:", error)
      }
    } else {
      console.warn("safeSetMainImages: Attempted to update main images after component unmounted")
    }
  }, [])

  const safeSetThumbnailUrl = useCallback((url: string) => {
    if (isMountedRef.current) {
      try {
        setThumbnailUrl(url)
      } catch (error) {
        console.error("safeSetThumbnailUrl: Error updating thumbnail URL:", error)
      }
    } else {
      console.warn("safeSetThumbnailUrl: Attempted to update thumbnail URL after component unmounted")
    }
  }, [])

  const safeSetVideoThumbnail = useCallback((thumbnail: string) => {
    if (isMountedRef.current) {
      try {
        setVideoThumbnail(thumbnail)
      } catch (error) {
        console.error("safeSetVideoThumbnail: Error updating video thumbnail:", error)
      }
    } else {
      console.warn("safeSetVideoThumbnail: Attempted to update video thumbnail after component unmounted")
    }
  }, [])

  // Fetch the actual schema columns when the component mounts
  useEffect(() => {
    async function fetchSchema() {
      try {
        setIsLoadingSchema(true)
        console.log("fetchSchema: Starting schema detection")
        
        // First try to get the schema from our API
        const response = await fetch("/api/check-projects-schema")

        if (response.ok) {
          const data = await response.json()
          console.log("fetchSchema: API response received:", data)
          
          if (data.exists && data.columns && Array.isArray(data.columns)) {
            const columnNames = data.columns.map((col: any) => col.column_name)
            setSchemaColumns(columnNames)
            console.log("fetchSchema: Successfully loaded schema columns:", columnNames)
            
            // Log any warnings or method used
            if (data.method) {
              console.log(`fetchSchema: Schema loaded using method: ${data.method}`)
            }
            if (data.warning) {
              console.warn(`fetchSchema: Schema warning: ${data.warning}`)
            }
          } else if (!data.exists) {
            console.warn("fetchSchema: API reports projects table does not exist, using fallback")
            // Use fallback columns even if API says table doesn't exist
            const fallbackColumns = [
              "id",
              "title",
              "description",
              "image",
              "category",
              "role",
              "project_date",
              "is_public",
              "thumbnail_url",
              "created_at",
              "updated_at",
            ]
            setSchemaColumns(fallbackColumns)
            console.log("fetchSchema: Using fallback schema columns:", fallbackColumns)
          }
        } else {
          console.warn(`fetchSchema: API request failed with status ${response.status}, using direct fallback`)
          
          // Fallback: direct query to get columns
          try {
            const { data, error } = await supabase.from("projects").select("*").limit(1)

            if (!error && data) {
              // Extract column names from the first row
              const sampleRow = data[0] || {}
              const columnNames = Object.keys(sampleRow)
              setSchemaColumns(columnNames)
              console.log("fetchSchema: Direct fallback successful, columns:", columnNames)
            } else {
              console.warn("fetchSchema: Direct fallback failed, using hardcoded defaults")
              // Set default columns as a last resort
              const defaultColumns = [
                "id",
                "title",
                "description",
                "image",
                "category",
                "role",
                "project_date",
                "is_public",
                "thumbnail_url",
                "created_at",
                "updated_at",
              ]
              setSchemaColumns(defaultColumns)
              console.log("fetchSchema: Using hardcoded default columns:", defaultColumns)
            }
          } catch (fallbackError) {
            console.error("fetchSchema: Direct fallback failed with exception:", fallbackError)
            // Use hardcoded defaults
            const defaultColumns = [
              "id",
              "title",
              "description",
              "image",
              "category",
              "role",
              "project_date",
              "is_public",
              "thumbnail_url",
              "created_at",
              "updated_at",
            ]
            setSchemaColumns(defaultColumns)
            console.log("fetchSchema: Exception fallback, using defaults:", defaultColumns)
          }
        }
      } catch (err) {
        console.error("fetchSchema: Unexpected error during schema detection:", err)
        // Always provide a working set of columns
        const defaultColumns = [
          "id",
          "title",
          "description",
          "image",
          "category",
          "role",
          "project_date",
          "is_public",
          "thumbnail_url",
          "created_at",
          "updated_at",
        ]
        setSchemaColumns(defaultColumns)
        console.log("fetchSchema: Error fallback, using defaults:", defaultColumns)
      } finally {
        setIsLoadingSchema(false)
        console.log("fetchSchema: Schema detection completed")
      }
    }

    fetchSchema()
  }, [supabase])

  // Fetch existing categories and roles for suggestions
  useEffect(() => {
    async function fetchExistingValues() {
      try {
        const supabase = getSupabaseBrowserClient()

        // Fetch categories
        const { data: categoryData } = await supabase.from("projects").select("category")

        if (categoryData && Array.isArray(categoryData)) {
          const categories = categoryData
            .map((item) => item?.category)
            .filter((category) => category && typeof category === 'string')
          setCategoryOptions([...new Set(categories)])
        }

        // Fetch roles
        const { data: roleData } = await supabase.from("projects").select("role")

        if (roleData && Array.isArray(roleData)) {
          // Split comma-separated roles and flatten the array
          const roles = roleData
            .flatMap((item) => {
              if (item?.role && typeof item.role === 'string') {
                return item.role.split(",").map((r: string) => r.trim())
              }
              return []
            })
            .filter((role) => role && typeof role === 'string')
          setRoleOptions([...new Set(roles)])
        }
      } catch (err) {
        console.error("Error fetching existing values:", err)
      }
    }

    fetchExistingValues()
  }, [])

  // Fetch BTS images if in edit mode
  useEffect(() => {
    if (mode === "edit" && project?.id) {
      async function fetchBtsImages() {
        try {
          setIsLoadingBtsImages(true)
          const response = await fetch(`/api/projects/bts-images/${project.id}`)

          if (response.ok) {
            const data = await response.json()
            if (data.images && Array.isArray(data.images)) {
              // Separate images and videos
              const images: string[] = []
              const videos: string[] = []

              data.images.forEach((url: string) => {
                const isVideo =
                  url.match(/\.(mp4|webm|ogg|mov)$/) !== null ||
                  url.includes("youtube.com") ||
                  url.includes("vimeo.com") ||
                  url.includes("youtu.be")

                if (isVideo) {
                  videos.push(url)
                } else {
                  images.push(url)
                }
              })

              setBtsImages(images)
              setBtsVideos(videos)
            }
          }
        } catch (err) {
          console.error("Error fetching BTS images:", err)
        } finally {
          setIsLoadingBtsImages(false)
        }
      }

      fetchBtsImages()
    }
  }, [mode, project?.id])

  // Fetch main images and videos if in edit mode
  useEffect(() => {
    if (mode === "edit" && project) {
      // Set the main image
      if (project.image) {
        setMainImages([project.image])
      }

      // Set the main video if thumbnail_url exists
      if (project.thumbnail_url) {
        setMainVideos([project.thumbnail_url])
        setThumbnailUrl(project.thumbnail_url)
      }
    }
  }, [mode, project])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    if (name === 'project_date') {
      // Automatically update is_public based on whether the date is in the future
      const isInFuture = value && new Date(value) > new Date()
      setFormData((prev) => ({ 
        ...prev, 
        [name]: value, 
        is_public: !isInFuture 
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
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

  const handlePrivateToggle = (isPrivate: boolean) => {
    if (isPrivate) {
      // If toggling to private, set project_date to tomorrow if not already set to a future date
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const currentProjectDate = formData.project_date ? new Date(formData.project_date) : null
      
      setFormData((prev) => ({ 
        ...prev, 
        is_public: false,
        project_date: (currentProjectDate && currentProjectDate > new Date()) ? prev.project_date : tomorrow.toISOString().split("T")[0]
      }))
    } else {
      // If toggling to public, preserve the current date - don't automatically change it
      setFormData((prev) => ({ 
        ...prev, 
        is_public: true
        // Removed automatic date override - preserve user's chosen date
      }))
    }
  }


  const handleImageUpload = (url: string) => {
    setFormData((prev) => ({ ...prev, image: url }))
    setIsUsingVideoThumbnail(false)

    // Add to mainImages if not already there
    if (!mainImages.includes(url)) {
      setMainImages((prev) => [...prev, url])
    }
  }

  // Helper function to format date for input field
  function formatDateForInput(date: Date): string {
    return date.toISOString().split("T")[0]
  }

  // Helper function to extract date from file metadata
  async function extractDateFromMedia(url: string, type: "image" | "video"): Promise<Date | null> {
    try {
      if (type === "video") {
        // For videos, we'll skip the API call here since it requires server-side access
        // The video processing API endpoint will handle this instead
        return null
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

  // Video display component with tooltip for release date
  const VideoDisplayWithTooltip = ({ 
    video, 
    index, 
    onSetMain, 
    onRemove, 
    isMain = false, 
    type = "main" 
  }: {
    video: string
    index: number
    onSetMain?: () => void
    onRemove: () => void
    isMain?: boolean
    type?: "main" | "bts"
  }) => {
    const [releaseDate, setReleaseDate] = useState<string | null>(null)
    const [isLoadingDate, setIsLoadingDate] = useState(false)

    const fetchReleaseDate = async () => {
      if (releaseDate || isLoadingDate) return
      
      setIsLoadingDate(true)
      try {
        const date = await getVideoReleaseDate(video)
        setReleaseDate(date)
      } finally {
        setIsLoadingDate(false)
      }
    }

    const getVideoInfo = () => {
      if (video.includes("youtube.com") || video.includes("youtu.be")) {
        return { platform: "YouTube", thumbnail: getVideoThumbnail() }
      } else if (video.includes("vimeo.com")) {
        return { platform: "Vimeo", thumbnail: null }
      }
      return { platform: "Video", thumbnail: null }
    }

    const videoInfo = getVideoInfo()

    const getVideoThumbnail = () => {
      if (video.includes("youtube.com")) {
        return `https://img.youtube.com/vi/${video.split("v=")[1]?.split("&")[0]}/hqdefault.jpg`
      } else if (video.includes("youtu.be")) {
        return `https://img.youtube.com/vi/${video.split("youtu.be/")[1]?.split("?")[0]}/hqdefault.jpg`
      }
      return null
    }

    const thumbnailUrl = videoInfo.thumbnail

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className="relative group cursor-pointer"
              onMouseEnter={fetchReleaseDate}
            >
              <div
                className={`aspect-video bg-[#0f1520] rounded-md overflow-hidden flex items-center justify-center ${
                  isMain ? "ring-2 ring-blue-500" : ""
                }`}
              >
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt={`${videoInfo.platform} video ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : videoInfo.platform === "Vimeo" ? (
                  <div className="text-gray-400 flex flex-col items-center">
                    <Film size={24} />
                    <span className="text-xs mt-1">Vimeo Video</span>
                  </div>
                ) : (
                  <div className="text-gray-400 flex flex-col items-center">
                    <Film size={24} />
                    <span className="text-xs mt-1">{videoInfo.platform}</span>
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {onSetMain && (
                  <button
                    type="button"
                    onClick={onSetMain}
                    className="p-1 bg-blue-600 rounded-full hover:bg-blue-700"
                    title="Set as main video"
                  >
                    <Film size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onRemove}
                  className="p-1 bg-red-600 rounded-full hover:bg-red-700"
                  title="Remove video"
                >
                  <X size={14} />
                </button>
              </div>
              {isMain && (
                <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-sm">
                  Main
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              {isLoadingDate ? (
                "Loading release date..."
              ) : releaseDate ? (
                <>
                  <div className="font-medium">{videoInfo.platform} Release Date</div>
                  <div>{releaseDate}</div>
                </>
              ) : videoInfo.platform === "YouTube" ? (
                <>
                  <div className="font-medium">{videoInfo.platform} Video</div>
                  <div className="text-xs text-gray-400">Release date requires YouTube Data API</div>
                </>
              ) : (
                <>
                  <div className="font-medium">{videoInfo.platform} Video</div>
                  <div className="text-xs text-gray-400">Release date not available</div>
                </>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Function to get video release date for tooltip display
  const getVideoReleaseDate = async (videoUrl: string): Promise<string | null> => {
    // Check if we already have this date cached
    if (videoReleaseDates.has(videoUrl)) {
      const date = videoReleaseDates.get(videoUrl)
      return date ? date.toLocaleDateString() : null
    }

    // For now, return null since we're handling video date extraction server-side
    return null
  }

  // Function to process external videos and extract dates
  const processExternalVideo = async (mediaUrl: string) => {
    const toastId = toast({
      title: "Processing video",
      description: "Extracting video information and date...",
    })

    setIsProcessingVideo(true)

    try {
      // Extract date from video if project_date is empty
      if (!formData.project_date) {
        const date = await extractDateFromMedia(mediaUrl, "video")
        if (date) {
          setFormData((prev) => ({ ...prev, project_date: formatDateForInput(date) }))
        }
      }

      toast({
        id: toastId,
        title: "Video processed",
        description: "Video information has been processed",
      })
    } catch (error) {
      console.error("Error processing video:", error)
      toast({
        id: toastId,
        title: "Error processing video",
        description: error instanceof Error ? error.message : "Failed to process video URL",
        variant: "destructive",
      })
    } finally {
      setIsProcessingVideo(false)
    }
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
          setFormData((prev) => ({ ...prev, thumbnail_url: mediaUrl }))

          // Process video to extract metadata
          try {
            // For videos from media library, try to get metadata from the library
            const supabase = getSupabaseBrowserClient()
            const { data: mediaData } = await supabase
              .from("media")
              .select("filename, metadata, thumbnail_url")
              .eq("public_url", mediaUrl)
              .maybeSingle()

            if (mediaData) {
              // If we have media data, use it
              console.log("Found video in media library:", mediaData)

              // Set title if empty
              if (!formData.title && mediaData.filename) {
                setFormData((prev) => ({ ...prev, title: mediaData.filename }))
              }

              // Use thumbnail if available
              if (mediaData.thumbnail_url && !formData.image) {
                setFormData((prev) => ({ ...prev, image: mediaData.thumbnail_url }))
                if (!mainImages.includes(mediaData.thumbnail_url)) {
                  setMainImages((prev) => [...prev, mediaData.thumbnail_url])
                }
              }

              // Extract date if available
              if (mediaData.metadata?.uploadDate && !formData.project_date) {
                const date = new Date(mediaData.metadata.uploadDate)
                setFormData((prev) => ({ ...prev, project_date: formatDateForInput(date) }))
              }
            } else {
              // If not in media library, process as external video and extract date
              await processExternalVideo(mediaUrl)
            }
          } catch (error) {
            console.error("Error processing video from media library:", error)
            // Fall back to regular processing
            await processExternalVideo(mediaUrl)
          }
        }
      } else {
        if (!mainImages.includes(mediaUrl)) {
          setMainImages((prev) => [...prev, mediaUrl])
          console.log("Added image to mainImages:", mediaUrl)
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
    console.log("handleBtsMediaSelect received URLs:", urls)

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
          console.log("Added video to btsVideos:", mediaUrl)
        }
      } else {
        if (!btsImages.includes(mediaUrl)) {
          setBtsImages((prev) => [...prev, mediaUrl])
          console.log("Added image to btsImages:", mediaUrl)
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
      setFormData((prev) => ({ ...prev, thumbnail_url: "" }))
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
    setFormData((prev) => ({ ...prev, thumbnail_url: url }))
  }

  const addMainVideoUrl = async (url: string) => {
    if (!url?.trim()) return

    // Add unique execution ID to track multiple calls
    const executionId = Math.random().toString(36).substr(2, 9)
    console.log(`=== addMainVideoUrl [${executionId}]: Function entry ===`)
    console.log(`addMainVideoUrl [${executionId}]: Input URL:`, url)
    console.log(`addMainVideoUrl [${executionId}]: isProcessingVideo:`, isProcessingVideo)

    // Prevent duplicate calls - this might be the real issue
    if (isProcessingVideo) {
      console.warn(`addMainVideoUrl [${executionId}]: Already processing video, ignoring duplicate call`)
      return
    }

    // Mark this URL as processed to prevent useEffect from reprocessing it
    setProcessedVideoUrls(prev => new Set([...prev, url]))
    console.log(`addMainVideoUrl [${executionId}]: Marked URL as processed:`, url)

    setIsProcessingVideo(true)
    let toastId: string | undefined

    try {
      toastId = toast({
        title: "Processing video",
        description: "Fetching video information...",
      }).id
      
      console.log(`addMainVideoUrl [${executionId}]: Starting video processing`)
        
        // Use the new API route to process the video URL
        const response = await fetch("/api/process-video-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      console.log("addMainVideoUrl: API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown API error" }))
        console.error("addMainVideoUrl: API error response:", errorData)
        throw new Error(errorData.error || "Failed to process video URL")
      }

      const result = await response.json()
      console.log(`addMainVideoUrl [${executionId}]: Video processing result:`, result)
      console.log(`addMainVideoUrl [${executionId}]: Result type:`, typeof result)
      console.log(`addMainVideoUrl [${executionId}]: Result is object:`, result && typeof result === 'object')
      console.log(`addMainVideoUrl [${executionId}]: Result has duplicate property:`, result && 'duplicate' in result)

      // Validate the response structure with extra safety
      try {
        if (!result || typeof result !== 'object') {
          console.error(`addMainVideoUrl [${executionId}]: Invalid response format:`, result)
          throw new Error("Invalid response from video processing API")
        }
        console.log(`addMainVideoUrl [${executionId}]: Response validation passed`)
      } catch (validationError) {
        console.error(`addMainVideoUrl [${executionId}]: Error during response validation:`, validationError)
        throw validationError
      }

      // Handle duplicate case with ultra-defensive programming
      console.log(`addMainVideoUrl [${executionId}]: About to check result.duplicate`)
      console.log(`addMainVideoUrl [${executionId}]: result at this point:`, result)
      console.log(`addMainVideoUrl [${executionId}]: typeof result:`, typeof result)
      console.log(`addMainVideoUrl [${executionId}]: result.hasOwnProperty('duplicate'):`, result ? result.hasOwnProperty('duplicate') : 'result is null/undefined')
      
      // Ultra-defensive duplicate checking with multiple fallback strategies
      let isDuplicate = false
      let safeResult = null
      
      try {
        // Strategy 1: Direct property access with existence check
        if (result && typeof result === 'object' && 'duplicate' in result) {
          isDuplicate = Boolean(result.duplicate)
          safeResult = result
          console.log(`addMainVideoUrl [${executionId}]: Strategy 1 success - isDuplicate:`, isDuplicate)
        } else {
          console.log(`addMainVideoUrl [${executionId}]: Strategy 1 failed - result structure invalid`)
        }
      } catch (strategyError) {
        console.error(`addMainVideoUrl [${executionId}]: Strategy 1 error:`, strategyError)
        
        // Strategy 2: JSON parse/stringify to eliminate reference issues
        try {
          const resultStr = JSON.stringify(result)
          const parsedResult = JSON.parse(resultStr)
          if (parsedResult && typeof parsedResult === 'object' && 'duplicate' in parsedResult) {
            isDuplicate = Boolean(parsedResult.duplicate)
            safeResult = parsedResult
            console.log(`addMainVideoUrl [${executionId}]: Strategy 2 success - isDuplicate:`, isDuplicate)
          } else {
            console.log(`addMainVideoUrl [${executionId}]: Strategy 2 failed - parsed result invalid`)
          }
        } catch (strategyError2) {
          console.error(`addMainVideoUrl [${executionId}]: Strategy 2 error:`, strategyError2)
          
          // Strategy 3: Property descriptor check
          try {
            const descriptor = Object.getOwnPropertyDescriptor(result, 'duplicate')
            if (descriptor) {
              isDuplicate = Boolean(descriptor.value)
              safeResult = result
              console.log(`addMainVideoUrl [${executionId}]: Strategy 3 success - isDuplicate:`, isDuplicate)
            } else {
              console.log(`addMainVideoUrl [${executionId}]: Strategy 3 failed - no property descriptor`)
            }
          } catch (strategyError3) {
            console.error(`addMainVideoUrl [${executionId}]: All strategies failed:`, strategyError3)
            // Default to false and continue processing
            isDuplicate = false
            safeResult = result
          }
        }
      }
      
      console.log(`addMainVideoUrl [${executionId}]: Final isDuplicate value:`, isDuplicate)
      console.log(`addMainVideoUrl [${executionId}]: Final safeResult:`, safeResult)
      
      if (isDuplicate && safeResult) {
          console.log(`addMainVideoUrl [${executionId}]: Video already exists, adding to interface`)
          console.log(`addMainVideoUrl [${executionId}]: Duplicate result:`, JSON.stringify(result, null, 2))
          
          // Video already exists, add it to the interface but don't create a new database entry
          if (!mainVideos.includes(url)) {
          console.log("addMainVideoUrl: Adding existing video to interface:", url)
          try {
            // Use direct state updates instead of functional updates to avoid corruption
            const newMainVideos = [...mainVideos, url]
            console.log("addMainVideoUrl: Setting main videos directly:", newMainVideos)
            setMainVideos(newMainVideos)
            
            setThumbnailUrl(url)
            
            const newFormData = { ...formData, thumbnail_url: url }
            console.log("addMainVideoUrl: Setting form data directly:", newFormData)
            setFormData(newFormData)
            
            console.log("addMainVideoUrl: Successfully updated interface state for existing video")
          } catch (stateError) {
            console.error("addMainVideoUrl: Error updating interface state for existing video:", stateError)
            // Continue processing even if state update fails
          }
        }

        // Use existing video data if available - ultra-defensive programming
        let existingVideo = null
        
        try {
          // Safe extraction of existingVideo property
          if (safeResult && typeof safeResult === 'object' && 'existingVideo' in safeResult) {
            existingVideo = safeResult.existingVideo
          }
        } catch (extractError) {
          console.error(`addMainVideoUrl [${executionId}]: Error extracting existingVideo:`, extractError)
          existingVideo = null
        }
        
        console.log(`addMainVideoUrl [${executionId}]: Examining existingVideo:`, typeof existingVideo, existingVideo)
        
        if (existingVideo && typeof existingVideo === 'object' && existingVideo !== null) {
          console.log("addMainVideoUrl: Using existing video data:", existingVideo)
          
          // Safely extract properties with fallbacks
          const thumbnailUrl = typeof existingVideo.thumbnail_url === 'string' ? existingVideo.thumbnail_url : null
          const filename = typeof existingVideo.filename === 'string' ? existingVideo.filename : null
          const metadata = existingVideo.metadata && typeof existingVideo.metadata === 'object' ? existingVideo.metadata : {}
          
          // Use React's automatic batching for state updates
          try {
            console.log("addMainVideoUrl: Processing existing video metadata...")
            
            // If we have a thumbnail and no image is set, use the thumbnail
            if (thumbnailUrl && !formData.image && !mainImages.includes(thumbnailUrl)) {
              console.log("addMainVideoUrl: Setting thumbnail as main image:", thumbnailUrl)
              try {
                const newFormData = { ...formData, image: thumbnailUrl }
                console.log("addMainVideoUrl: Setting form data with image directly:", newFormData)
                setFormData(newFormData)
                
                setVideoThumbnail(thumbnailUrl)
                
                const newMainImages = [...mainImages, thumbnailUrl]
                console.log("addMainVideoUrl: Setting main images directly:", newMainImages)
                setMainImages(newMainImages)
                
                console.log("addMainVideoUrl: Successfully set thumbnail as main image")
              } catch (thumbnailError) {
                console.error("addMainVideoUrl: Error setting thumbnail as main image:", thumbnailError)
              }
            }

            // If project title is empty, use video title
            if (!formData.title && filename) {
              console.log("addMainVideoUrl: Setting video filename as title:", filename)
              try {
                const newFormData = { ...formData, title: filename }
                console.log("addMainVideoUrl: Setting form data with title directly:", newFormData)
                setFormData(newFormData)
                console.log("addMainVideoUrl: Successfully set video title")
              } catch (titleError) {
                console.error("addMainVideoUrl: Error setting video title:", titleError)
              }
            }

            // If project date is empty and we have metadata with upload date, use it
            if (!formData.project_date && metadata.uploadDate) {
              console.log("addMainVideoUrl: Processing upload date from metadata...")
              try {
                console.log("addMainVideoUrl: Parsing upload date:", metadata.uploadDate)
                const date = new Date(metadata.uploadDate)
                if (!isNaN(date.getTime())) {
                  const formattedDate = formatDateForInput(date)
                  console.log("addMainVideoUrl: Setting project date:", formattedDate)
                  try {
                    const newFormData = { ...formData, project_date: formattedDate }
                    console.log("addMainVideoUrl: Setting form data with date directly:", newFormData)
                    setFormData(newFormData)
                    console.log("addMainVideoUrl: Successfully set project date")
                  } catch (dateSetError) {
                    console.error("addMainVideoUrl: Error setting project date:", dateSetError)
                  }
                } else {
                  console.warn("addMainVideoUrl: Invalid date parsed from metadata:", metadata.uploadDate)
                }
              } catch (dateError) {
                console.warn("addMainVideoUrl: Error parsing upload date:", dateError)
              }
            }
            
            console.log("addMainVideoUrl: Completed processing existing video metadata")
          } catch (stateError) {
            console.error("addMainVideoUrl: Error during state updates:", stateError)
            // Continue processing even if state updates fail
          }
        } else {
          console.warn("addMainVideoUrl: Existing video data is not in expected format:", {
            type: typeof existingVideo,
            value: existingVideo,
            isNull: existingVideo === null,
            isArray: Array.isArray(existingVideo)
          })
        }

        // Display success message with safe toast handling
        const message = (result.message && typeof result.message === 'string') 
          ? result.message 
          : "Video was already in the media library and has been added to this project"
        
        console.log("addMainVideoUrl: Displaying success toast for existing video")
        try {
          if (toastId) {
            toast({
              id: toastId,
              title: "Video already exists",
              description: message,
            })
          } else {
            toast({
              title: "Video already exists",
              description: message,
            })
          }
        } catch (toastError) {
          console.error("addMainVideoUrl: Error showing success toast:", toastError)
        }
        console.log("addMainVideoUrl: Completed processing for existing video")
        return
      }

      // Handle new video case - also with validation
      console.log("addMainVideoUrl: Processing new video")
      
      // Add to mainVideos if not already in the list
      if (!mainVideos.includes(url)) {
        setMainVideos((prev) => [...prev, url])
        setThumbnailUrl(url)
        setFormData((prev) => ({ ...prev, thumbnail_url: url }))
      }

      // Safely extract properties from result
      const thumbnailUrl = typeof result.thumbnailUrl === 'string' ? result.thumbnailUrl : null
      const title = typeof result.title === 'string' ? result.title : null
      const uploadDate = typeof result.uploadDate === 'string' ? result.uploadDate : null

      // Use React's automatic batching for new videos
      try {
        // If we have a thumbnail and no image is set, use the thumbnail
        if (thumbnailUrl && !formData.image && !mainImages.includes(thumbnailUrl)) {
          console.log("addMainVideoUrl: Setting new video thumbnail as main image:", thumbnailUrl)
          setFormData((prev) => ({ ...prev, image: thumbnailUrl }))
          setVideoThumbnail(thumbnailUrl)
          setMainImages((prev) => [...prev, thumbnailUrl])
        }

        // If project title is empty, use video title
        if (!formData.title && title) {
          console.log("addMainVideoUrl: Setting new video title:", title)
          setFormData((prev) => ({ ...prev, title }))
        }

        // If project date is empty and we have an upload date, use it
        if (!formData.project_date && uploadDate) {
          try {
            const date = new Date(uploadDate)
            if (!isNaN(date.getTime())) {
              const formattedDate = formatDateForInput(date)
              console.log("addMainVideoUrl: Setting project date from new video:", formattedDate)
              setFormData((prev) => ({ ...prev, project_date: formattedDate }))
            }
          } catch (dateError) {
            console.warn("addMainVideoUrl: Error parsing new video upload date:", dateError)
          }
        }
      } catch (stateError) {
        console.error("addMainVideoUrl: Error during new video state updates:", stateError)
      }

      console.log("addMainVideoUrl: Displaying success toast for new video")
      try {
        if (toastId) {
          toast({
            id: toastId,
            title: "Video added",
            description: "Video has been added to the project and media library",
          })
        } else {
          toast({
            title: "Video added",
            description: "Video has been added to the project and media library",
          })
        }
      } catch (toastError) {
        console.error("addMainVideoUrl: Error showing success toast for new video:", toastError)
      }
    } catch (error) {
      console.error("addMainVideoUrl: Error processing video:", error)
      console.error("addMainVideoUrl: Error details:", {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })
      
      try {
        if (toastId) {
          toast({
            id: toastId,
            title: "Error adding video",
            description: error instanceof Error ? error.message : "Failed to process video URL",
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error adding video",
            description: error instanceof Error ? error.message : "Failed to process video URL",
            variant: "destructive",
          })
        }
      } catch (toastError) {
        console.error("addMainVideoUrl: Error showing error toast:", toastError)
        // Last resort - try to show a generic error message
        try {
          toast({
            title: "Error",
            description: "An error occurred while processing the video",
            variant: "destructive",
          })
        } catch (finalToastError) {
          console.error("addMainVideoUrl: Failed to show any error toast:", finalToastError)
        }
      }
    } finally {
      console.log("addMainVideoUrl: Cleaning up...")
      try {
        setIsProcessingVideo(false)
      } catch (cleanupError) {
        console.error("addMainVideoUrl: Error during cleanup:", cleanupError)
      }
      console.log("addMainVideoUrl: Function completed")
    }
  }

  const addBtsVideoUrl = async (url: string) => {
    if (!url.trim()) return

    const toastId = toast({
      title: "Processing BTS video",
      description: "Fetching video information...",
    }).id

    try {
      console.log("addBtsVideoUrl: Starting BTS video processing for URL:", url)
      
      // Use the new API route to process the video URL
      const response = await fetch("/api/process-video-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, isBts: true }),
      })

      console.log("addBtsVideoUrl: API response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("addBtsVideoUrl: API error response:", errorData)
        throw new Error(errorData.error || "Failed to process video URL")
      }

      const result = await response.json()
      console.log("addBtsVideoUrl: BTS video processing result:", result)

      // Validate the response structure
      if (!result || typeof result !== 'object') {
        console.error("addBtsVideoUrl: Invalid response format:", result)
        throw new Error("Invalid response from video processing API")
      }

      // Handle duplicate case with defensive programming
      if (result.duplicate) {
        console.log("addBtsVideoUrl: Video already exists, adding to interface")
        console.log("addBtsVideoUrl: Duplicate result:", JSON.stringify(result, null, 2))
        
        // Video already exists, add it to the interface but don't create a new database entry
        if (!btsVideos.includes(url)) {
          // Use batched state updates to prevent rendering issues
          setTimeout(() => {
            setBtsVideos((prev) => [...prev, url])
          }, 0)
        }

        // Use existing video data if available - defensive programming with extensive validation
        const existingVideo = result.existingVideo
        console.log("addBtsVideoUrl: Examining existingVideo:", typeof existingVideo, existingVideo)
        
        if (existingVideo && typeof existingVideo === 'object' && existingVideo !== null) {
          console.log("addBtsVideoUrl: Using existing video data for BTS")
          
          // Safely extract thumbnail_url with validation
          const thumbnailUrl = typeof existingVideo.thumbnail_url === 'string' ? existingVideo.thumbnail_url : null
          
          if (thumbnailUrl && !btsImages.includes(thumbnailUrl)) {
            console.log("addBtsVideoUrl: Adding existing video thumbnail to BTS images:", thumbnailUrl)
            // Use batched state updates
            setTimeout(() => {
              setBtsImages((prev) => [...prev, thumbnailUrl])
            }, 0)
          }
        } else {
          console.warn("addBtsVideoUrl: Existing video data is not in expected format:", {
            type: typeof existingVideo,
            value: existingVideo,
            isNull: existingVideo === null,
            isArray: Array.isArray(existingVideo)
          })
        }

        // Display success message
        const message = (result.message && typeof result.message === 'string') 
          ? result.message 
          : "Video was already in the media library and has been added to BTS"
        
        toast({
          id: toastId,
          title: "BTS video already exists",
          description: message,
        })
        return
      }

      // Handle new video case - also with validation
      console.log("addBtsVideoUrl: Processing new BTS video")
      
      // Add to BTS videos if not already in the list
      if (!btsVideos.includes(url)) {
        // Use batched state updates
        setTimeout(() => {
          setBtsVideos((prev) => [...prev, url])
        }, 0)
      }

      // Safely extract properties from result
      const thumbnailUrl = typeof result.thumbnailUrl === 'string' ? result.thumbnailUrl : null

      // Add thumbnail to BTS images if available and not already in the list
      if (thumbnailUrl && !btsImages.includes(thumbnailUrl)) {
        console.log("addBtsVideoUrl: Adding new video thumbnail to BTS images:", thumbnailUrl)
        // Use batched state updates
        setTimeout(() => {
          setBtsImages((prev) => [...prev, thumbnailUrl])
        }, 0)
      }

      toast({
        id: toastId,
        title: "BTS Video added",
        description: "Behind the scenes video has been added to the project",
      })
    } catch (error) {
      console.error("addBtsVideoUrl: Error processing BTS video:", error)
      toast({
        id: toastId,
        title: "Error adding BTS video",
        description: error instanceof Error ? error.message : "Failed to process video URL",
        variant: "destructive",
      })
    } finally {
      setIsProcessingVideo(false)
    }
  }

  // Process video URL and extract thumbnail
  useEffect(() => {
    const processVideoUrl = async () => {
      const url = formData.thumbnail_url?.trim()
      if (!url || isProcessingVideo) return

      // Skip processing if this URL was already processed by addMainVideoUrl
      if (processedVideoUrls.has(url)) {
        console.log("useEffect processVideoUrl: Skipping already processed URL:", url)
        return
      }

      console.log("useEffect processVideoUrl: Processing URL:", url)

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
          console.log("useEffect processVideoUrl: Video already exists in media library:", existingMedia.id)
          return // Already in the library
        }

        // Get current user session
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const userId = session?.user?.id || "anonymous"

        // Add video to media library - only if not already processed
        const videoTitle =
          videoInfo.platform === "vimeo"
            ? (await fetch(`https://vimeo.com/api/v2/video/${videoInfo.id}.json`).then((r) => r.json()))[0]?.title ||
              `Vimeo ${videoInfo.id}`
            : videoInfo.platform === "youtube"
              ? `YouTube ${videoInfo.id}`
              : `LinkedIn Post ${videoInfo.id}`

        // Save to media table with error handling
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

        if (dbError) {
          console.warn("useEffect processVideoUrl: Error inserting video to media library (might be duplicate):", dbError)
          // Don't throw here, as this might be a duplicate
        } else {
          console.log("useEffect processVideoUrl: Successfully added video to media library")
          toast({
            title: "Video added to media library",
            description: `${videoInfo.platform.charAt(0).toUpperCase() + videoInfo.platform.slice(1)} video has been added to your media library`,
          })
        }
      } catch (err) {
        console.error("useEffect processVideoUrl: Error processing video URL:", err)
        // Don't show error to user, just log it - this could be a duplicate processing
      } finally {
        setIsProcessingVideo(false)
      }
    }

    if (formData.thumbnail_url) {
      processVideoUrl()
    } else {
      setVideoThumbnail(null)
    }
  }, [formData.thumbnail_url, formData.image, supabase, processedVideoUrls])

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
    if (!formData.title.trim()) return "Title is required"
    if (!formData.category.trim()) return "Category is required"
    if (!formData.role.trim() && !roleInput.trim()) return "Role is required"
    if (!formData.image.trim()) return "Image is required"

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
      // Prepare the data for submission
      const projectData = {
        title: formData.title.trim(),
        description: formData.description,
        image: formData.image.trim(),
        category: formData.category.trim(),
        role: roleInput.trim() || formData.role.trim(),
        project_date: formData.project_date,
        is_public: formData.is_public,
        thumbnail_url: formData.thumbnail_url || thumbnailUrl || null,
      }

      console.log("Form data before submission:", formData)
      console.log("Project data being sent to API:", projectData)

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
          throw new Error(responseData.error || "Failed to create project")
        }

        // Save BTS images if any
        if ((btsImages.length > 0 || btsVideos.length > 0) && responseData.data && responseData.data[0]) {
          const projectId = responseData.data[0].id

          try {
            const btsResponse = await fetch("/api/projects/bts-images", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                projectId,
                images: [...btsImages, ...btsVideos],
              }),
            })

            if (!btsResponse.ok) {
              console.error("Error saving BTS images:", await btsResponse.json())
              // Continue with success flow even if BTS save fails
            }
          } catch (btsError) {
            console.error("Error saving BTS images:", btsError)
            // Continue with success flow even if BTS save fails
          }
        }

        console.log("Project created successfully, redirecting to admin projects...")

        // Show success message and redirect back to admin projects page
        toast({
          title: "Project created",
          description: "Project created successfully!",
        })
        
        // Force redirect with fallback
        console.log("About to redirect to /admin/projects")
        try {
          await router.push("/admin/projects")
        } catch (routerError) {
          console.error("Router push failed, using window.location:", routerError)
          window.location.href = "/admin/projects"
        }
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
          throw new Error(responseData.error || "Failed to update project")
        }

        console.log("Project updated successfully, updating BTS media...")

        // Update BTS images if any
        if (project?.id) {
          try {
            const btsResponse = await fetch("/api/projects/bts-images", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                projectId: project.id,
                images: [...btsImages, ...btsVideos],
              }),
            })

            if (!btsResponse.ok) {
              console.error("Error updating BTS images:", await btsResponse.json())
              // Continue with success flow even if BTS update fails
            }
          } catch (btsError) {
            console.error("Error updating BTS images:", btsError)
            // Continue with success flow even if BTS update fails
          }
        }

        console.log("Project update completed, redirecting to admin projects...")

        // Show success message
        toast({
          title: "Project updated",
          description: "Project updated successfully!",
        })

        // Force redirect with fallback
        console.log("About to redirect to /admin/projects")
        try {
          await router.push("/admin/projects")
        } catch (routerError) {
          console.error("Router push failed, using window.location:", routerError)
          window.location.href = "/admin/projects"
        }
      }
    } catch (error: any) {
      console.error("Error saving project:", error)
      setError(error.message || "Failed to save project")
    } finally {
      setIsSubmitting(false)
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
            onClick={handleSubmit}
            disabled={isSubmitting || isLoadingSchema}
            size="sm"
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-[#131a2a]"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="mr-1 animate-spin" />
                {mode === "create" ? "Creating..." : "Updating..."}
              </>
            ) : isLoadingSchema ? (
              <>
                <Loader2 size={16} className="mr-1 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Save size={16} className="mr-1" />
                {mode === "create" ? "Create Project" : "Update Project"}
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
            <UnifiedMediaInput
              identifier="main"
              onMediaAdded={handleMainMediaSelect}
              onVideoUrlSubmit={addMainVideoUrl}
              folder="projects"
              isLoading={isProcessingVideo || isSubmitting}
            />

            {/* BTS upload area */}
            <UnifiedMediaInput
              identifier="bts"
              onMediaAdded={handleBtsMediaSelect}
              onVideoUrlSubmit={addBtsVideoUrl}
              folder="bts"
              isLoading={isLoadingBtsImages || isSubmitting}
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

                {/* Category input with Autocomplete */}
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

                {/* Role input with Autocomplete */}
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
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.project_date && new Date(formData.project_date) > new Date()
                      ? `Project will be private until ${new Date(formData.project_date).toLocaleDateString()}`
                      : "Project date and release date"
                    }
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-gray-400">Visibility</label>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs ${isPrivate ? 'text-gray-400' : 'text-green-400'}`}>Public</span>
                      <Switch
                        checked={isPrivate}
                        onCheckedChange={handlePrivateToggle}
                      />
                      <span className={`text-xs ${isPrivate ? 'text-orange-400' : 'text-gray-400'}`}>Private</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {isPrivate 
                      ? "Project is private and won't appear on the public site" 
                      : "Project is public and visible to everyone"
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="border-gray-800 bg-[#070a10] mt-4">
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
                            type="button"
                            onClick={() => setCoverImage(image)}
                            className="p-1 bg-blue-600 rounded-full hover:bg-blue-700"
                            title="Set as cover image"
                          >
                            <ImageIcon size={14} />
                          </button>
                          <button
                            type="button"
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
                      <VideoDisplayWithTooltip
                        key={`main-video-${index}`}
                        video={video}
                        index={index}
                        onSetMain={() => setMainVideo(video)}
                        onRemove={() => removeMainVideo(index)}
                        isMain={thumbnailUrl === video}
                        type="main"
                      />
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
                            type="button"
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
                      <VideoDisplayWithTooltip
                        key={`bts-video-${index}`}
                        video={video}
                        index={index}
                        onRemove={() => removeBtsVideo(index)}
                        isMain={false}
                        type="bts"
                      />
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
            disabled={isSubmitting || isLoadingSchema}
            size="sm"
            variant="outline"
            className="border-gray-700 bg-[#0f1520] text-gray-200 hover:bg-[#131a2a]"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                {mode === "create" ? "Creating..." : "Updating..."}
              </>
            ) : isLoadingSchema ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                {mode === "create" ? "Create Project" : "Update Project"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Wrap the main component with error boundary
export default function ProjectEditor(props: ProjectEditorProps) {
  return (
    <ProjectEditorErrorBoundary>
      <ProjectEditorComponent {...props} />
    </ProjectEditorErrorBoundary>
  )
}
