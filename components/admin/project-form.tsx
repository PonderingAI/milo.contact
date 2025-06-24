"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { extractVideoInfo } from "@/lib/project-data"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, Calendar, Film, ImageIcon, X } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { SimpleAutocomplete } from "@/components/ui/simple-autocomplete"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import UnifiedMediaInput from "@/components/admin/unified-media-input"

interface ProjectFormProps {
  project?: {
    id: string
    title: string
    category: string
    type?: string
    role: string
    image: string
    thumbnail_url?: string
    description?: string
    is_public: boolean
    publish_date: string | null
    tags?: string[]
    project_date?: string
  }
  mode: "create" | "edit"
}

// Change from export function to export default function
export default function ProjectForm({ project, mode }: ProjectFormProps) {
  // Keep all the existing implementation exactly as it was
  const [formData, setFormData] = useState({
    title: project?.title || "",
    category: project?.category || "",
    role: project?.role || "",
    image: project?.image || "",
    thumbnail_url: project?.thumbnail_url || "",
    description: project?.description || "",
    is_public: project?.is_public ?? true,
    publish_date: project?.publish_date || null,
    project_date: project?.project_date || new Date().toISOString().split("T")[0],
  })

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
  const [vimeoThumbnails, setVimeoThumbnails] = useState<{ [key: string]: string }>({}) // Cache for Vimeo thumbnails
  const [schemaColumns, setSchemaColumns] = useState<string[]>([])
  const [isLoadingSchema, setIsLoadingSchema] = useState(true)
  const [isLoadingBtsImages, setIsLoadingBtsImages] = useState(mode === "edit")
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  // Fetch the actual schema columns when the component mounts
  useEffect(() => {
    async function fetchSchema() {
      try {
        setIsLoadingSchema(true)
        // First try to get the schema from our API
        const response = await fetch("/api/check-projects-schema")

        if (response.ok) {
          const data = await response.json()
          if (data.exists && data.columns && Array.isArray(data.columns)) {
            const columnNames = data.columns.map((col: any) => col.column_name)
            setSchemaColumns(columnNames)
            console.log("Available columns in projects table:", columnNames)
          } else if (!data.exists) {
            console.log("Projects table does not exist")
            // Set some default columns as a fallback
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
            let data: any = null
            try {
              data = await response.json()
            } catch (jsonError) {
              console.error("Error parsing BTS images response JSON:", jsonError, "Response status:", response.status)
              data = { images: [], success: false }
            }
            
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

    // Add to mainImages if not already there
    if (!mainImages.includes(url)) {
      setMainImages((prev) => [...prev, url])
    }
  }

  // Vimeo thumbnail component with async loading
  const VimeoThumbnail = ({ url, alt, className }: { url: string; alt: string; className?: string }) => {
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
      const loadThumbnail = async () => {
        setIsLoading(true)
        const thumbnail = await getVimeoThumbnail(url)
        setThumbnailUrl(thumbnail)
        setIsLoading(false)
      }
      loadThumbnail()
    }, [url])

    if (isLoading) {
      return (
        <div className="text-gray-400 flex flex-col items-center">
          <Loader2 className="animate-spin" size={24} />
          <span className="text-xs mt-1">Loading...</span>
        </div>
      )
    }

    if (thumbnailUrl) {
      return (
        <img
          src={thumbnailUrl}
          alt={alt}
          className={className || "w-full h-full object-cover"}
          onError={() => setThumbnailUrl(null)}
        />
      )
    }

    return (
      <div className="text-gray-400 flex flex-col items-center">
        <Film size={24} />
        <span className="text-xs mt-1">Vimeo Video</span>
      </div>
    )
  }

  // Helper function to get Vimeo thumbnail
  const getVimeoThumbnail = async (url: string): Promise<string | null> => {
    try {
      const videoInfo = extractVideoInfo(url)
      if (!videoInfo || videoInfo.platform !== "vimeo") return null

      // Check cache first
      if (vimeoThumbnails[videoInfo.id]) {
        return vimeoThumbnails[videoInfo.id]
      }

      const response = await fetch(`https://vimeo.com/api/v2/video/${videoInfo.id}.json`)
      if (response.ok) {
        const videoData = await response.json()
        const video = videoData[0]
        const thumbnailUrl = video.thumbnail_large
        
        // Cache the thumbnail
        setVimeoThumbnails(prev => ({ ...prev, [videoInfo.id]: thumbnailUrl }))
        
        return thumbnailUrl
      }
    } catch (error) {
      console.error("Error fetching Vimeo thumbnail:", error)
    }
    return null
  }

  // Helper function to format date for input field
  function formatDateForInput(date: Date): string {
    return date.toISOString().split("T")[0]
  }

  // Helper function to extract date from file metadata
  async function extractDateFromMedia(url: string, type: "image" | "video"): Promise<Date | null> {
    try {
      console.log("DEBUG: extractDateFromMedia called with:", { url, type })
      
      if (type === "video") {
        const videoInfo = extractVideoInfo(url)
        console.log("DEBUG: extractVideoInfo result:", videoInfo)
        
        if (!videoInfo) {
          console.log("DEBUG: No video info extracted, returning null")
          return null
        }

        if (videoInfo.platform === "vimeo") {
          console.log("DEBUG: Processing Vimeo video")
          // Get video metadata from Vimeo
          const response = await fetch(`https://vimeo.com/api/v2/video/${videoInfo.id}.json`)
          if (response.ok) {
            const videoData = await response.json()
            const video = videoData[0]
            if (video.upload_date) {
              console.log("DEBUG: Found Vimeo upload date:", video.upload_date)
              return new Date(video.upload_date)
            }
          }
        } else if (videoInfo.platform === "youtube") {
          // For YouTube, don't make client-side API calls that can cause CORS issues
          // The server-side /api/process-video-url will handle this properly
          console.log("DEBUG: YouTube video detected, skipping client-side date extraction")
          console.log("DEBUG: Server-side processing will handle YouTube metadata extraction")
          return null
        }
      } else if (type === "image") {
        console.log("DEBUG: Processing image metadata")
        // For images in Supabase, check if we have metadata
        const { data } = await supabase.from("media").select("metadata, created_at").eq("public_url", url).maybeSingle()

        if (data) {
          console.log("DEBUG: Found image metadata:", data)
          // Try to get date from metadata
          if (data.metadata && data.metadata.dateTaken) {
            console.log("DEBUG: Using metadata dateTaken:", data.metadata.dateTaken)
            return new Date(data.metadata.dateTaken)
          }
          // Fall back to created_at
          if (data.created_at) {
            console.log("DEBUG: Using created_at:", data.created_at)
            return new Date(data.created_at)
          }
        }
      }
      console.log("DEBUG: No date found, returning null")
      return null
    } catch (error) {
      console.error("DEBUG: Error in extractDateFromMedia:", error)
      return null
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

      const processVideoUrl = async (url: string) => {
        console.log("DEBUG: processVideoUrl called with:", url)
        
        // Basic validation
        if (!url || typeof url !== 'string') {
          console.error("DEBUG: Invalid URL provided to processVideoUrl:", url)
          return
        }
        
        // Check if functions are available
        if (typeof toast !== 'function') {
          console.error("DEBUG: toast function is not available")
          return
        }
        
        if (typeof extractVideoInfo !== 'function') {
          console.error("DEBUG: extractVideoInfo function is not available")
          return
        }
        
        console.log("DEBUG: All required functions are available, proceeding...")
        
        setIsProcessingVideo(true)
        let toastId: string
        try {
          console.log("DEBUG: Creating processing toast")
          const toastResult = toast({
            title: "Processing video",
            description: "Fetching video information...",
          })
          // Safely extract the ID without chaining
          if (toastResult && typeof toastResult === 'object' && 'id' in toastResult) {
            toastId = toastResult.id || "fallback-id"
          } else {
            toastId = "fallback-id"
          }
          console.log("DEBUG: Toast created with ID:", toastId)
        } catch (toastError) {
          console.error("DEBUG: Error creating toast:", toastError)
          toastId = "fallback-id"
        }

        try {
          console.log("DEBUG: Making API call to /api/process-video-url")
          // Use the new API route to process the video URL
          const response = await fetch("/api/process-video-url", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ url }),
          })

          console.log("DEBUG: API response status:", response.status)
          
          if (!response.ok) {
            const errorData = await response.json()
            console.error("DEBUG: API error response:", errorData)
            throw new Error(errorData.error || "Failed to process video URL")
          }

          const result = await response.json()
          console.log("DEBUG: Video processing result:", result)

          // If we have a thumbnail and no image is set, use the thumbnail
          if (result.thumbnailUrl && !formData.image && !mainImages.includes(result.thumbnailUrl)) {
            console.log("DEBUG: Setting thumbnail as main image:", result.thumbnailUrl)
            setFormData((prev) => ({ ...prev, image: result.thumbnailUrl }))
            setVideoThumbnail(result.thumbnailUrl)
            setMainImages((prev) => [...prev, result.thumbnailUrl])
          }

          // If project title is empty, use video title
          if (!formData.title && result.title) {
            console.log("DEBUG: Setting video title as project title:", result.title)
            setFormData((prev) => ({ ...prev, title: result.title }))
          }

          // If project date is empty and we have an upload date, use it
          if (!formData.project_date && result.uploadDate) {
            console.log("DEBUG: Setting video upload date as project date:", result.uploadDate)
            const date = new Date(result.uploadDate)
            setFormData((prev) => ({ ...prev, project_date: formatDateForInput(date) }))
          }

          console.log("DEBUG: Updating toast with success message")
          toast({
            id: toastId,
            title: "Video processed",
            description: "Video information has been processed",
          })
        } catch (error) {
          console.error("DEBUG: Error processing video:", error)
          toast({
            id: toastId,
            title: "Error processing video",
            description: error instanceof Error ? error.message : "Failed to process video URL",
            variant: "destructive",
          })
        } finally {
          console.log("DEBUG: Setting isProcessingVideo to false")
          setIsProcessingVideo(false)
        }
      }

      if (isVideo) {
        console.log("DEBUG: Processing video:", mediaUrl)
        if (!mainVideos.includes(mediaUrl)) {
          setMainVideos((prev) => [...prev, mediaUrl])
          console.log("DEBUG: Added video to mainVideos:", mediaUrl)
        } else {
          console.log("DEBUG: Video already in mainVideos:", mediaUrl)
        }
        
        // Store video URL in thumbnail_url if that column exists
        if (schemaColumns.includes("thumbnail_url")) {
          console.log("DEBUG: Setting thumbnailUrl and formData.thumbnail_url")
          setThumbnailUrl(mediaUrl)
          setFormData((prev) => ({ ...prev, thumbnail_url: mediaUrl }))

          // Process video to extract metadata
          try {
            console.log("DEBUG: Checking if video exists in media library")
            // For videos from media library, try to get metadata from the library
            const supabase = getSupabaseBrowserClient()
            const { data: mediaData } = await supabase
              .from("media")
              .select("filename, metadata, thumbnail_url")
              .eq("public_url", mediaUrl)
              .maybeSingle()

            if (mediaData) {
              // If we have media data, use it
              console.log("DEBUG: Found video in media library:", mediaData)

              // Set title if empty
              if (!formData.title && mediaData.filename) {
                console.log("DEBUG: Setting title from media library:", mediaData.filename)
                setFormData((prev) => ({ ...prev, title: mediaData.filename }))
              }

              // Use thumbnail if available
              if (mediaData.thumbnail_url && !formData.image) {
                console.log("DEBUG: Setting thumbnail from media library:", mediaData.thumbnail_url)
                setFormData((prev) => ({ ...prev, image: mediaData.thumbnail_url }))
                if (!mainImages.includes(mediaData.thumbnail_url)) {
                  setMainImages((prev) => [...prev, mediaData.thumbnail_url])
                }
              }

              // Extract date if available
              if (mediaData.metadata?.uploadDate && !formData.project_date) {
                console.log("DEBUG: Setting date from media library:", mediaData.metadata.uploadDate)
                const date = new Date(mediaData.metadata.uploadDate)
                setFormData((prev) => ({ ...prev, project_date: formatDateForInput(date) }))
              }
            } else {
              // If not in media library, process as external video
              console.log("DEBUG: Video not in media library, processing as external video")
              await processVideoUrl(mediaUrl)
            }
          } catch (error) {
            console.error("DEBUG: Error processing video from media library:", error)
            // Fall back to regular processing
            console.log("DEBUG: Falling back to regular video processing")
            await processVideoUrl(mediaUrl)
          }
        } else {
          console.log("DEBUG: thumbnail_url column not available in schema")
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
    console.log("DEBUG: addMainVideoUrl called with:", url)
    if (!url.trim()) {
      console.log("DEBUG: Empty URL provided, returning")
      return
    }

    console.log("DEBUG: Setting processing state and creating toast")
    setIsProcessingVideo(true)
    let toastId: string
    try {
      console.log("DEBUG: Creating processing toast")
      const toastResult = toast({
        title: "Processing video",
        description: "Fetching video information...",
      })
      // Safely extract the ID without chaining
      if (toastResult && typeof toastResult === 'object' && 'id' in toastResult) {
        toastId = toastResult.id || "fallback-id"
      } else {
        toastId = "fallback-id"
      }
      console.log("DEBUG: Toast created with ID:", toastId)
    } catch (toastError) {
      console.error("DEBUG: Error creating toast:", toastError)
      toastId = "fallback-id"
    }

    try {
      console.log("DEBUG: Making API call to process video URL")
      // Use the new API route to process the video URL
      const response = await fetch("/api/process-video-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      console.log("DEBUG: API response status:", response.status)
      if (!response.ok) {
        const errorData = await response.json()
        console.error("DEBUG: API error response:", errorData)
        throw new Error(errorData.error || "Failed to process video URL")
      }

      const result = await response.json()
      console.log("DEBUG: Video processing result:", result)

      // Add to mainVideos if not already in the list
      if (!mainVideos.includes(url)) {
        setMainVideos((prev) => [...prev, url])
        setThumbnailUrl(url)
        setFormData((prev) => ({ ...prev, thumbnail_url: url }))
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
      setIsProcessingVideo(false)
    }
  }

  const addBtsVideoUrl = async (url: string) => {
    if (!url.trim()) return

    let toastId: string
    try {
      const toastResult = toast({
        title: "Processing BTS video",
        description: "Fetching video information...",
      })
      // Safely extract the ID without chaining
      if (toastResult && typeof toastResult === 'object' && 'id' in toastResult) {
        toastId = toastResult.id || "fallback-id"
      } else {
        toastId = "fallback-id"
      }
    } catch (toastError) {
      console.error("Error creating toast:", toastError)
      toastId = "fallback-id"
    }

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
      setIsProcessingVideo(false)
    }
  }

  // Process video URL and extract thumbnail (simplified - just for display)
  useEffect(() => {
    const processThumbnailDisplay = async () => {
      const url = formData.thumbnail_url?.trim()
      console.log("DEBUG: processThumbnailDisplay called with:", url)
      
      if (!url) {
        console.log("DEBUG: No URL provided, setting videoThumbnail to null")
        setVideoThumbnail(null)
        return
      }
      
      if (isProcessingVideo) {
        console.log("DEBUG: Already processing video, skipping thumbnail display processing")
        return
      }

      const videoInfo = extractVideoInfo(url)
      console.log("DEBUG: extractVideoInfo result for thumbnail:", videoInfo)
      
      if (!videoInfo) {
        console.log("DEBUG: No video info, setting videoThumbnail to null")
        setVideoThumbnail(null)
        return
      }

      console.log("DEBUG: Setting processing state for thumbnail display")
      setIsProcessingVideo(true)

      try {
        let thumbnailUrl = null

        if (videoInfo.platform === "vimeo") {
          console.log("DEBUG: Fetching Vimeo thumbnail for display")
          // Get video thumbnail from Vimeo API
          const response = await fetch(`https://vimeo.com/api/v2/video/${videoInfo.id}.json`)

          if (!response.ok) {
            console.warn("DEBUG: Failed to fetch Vimeo video info:", response.status, response.statusText)
            throw new Error("Failed to fetch Vimeo video info")
          }

          const videoData = await response.json()
          const video = videoData[0]
          thumbnailUrl = video.thumbnail_large
          console.log("DEBUG: Got Vimeo thumbnail:", thumbnailUrl)
        } else if (videoInfo.platform === "youtube") {
          // Use YouTube thumbnail URL format
          thumbnailUrl = `https://img.youtube.com/vi/${videoInfo.id}/hqdefault.jpg`
          console.log("DEBUG: Using YouTube thumbnail format:", thumbnailUrl)
        } else if (videoInfo.platform === "linkedin") {
          // LinkedIn doesn't provide easy thumbnail access, use a placeholder
          thumbnailUrl = "/generic-icon.png"
          console.log("DEBUG: Using LinkedIn placeholder thumbnail")
        }

        console.log("DEBUG: Setting videoThumbnail:", thumbnailUrl)
        setVideoThumbnail(thumbnailUrl)

        // If no image is set yet, use the video thumbnail
        if (!formData.image && thumbnailUrl) {
          console.log("DEBUG: No main image set, using video thumbnail as main image")
          setFormData((prev) => ({ ...prev, image: thumbnailUrl }))
          setIsUsingVideoThumbnail(true)
        }

        // Note: We no longer add videos to media library here
        // This is handled by the /api/process-video-url endpoint when videos are actually used
        console.log("DEBUG: Video thumbnail processed for display purposes")
      } catch (err) {
        console.error("DEBUG: Error processing video URL for display:", err)
        // Don't show error to user, just log it
        setVideoThumbnail(null)
      } finally {
        console.log("DEBUG: Clearing processing state for thumbnail display")
        setIsProcessingVideo(false)
      }
    }

    if (formData.thumbnail_url) {
      processThumbnailDisplay()
    } else {
      setVideoThumbnail(null)
    }
  }, [formData.thumbnail_url, formData.image, isProcessingVideo])

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

        // Save BTS images and videos if any
        if ((btsImages.length > 0 || btsVideos.length > 0) && responseData.data && responseData.data[0]) {
          const projectId = responseData.data[0].id
          const allBtsMedia = [...btsImages, ...btsVideos]

          try {
            setIsSubmitting(true) // Keep the submitting state active
            let toastId: string
            try {
              const toastResult = toast({
                title: "Saving BTS media",
                description: "Uploading behind-the-scenes media...",
              })
              // Safely extract the ID without chaining
              if (toastResult && typeof toastResult === 'object' && 'id' in toastResult) {
                toastId = toastResult.id || "fallback-id"
              } else {
                toastId = "fallback-id"
              }
            } catch (toastError) {
              console.error("Error creating toast:", toastError)
              toastId = "fallback-id"
            }

            const btsResponse = await fetch("/api/projects/bts-images", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                projectId,
                images: allBtsMedia,
              }),
            })

            let btsResult: any = null
            try {
              // Get response as text first so we can log it if JSON parsing fails
              const responseText = await btsResponse.text()
              console.log("BTS Response status:", btsResponse.status, "Headers:", Object.fromEntries(btsResponse.headers.entries()))
              console.log("BTS Response text:", responseText.substring(0, 200))
              
              // Check if this looks like HTML (sign-in redirect)
              if (responseText.trim().startsWith('<!DOCTYPE html') || responseText.trim().startsWith('<html')) {
                throw new Error("Received HTML response - likely authentication redirect")
              }
              
              // Try to parse as JSON
              if (responseText.trim()) {
                btsResult = JSON.parse(responseText)
              } else {
                throw new Error("Empty response")
              }
            } catch (jsonError) {
              console.error("Error parsing BTS response JSON during project creation:", jsonError, "Response status:", btsResponse.status)
              // If JSON parsing fails, treat as success if status is ok, otherwise as error
              btsResult = { 
                error: btsResponse.ok ? null : "Invalid response format",
                success: btsResponse.ok 
              }
            }

            if (!btsResponse.ok) {
              console.error("Error saving BTS media:", btsResult)
              toast({
                id: toastId,
                title: "Warning",
                description: "Project created but some BTS media couldn't be saved. You can add them later.",
                variant: "destructive",
              })
            } else {
              toast({
                id: toastId,
                title: "Success",
                description: `Project created with ${allBtsMedia.length} BTS media items`,
              })
            }
          } catch (btsError) {
            console.error("Error saving BTS media:", btsError)
            toast({
              title: "Warning",
              description: "Project created but BTS media couldn't be saved. You can add them later.",
              variant: "destructive",
            })
          } finally {
            setIsSubmitting(false)
          }
        }

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
          throw new Error(responseData.error || "Failed to update project")
        }

        // Update BTS images and videos if any
        if (project?.id) {
          try {
            setIsSubmitting(true) // Keep the submitting state active
            let toastId: string
            try {
              const toastResult = toast({
                title: "Updating BTS media",
                description: "Updating behind-the-scenes media...",
              })
              // Safely extract the ID without chaining
              if (toastResult && typeof toastResult === 'object' && 'id' in toastResult) {
                toastId = toastResult.id || "fallback-id"
              } else {
                toastId = "fallback-id"
              }
            } catch (toastError) {
              console.error("Error creating toast:", toastError)
              toastId = "fallback-id"
            }

            const allBtsMedia = [...btsImages, ...btsVideos]

            const btsResponse = await fetch("/api/projects/bts-images", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                projectId: project.id,
                images: allBtsMedia,
                replaceExisting: true, // Replace existing media
              }),
            })

            let btsResult: any = null
            try {
              // Get response as text first so we can log it if JSON parsing fails
              const responseText = await btsResponse.text()
              console.log("BTS Update Response status:", btsResponse.status, "Headers:", Object.fromEntries(btsResponse.headers.entries()))
              console.log("BTS Update Response text:", responseText.substring(0, 200))
              
              // Check if this looks like HTML (sign-in redirect)
              if (responseText.trim().startsWith('<!DOCTYPE html') || responseText.trim().startsWith('<html')) {
                throw new Error("Received HTML response - likely authentication redirect")
              }
              
              // Try to parse as JSON
              if (responseText.trim()) {
                btsResult = JSON.parse(responseText)
              } else {
                throw new Error("Empty response")
              }
            } catch (jsonError) {
              console.error("Error parsing BTS response JSON during project update:", jsonError, "Response status:", btsResponse.status)
              // If JSON parsing fails, treat as success if status is ok, otherwise as error
              btsResult = { 
                error: btsResponse.ok ? null : "Invalid response format",
                success: btsResponse.ok 
              }
            }

            if (!btsResponse.ok) {
              console.error("Error updating BTS media:", btsResult)
              toast({
                id: toastId,
                title: "Warning",
                description: "Project updated but some BTS media couldn't be saved.",
                variant: "destructive",
              })
            } else {
              toast({
                id: toastId,
                title: "Success",
                description: `Project updated with ${allBtsMedia.length} BTS media items`,
              })
            }
          } catch (btsError) {
            console.error("Error updating BTS media:", btsError)
            toast({
              title: "Warning",
              description: "Project updated but BTS media couldn't be saved.",
              variant: "destructive",
            })
          } finally {
            setIsSubmitting(false)
          }
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
        {/* Left column - Upload areas */}
        <div className="space-y-4">
          {/* Main upload area */}
          <UnifiedMediaInput
            identifier="main"
            onMediaAdded={handleMainMediaSelect}
            onVideoUrlSubmit={addMainVideoUrl}
            folder="projects"
            isLoading={isProcessingVideo || isSubmitting}
            multiple={true}
          />

          {/* BTS upload area */}
          <UnifiedMediaInput
            identifier="bts"
            onMediaAdded={handleBtsMediaSelect}
            onVideoUrlSubmit={addBtsVideoUrl}
            folder="bts"
            isLoading={isLoadingBtsImages || isSubmitting}
            multiple={true}
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
                          <VimeoThumbnail
                            url={video}
                            alt={`Vimeo video ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-gray-400 flex flex-col items-center">
                            <Film size={24} />
                            <span className="text-xs mt-1">Video</span>
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setMainVideo(video)}
                          className="p-1 bg-blue-600 rounded-full hover:bg-blue-700"
                          title="Set as main video"
                        >
                          <Film size={14} />
                        </button>
                        <button
                          type="button"
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
                          <VimeoThumbnail
                            url={video}
                            alt={`BTS Vimeo video ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-gray-400 flex flex-col items-center">
                            <Film size={24} />
                            <span className="text-xs mt-1">Video</span>
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
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
