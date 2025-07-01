"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
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
  // Only log on mount and specific state changes, not every render
  const hasLoggedMount = useRef(false)
  
  if (!hasLoggedMount.current) {
    console.log("ProjectEditor: Component mounting, mode:", mode, "project:", project?.id)
    hasLoggedMount.current = true
  }

  // Add a ref to track if component is mounted
  const isMountedRef = useRef(true)
  const hasBtsImagesLoaded = useRef(false)
  
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
  const router = useRouter()

  // Cleanup effect to track component mount status
  useEffect(() => {
    return () => {
      isMountedRef.current = false
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
            const supabaseClient = getSupabaseBrowserClient()
            const { data, error } = await supabaseClient.from("projects").select("*").limit(1)

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
  }, []) // Fixed: Using getSupabaseBrowserClient() directly to avoid dependency issues

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
    if (mode === "edit" && project?.id && !hasBtsImagesLoaded.current) {
      async function fetchBtsImages() {
        try {
          setIsLoadingBtsImages(true)
          const response = await fetch(`/api/projects/bts-images/${project.id}`)

          if (response.ok) {
            const data = await response.json()
            
            // Add additional safety checks for the response data
            if (!data) {
              console.warn('BTS API returned null/undefined data')
              return
            }
            
            if (data.rawData && Array.isArray(data.rawData)) {
              // Use rawData which contains full BTS media information
              const images: string[] = []
              const videos: string[] = []

              data.rawData.forEach((item: any) => {
                // Skip null, undefined, or invalid values
                if (!item || !item.image_url || typeof item.image_url !== 'string') {
                  console.warn('Skipping invalid BTS item:', item)
                  return
                }

                if (item.is_video) {
                  // For videos, try to get the original URL
                  let originalUrl = item.caption || item.video_url || item.image_url
                  
                  // If we have platform and ID but no caption, reconstruct the original URL
                  if (!item.caption && item.video_platform && item.video_id) {
                    if (item.video_platform.toLowerCase() === "youtube") {
                      originalUrl = `https://www.youtube.com/watch?v=${item.video_id}`
                    } else if (item.video_platform.toLowerCase() === "vimeo") {
                      originalUrl = `https://vimeo.com/${item.video_id}`
                    } else if (item.video_platform.toLowerCase() === "linkedin") {
                      // For LinkedIn, we may need to store the original URL differently
                      originalUrl = item.video_url || item.image_url
                    }
                  }
                  
                  videos.push(originalUrl)
                } else {
                  images.push(item.image_url)
                }
              })

              setBtsImages(images)
              setBtsVideos(videos)
              hasBtsImagesLoaded.current = true
              
              console.log("Loaded BTS media - images:", images, "videos:", videos)
            } else if (data.images && Array.isArray(data.images)) {
              // Fallback to old method if rawData is not available
              const images: string[] = []
              const videos: string[] = []

              data.images.forEach((url: string) => {
                // Skip null, undefined, or non-string values
                if (!url || typeof url !== 'string') {
                  console.warn('Skipping invalid BTS URL:', url)
                  return
                }

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
              hasBtsImagesLoaded.current = true
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

  // Fetch main media if in edit mode
  useEffect(() => {
    if (mode === "edit" && project?.id) {
      async function fetchMainMedia() {
        try {
          const response = await fetch(`/api/projects/main-media/${project.id}`)

          if (response.ok) {
            const data = await response.json()
            
            if (data.fullData && Array.isArray(data.fullData)) {
              // Separate images and videos from main media
              const images: string[] = []
              const videos: string[] = []

              data.fullData.forEach((item: any) => {
                if (!item.image_url || typeof item.image_url !== 'string') {
                  console.warn('Skipping invalid main media URL:', item)
                  return
                }

                if (item.is_video) {
                  // For videos, try to get the original URL from caption field or reconstruct it
                  let videoUrl = item.caption || item.video_url || item.image_url
                  
                  // If we have platform and ID but no caption, reconstruct the original URL
                  if (!item.caption && item.video_platform && item.video_id) {
                    if (item.video_platform.toLowerCase() === "youtube") {
                      videoUrl = `https://www.youtube.com/watch?v=${item.video_id}`
                    } else if (item.video_platform.toLowerCase() === "vimeo") {
                      videoUrl = `https://vimeo.com/${item.video_id}`
                    }
                  }
                  
                  videos.push(videoUrl)
                } else {
                  images.push(item.image_url)
                }
              })

              setMainImages(images)
              setMainVideos(videos)
              
              console.log("Loaded main media - images:", images, "videos:", videos)
            }
          } else {
            // No main media found, use fallback from project fields
            console.log("No main media table data, using fallback from project fields")
            
            // Set the main image from project.image
            if (project.image) {
              setMainImages([project.image])
            }

            // Set the main video from project.thumbnail_url
            if (project.thumbnail_url) {
              setMainVideos([project.thumbnail_url])
              setThumbnailUrl(project.thumbnail_url)
            }
          }
        } catch (err) {
          console.error("Error fetching main media:", err)
          
          // Use fallback from project fields on error
          if (project.image) {
            setMainImages([project.image])
          }
          if (project.thumbnail_url) {
            setMainVideos([project.thumbnail_url])
            setThumbnailUrl(project.thumbnail_url)
          }
        }
      }

      fetchMainMedia()
    }
  }, [mode, project?.id])

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
        const supabaseClient = getSupabaseBrowserClient()
        const { data } = await supabaseClient.from("media").select("metadata, created_at").eq("public_url", url).maybeSingle()

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

    const getVideoThumbnail = () => {
      if (video.includes("youtube.com")) {
        return `https://img.youtube.com/vi/${video.split("v=")[1]?.split("&")[0]}/hqdefault.jpg`
      } else if (video.includes("youtu.be")) {
        return `https://img.youtube.com/vi/${video.split("youtu.be/")[1]?.split("?")[0]}/hqdefault.jpg`
      }
      return null
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
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                {onSetMain && (
                  <button
                    type="button"
                    onClick={onSetMain}
                    className="absolute left-0 top-0 w-1/2 h-full flex items-center justify-center bg-blue-600/20 hover:bg-blue-600/40 transition-colors"
                    title="Set as main video"
                  >
                    <div className="p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors">
                      <Film size={16} />
                    </div>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onRemove}
                  className={`absolute right-0 top-0 ${onSetMain ? 'w-1/2' : 'w-full'} h-full flex items-center justify-center bg-red-600/20 hover:bg-red-600/40 transition-colors`}
                  title="Remove video"
                >
                  <div className="p-2 bg-red-600 rounded-full hover:bg-red-700 transition-colors">
                    <X size={16} />
                  </div>
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
      if (!mediaUrl || typeof mediaUrl !== 'string') {
        console.warn('Skipping invalid main media URL:', mediaUrl)
        continue
      }

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
      // Skip null, undefined, or non-string values
      if (!mediaUrl || typeof mediaUrl !== 'string') {
        console.warn('Skipping invalid BTS media URL:', mediaUrl)
        return
      }

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
    if (!url?.trim()) {
      console.log("addMainVideoUrl: Empty URL provided")
      return
    }

    // Prevent duplicate calls
    if (isProcessingVideo) {
      console.log("addMainVideoUrl: Already processing a video, skipping")
      return
    }

    const sessionId = Date.now().toString()
    console.log(`=== addMainVideoUrl [${sessionId}]: Function entry ===`)
    console.log(`addMainVideoUrl [${sessionId}]: Input URL: ${url}`)

    setIsProcessingVideo(true)
    
    try {
      const toastId = toast({
        title: "Processing video",
        description: "Fetching video information...",
      }).id
      
      console.log(`addMainVideoUrl [${sessionId}]: Starting API call`)
      
      // Use the API route to process the video URL
      const response = await fetch("/api/process-video-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      console.log(`addMainVideoUrl [${sessionId}]: API response status: ${response.status}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown API error" }))
        throw new Error(errorData.error || "Failed to process video URL")
      }

      const result = await response.json()
      
      console.log(`addMainVideoUrl [${sessionId}]: Video processing result:`)
      console.log(result)

      // Handle duplicate case with safer checks
      if (result && typeof result === 'object' && result.duplicate === true) {
        console.log(`addMainVideoUrl [${sessionId}]: Handling duplicate video`)
        
        // Add to interface if not already present
        if (!mainVideos.includes(url)) {
          setMainVideos(prev => [...prev, url])
          setThumbnailUrl(url)
          setFormData(prev => ({ ...prev, thumbnail_url: url }))
        }

        // Use existing video data safely
        if (result.existingVideo && typeof result.existingVideo === 'object') {
          const existingVideo = result.existingVideo
          const filename = existingVideo.filename
          
          // If project title is empty, use video title
          if (!formData.title && filename && typeof filename === 'string') {
            setFormData(prev => ({ ...prev, title: filename }))
          }
        }

        // Show success message
        const message = result.message || "Video was already in the media library and has been added to this project"
        
        toast({
          id: toastId,
          title: "Video already exists",
          description: message,
        })
        
        console.log(`addMainVideoUrl [${sessionId}]: Successfully handled duplicate`)
        return
      }

      // Handle new video case
      if (result && typeof result === 'object' && result.success === true) {
        console.log(`addMainVideoUrl [${sessionId}]: Handling new video`)
        
        if (!mainVideos.includes(url)) {
          setMainVideos(prev => [...prev, url])
          setThumbnailUrl(url)
          setFormData(prev => ({ ...prev, thumbnail_url: url }))
        }

        // Extract properties from result safely
        const thumbnailUrl = result.thumbnailUrl
        const title = result.title
        const uploadDate = result.uploadDate

        // Use thumbnail if available and no image is set
        if (thumbnailUrl && !formData.image && !mainImages.includes(thumbnailUrl)) {
          setFormData(prev => ({ ...prev, image: thumbnailUrl }))
          setVideoThumbnail(thumbnailUrl)
          setMainImages(prev => [...prev, thumbnailUrl])
        }

        // Use video title if project title is empty
        if (!formData.title && title && typeof title === 'string') {
          setFormData(prev => ({ ...prev, title }))
        }

        // Use upload date if project date is empty
        if (!formData.project_date && uploadDate) {
          try {
            const date = new Date(uploadDate)
            if (!isNaN(date.getTime())) {
              const formattedDate = formatDateForInput(date)
              setFormData(prev => ({ ...prev, project_date: formattedDate }))
            }
          } catch (dateError) {
            console.warn(`addMainVideoUrl [${sessionId}]: Error parsing upload date:`, dateError)
          }
        }

        toast({
          id: toastId,
          title: "Video added",
          description: "Video has been added to the project and media library",
        })
        
        console.log(`addMainVideoUrl [${sessionId}]: Successfully handled new video`)
        return
      }
      
      // If we get here, the response format was unexpected
      console.warn(`addMainVideoUrl [${sessionId}]: Unexpected response format:`, result)
      throw new Error("Unexpected response format from video processing API")
      
    } catch (error) {
      console.error(`addMainVideoUrl [${sessionId}]: Error processing video:`, error)
      
      toast({
        title: "Error adding video",
        description: error instanceof Error ? error.message : "Failed to process video URL",
        variant: "destructive",
      })
    } finally {
      setIsProcessingVideo(false)
      console.log(`addMainVideoUrl [${sessionId}]: Process completed`)
    }
  }

  const addBtsVideoUrl = async (url: string) => {
    if (!url?.trim()) {
      console.log("addBtsVideoUrl: Empty URL provided")
      return
    }

    const sessionId = Date.now().toString()
    console.log(`=== addBtsVideoUrl [${sessionId}]: Function entry ===`)
    console.log(`addBtsVideoUrl [${sessionId}]: Input URL: ${url}`)

    try {
      const toastId = toast({
        title: "Processing BTS video",
        description: "Fetching video information...",
      }).id

      console.log(`addBtsVideoUrl [${sessionId}]: Starting API call`)
      
      // Use the API route to process the video URL
      const response = await fetch("/api/process-video-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, isBts: true }),
      })

      console.log(`addBtsVideoUrl [${sessionId}]: API response status: ${response.status}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown API error" }))
        throw new Error(errorData.error || "Failed to process video URL")
      }

      const result = await response.json()
      
      console.log(`addBtsVideoUrl [${sessionId}]: Video processing result:`)
      console.log(result)

      // Handle duplicate case
      if (result && typeof result === 'object' && result.duplicate === true) {
        console.log(`addBtsVideoUrl [${sessionId}]: Handling duplicate BTS video`)
        
        // Add to interface if not already present
        if (!btsVideos.includes(url)) {
          setBtsVideos(prev => [...prev, url])
        }

        // Use existing video data safely
        if (result.existingVideo && typeof result.existingVideo === 'object') {
          const existingVideo = result.existingVideo
          const thumbnailUrl = existingVideo.thumbnail_url
          
          if (thumbnailUrl && typeof thumbnailUrl === 'string' && !btsImages.includes(thumbnailUrl)) {
            setBtsImages(prev => [...prev, thumbnailUrl])
          }
        }

        // Show success message
        const message = result.message || "Video was already in the media library and has been added to BTS"
        
        toast({
          id: toastId,
          title: "BTS video already exists",
          description: message,
        })
        
        console.log(`addBtsVideoUrl [${sessionId}]: Successfully handled duplicate`)
        return
      }

      // Handle new video case
      if (result && typeof result === 'object' && result.success === true) {
        console.log(`addBtsVideoUrl [${sessionId}]: Handling new BTS video`)
        
        if (!btsVideos.includes(url)) {
          setBtsVideos(prev => [...prev, url])
        }

        // Extract properties from result safely
        const thumbnailUrl = result.thumbnailUrl

        // Add thumbnail to BTS images if available
        if (thumbnailUrl && typeof thumbnailUrl === 'string' && !btsImages.includes(thumbnailUrl)) {
          setBtsImages(prev => [...prev, thumbnailUrl])
        }

        toast({
          id: toastId,
          title: "BTS video added",
          description: "Video has been added to BTS and media library",
        })
        
        console.log(`addBtsVideoUrl [${sessionId}]: Successfully handled new video`)
        return
      }
      
      // If we get here, the response format was unexpected
      console.warn(`addBtsVideoUrl [${sessionId}]: Unexpected response format:`, result)
      throw new Error("Unexpected response format from video processing API")
      
    } catch (error) {
      console.error(`addBtsVideoUrl [${sessionId}]: Error processing BTS video:`, error)
      
      toast({
        title: "Error adding BTS video",
        description: error instanceof Error ? error.message : "Failed to process video URL",
        variant: "destructive",
      })
    }
  }

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

        // Save main media if any
        if ((mainImages.length > 0 || mainVideos.length > 0) && responseData.data && responseData.data[0]) {
          const projectId = responseData.data[0].id

          try {
            const mainMediaResponse = await fetch("/api/projects/main-media", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                projectId,
                media: [...mainImages, ...mainVideos],
                replaceExisting: true,
              }),
            })

            if (!mainMediaResponse.ok) {
              console.error("Error saving main media:", await mainMediaResponse.json())
              // Continue with success flow even if main media save fails
            }
          } catch (mainMediaError) {
            console.error("Error saving main media:", mainMediaError)
            // Continue with success flow even if main media save fails
          }
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
                replaceExisting: true,
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

        console.log("Project updated successfully, updating main media and BTS media...")

        // Update main media if any
        if (project?.id) {
          try {
            const mainMediaResponse = await fetch("/api/projects/main-media", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                projectId: project.id,
                media: [...mainImages, ...mainVideos],
                replaceExisting: true,
              }),
            })

            if (!mainMediaResponse.ok) {
              console.error("Error updating main media:", await mainMediaResponse.json())
              // Continue with success flow even if main media update fails
            }
          } catch (mainMediaError) {
            console.error("Error updating main media:", mainMediaError)
            // Continue with success flow even if main media update fails
          }
        }

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
                replaceExisting: true,
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
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => setCoverImage(image)}
                            className="absolute left-0 top-0 w-1/2 h-full flex items-center justify-center bg-blue-600/20 hover:bg-blue-600/40 transition-colors"
                            title="Set as cover image"
                          >
                            <div className="p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors">
                              <ImageIcon size={16} />
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeMainImage(index)}
                            className="absolute right-0 top-0 w-1/2 h-full flex items-center justify-center bg-red-600/20 hover:bg-red-600/40 transition-colors"
                            title="Remove image"
                          >
                            <div className="p-2 bg-red-600 rounded-full hover:bg-red-700 transition-colors">
                              <X size={16} />
                            </div>
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
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Full area clickable for delete */}
                          <button
                            type="button"
                            onClick={() => removeBtsImage(index)}
                            className="absolute inset-0 w-full h-full flex items-center justify-center bg-red-600/20 hover:bg-red-600/40 transition-colors"
                            title="Remove image"
                          >
                            <div className="p-2 bg-red-600 rounded-full hover:bg-red-700 transition-colors">
                              <X size={16} />
                            </div>
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
