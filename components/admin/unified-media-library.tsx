"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Copy,
  Trash2,
  Search,
  Filter,
  Link,
  ImageIcon,
  RefreshCw,
  UploadCloud,
  Loader2,
  AlertCircle,
  Edit,
  Plus,
  X,
  CheckCircle,
  Info,
  Check,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

interface MediaItem {
  id: string
  filename: string
  filepath: string
  filesize: number
  filetype: string
  public_url: string
  thumbnail_url: string | null
  tags: string[]
  metadata: Record<string, any>
  usage_locations: Record<string, any>
  created_at: string
}

interface UploadStatus {
  file: File
  status: "pending" | "uploading" | "success" | "error" | "duplicate"
  progress: number
  error?: string
  response?: any
  duplicateId?: string
}

interface UnifiedMediaLibraryProps {
  selectionMode?: "single" | "multiple" | "none"
  onSelect?: (selected: MediaItem[]) => void // Changed to MediaItem[]
  mediaTypeFilter?: "image" | "video" | "all"
  initialSelectedItems?: MediaItem[] // Changed to MediaItem[]
}

export default function UnifiedMediaLibrary({
  selectionMode = "none",
  onSelect,
  mediaTypeFilter = "all",
  initialSelectedItems = [],
}: UnifiedMediaLibraryProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [setupInProgress, setSetupInProgress] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [videoUrls, setVideoUrls] = useState("")
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null)
  const [isAdmin, setIsAdmin] = useState(true) // Default to true to avoid flickering
  const [uploadQueue, setUploadQueue] = useState<UploadStatus[]>([])
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isProcessingQueue, setIsProcessingQueue] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [duplicateItems, setDuplicateItems] = useState<Record<string, string>>({}) // Maps file/URL to existing item ID
  const [selectedItems, setSelectedItems] = useState<MediaItem[]>(initialSelectedItems || []) // Changed to MediaItem[]
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropAreaRef = useRef<HTMLDivElement>(null)
  const supabase = createClientComponentClient()

  // Reference to track if we need to process the queue
  const pendingQueueRef = useRef(false)

  const [editingItem, setEditingItem] = useState<MediaItem | null>(null)
  const [newFilename, setNewFilename] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [newTag, setNewTag] = useState("")
  const [editingTags, setEditingTags] = useState<string[]>([])
  const [imageLoadError, setImageLoadError] = useState<Record<string, boolean>>({})
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [currentDuplicates, setCurrentDuplicates] = useState<{ url: string; existingItem: any }[]>([])

  // State for bulk operations
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false)
  const [isBulkAddTagDialogOpen, setIsBulkAddTagDialogOpen] = useState(false)
  const [isBulkRemoveTagDialogOpen, setIsBulkRemoveTagDialogOpen] = useState(false)
  const [bulkTagInput, setBulkTagInput] = useState("")

  useEffect(() => {
    fetchMedia()
  }, [])

  // Effect to monitor the upload queue and start processing when needed
  useEffect(() => {
    const pendingUploads = uploadQueue.filter((item) => item.status === "pending").length

    if (pendingUploads > 0 && !isProcessingQueue && pendingQueueRef.current) {
      pendingQueueRef.current = false
      processBulkUpload()
    }
  }, [uploadQueue, isProcessingQueue])

  // Initialize selected items from props
  useEffect(() => {
    // Ensure initialSelectedItems are full MediaItem objects if provided
    if (initialSelectedItems && initialSelectedItems.length > 0 && initialSelectedItems.every(item => typeof item === 'object' && item.id)) {
      setSelectedItems(initialSelectedItems)
    } else if (initialSelectedItems && initialSelectedItems.length > 0) {
      // This case should ideally not happen if props are passed correctly.
      // If initialSelectedItems are URLs, we'd need to find the full MediaItem objects.
      // For now, we'll log a warning and initialize as empty.
      console.warn("InitialSelectedItems are not full MediaItem objects. Please update the prop.")
      setSelectedItems([])
    }
  }, [initialSelectedItems])

  const checkMediaTable = async () => {
    try {
      // Try to query the media table
      const { data, error } = await supabase.from("media").select("id").limit(1)

      // If there's an error with code PGRST116, the table doesn't exist
      if (error && error.code === "PGRST116") {
        return false
      }

      return true
    } catch (err) {
      console.warn("Error checking media table:", err)
      return false
    }
  }

  const setupDatabase = async () => {
    setSetupInProgress(true)
    setError(null)

    try {
      // Create the media table directly using Supabase RPC
      const { error } = await supabase.rpc("exec_sql", {
        sql_query: `
          CREATE TABLE IF NOT EXISTS media (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            filename TEXT NOT NULL,
            filepath TEXT NOT NULL,
            filesize BIGINT NOT NULL DEFAULT 0,
            filetype TEXT NOT NULL,
            public_url TEXT NOT NULL,
            thumbnail_url TEXT,
            tags TEXT[] DEFAULT '{}',
            metadata JSONB DEFAULT '{}',
            usage_locations JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Add RLS policies
          ALTER TABLE media ENABLE ROW LEVEL SECURITY;
          
          -- Allow public read access
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE tablename = 'media' AND policyname = 'public_read_media'
            ) THEN
              CREATE POLICY "public_read_media"
              ON media
              FOR SELECT
              TO public
              USING (true);
            END IF;
          EXCEPTION WHEN OTHERS THEN
            -- Policy already exists or other error
          END $$;
          
          -- Allow authenticated users with admin role to manage media
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_policies WHERE tablename = 'media' AND policyname = 'admins_manage_media'
            ) THEN
              CREATE POLICY "admins_manage_media"
              ON media
              FOR ALL
              TO authenticated
              USING (
                EXISTS (
                  SELECT 1 FROM user_roles
                  WHERE user_id = auth.uid() 
                  AND role = 'admin'
                )
              );
            END IF;
          EXCEPTION WHEN OTHERS THEN
            -- Policy already exists or other error
          END $$;
        `,
      })

      if (error) {
        throw new Error(`Failed to create media table: ${error.message}`)
      }

      toast({
        title: "Setup complete",
        description: "Media table has been created successfully",
      })

      // Refresh media after setup
      fetchMedia()
    } catch (error) {
      console.error("Setup error:", error)
      setError("Failed to set up database. Please check console for details.")
      toast({
        title: "Setup failed",
        description: "Could not set up database tables",
        variant: "destructive",
      })
    } finally {
      setSetupInProgress(false)
    }
  }

  const fetchMedia = async () => {
    setLoading(true)
    setError(null)

    try {
      console.log("Fetching media from database...")

      // First check if the media table exists
      const tableExists = await checkMediaTable()

      if (!tableExists) {
        setError("Media table does not exist. Please set up the database.")
        setMediaItems([])
        setLoading(false)
        return
      }

      // Use direct query to get media items
      const { data, error } = await supabase.from("media").select("*").order("created_at", { ascending: false })

      if (error) {
        throw error
      }

      console.log("Media items fetched:", data?.length || 0)
      setMediaItems(data || [])

      // Extract all unique tags
      const tags = new Set<string>()
      data?.forEach((item) => {
        if (item.tags) {
          item.tags.forEach((tag: string) => tags.add(tag))
        }
      })

      setAllTags(Array.from(tags))

      // Reset image load errors
      setImageLoadError({})
    } catch (error) {
      console.error("Error fetching media:", error)
      setError("Failed to load media library. Please check console for details.")
      toast({
        title: "Error",
        description: "Failed to load media library",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return

    // First check if the media table exists
    const tableExists = await checkMediaTable()

    // If the table doesn't exist, set it up automatically
    if (!tableExists) {
      await setupDatabase()
    }

    if (files.length === 1) {
      // Single file upload
      const file = files[0]
      setUploadingFile(true)

      try {
        // Check for duplicates first
        const fileHash = await calculateFileHash(file)
        const duplicateCheckResponse = await fetch("/api/check-media-duplicate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileHash,
            filename: file.name,
          }),
        })

        const duplicateCheckResult = await duplicateCheckResponse.json()

        if (duplicateCheckResult.isDuplicate) {
          // If it's a duplicate, use the existing file instead of uploading again
          toast({
            title: "Duplicate file",
            description: duplicateCheckResult.reason || `File "${file.name}" already exists in the media library.`,
            variant: "warning",
          })

          // Highlight the duplicate file in the grid by scrolling to it
          const duplicateId = duplicateCheckResult.existingItem?.id
          if (duplicateId) {
            setTimeout(() => {
              const element = document.getElementById(`media-item-${duplicateId}`)
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" })
                element.classList.add("ring-2", "ring-yellow-500", "ring-offset-2", "ring-offset-black")
                setTimeout(() => {
                  element.classList.remove("ring-2", "ring-yellow-500", "ring-offset-2", "ring-offset-black")
                }, 3000)
              }
            }, 500)
          }

          // If in selection mode, select the duplicate
          if (selectionMode !== "none" && duplicateCheckResult.existingItem) {
            toggleItemSelection(duplicateCheckResult.existingItem)
          }

          setUploadingFile(false)
          return
        }

        // Create a FormData object
        const formData = new FormData()
        formData.append("file", file)

        // Upload the file directly with timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

        const response = await fetch("/api/bulk-upload", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const result = await response.text()
          console.error("Upload error response:", result)
          throw new Error("Failed to upload file: " + (result || response.statusText))
        }

        const result = await response.json()

        // Check if the file was a duplicate
        if (result.duplicate) {
          toast({
            title: "Duplicate file",
            description: `${result.message}. The existing file will be used.`,
            variant: "warning",
          })

          // Highlight the duplicate file in the grid by scrolling to it
          const duplicateId = result.existingFile?.id
          if (duplicateId) {
            setTimeout(() => {
              const element = document.getElementById(`media-item-${duplicateId}`)
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" })
                element.classList.add("ring-2", "ring-yellow-500", "ring-offset-2", "ring-offset-black")
                setTimeout(() => {
                  element.classList.remove("ring-2", "ring-yellow-500", "ring-offset-2", "ring-offset-black")
                }, 3000)
              }
            }, 500)
          }

          // If in selection mode, select the duplicate
          if (selectionMode !== "none" && result.existingFile) {
            toggleItemSelection(result.existingFile)
          }
        } else {
          toast({
            title: "Success",
            description: `File uploaded successfully${result.convertedToWebP ? " (converted to WebP)" : ""}`,
          })

          // If in selection mode, select the new file
          // Assuming result contains the full MediaItem on successful upload
          if (selectionMode !== "none" && result.mediaItem) {
             toggleItemSelection(result.mediaItem)
          } else if (selectionMode !== "none" && result.publicUrl) {
            // Fallback if full mediaItem is not in result, though it should be
            const newItem = mediaItems.find(mi => mi.public_url === result.publicUrl);
            if (newItem) toggleItemSelection(newItem);
          }
        }

        // Refresh the media list
        fetchMedia()
      } catch (error) {
        console.error("Error uploading file:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to upload file",
          variant: "destructive",
        })
      } finally {
        setUploadingFile(false)
      }
    } else {
      // Multiple files upload - similar changes as above
      const newUploads: UploadStatus[] = Array.from(files).map((file) => ({
        file,
        status: "pending",
        progress: 0,
      }))

      // Set the flag to process the queue
      pendingQueueRef.current = true

      // Add files to the queue
      setUploadQueue((prev) => [...prev, ...newUploads])

      // Show the upload dialog
      setIsUploadDialogOpen(true)

      // Force start the upload process immediately
      setTimeout(() => {
        if (!isProcessingQueue) {
          processBulkUpload()
        }
      }, 100)
    }
  }

  const calculateFileHash = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        if (!e.target?.result) {
          resolve("")
          return
        }

        const arrayBuffer = e.target.result as ArrayBuffer
        const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
        resolve(hashHex)
      }
      reader.readAsArrayBuffer(file)
    })
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    handleFileUpload(Array.from(files))

    // Reset the input
    e.target.value = ""
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileUpload(Array.from(files))
    }
  }, [])

  const processBulkUpload = async () => {
    if (isProcessingQueue || uploadQueue.length === 0) return

    console.log("Starting bulk upload process")
    setIsProcessingQueue(true)

    // Process files in parallel with a limit (3 at a time)
    const batchSize = 3
    const pendingUploads = uploadQueue.filter((item) => item.status === "pending")
    const duplicates = []

    for (let i = 0; i < pendingUploads.length; i += batchSize) {
      const batch = pendingUploads.slice(i, i + batchSize)

      // Process batch in parallel
      await Promise.all(
        batch.map(async (item) => {
          // Find the index in the original queue
          const queueIndex = uploadQueue.findIndex(
            (queueItem) => queueItem.file.name === item.file.name && queueItem.status === "pending",
          )

          if (queueIndex === -1) return // Skip if not found

          // Update status to uploading
          setUploadQueue((prev) => {
            const updated = [...prev]
            updated[queueIndex] = { ...updated[queueIndex], status: "uploading", progress: 5 }
            return updated
          })

          try {
            // Check for duplicates first
            const fileHash = await calculateFileHash(item.file)
            const duplicateCheckResponse = await fetch("/api/check-media-duplicate", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                fileHash,
                filename: item.file.name,
              }),
            })

            const duplicateCheckResult = await duplicateCheckResponse.json()

            if (duplicateCheckResult.isDuplicate) {
              // Mark as duplicate
              setUploadQueue((prev) => {
                const updated = [...prev]
                updated[queueIndex] = {
                  ...updated[queueIndex],
                  status: "duplicate",
                  progress: 100,
                  response: duplicateCheckResult,
                  duplicateId: duplicateCheckResult.existingItem?.id,
                }
                return updated
              })

              // Add to duplicates list
              duplicates.push({
                filename: item.file.name,
                existingFile: duplicateCheckResult.existingItem,
              })

              // Add to duplicates map
              setDuplicateItems((prev) => ({
                ...prev,
                [item.file.name]: duplicateCheckResult.existingItem?.id,
              }))

              // If in selection mode, select the duplicate
              if (selectionMode !== "none" && duplicateCheckResult.existingItem) {
                toggleItemSelection(duplicateCheckResult.existingItem)
              }

              return
            }

            // Create a FormData object
            const formData = new FormData()
            formData.append("file", item.file)

            // Simulate gradual progress updates
            const progressUpdater = setInterval(() => {
              setUploadQueue((prev) => {
                const current = [...prev]
                const currentItem = current[queueIndex]

                // Only update if still uploading and progress < 90
                if (currentItem.status === "uploading" && currentItem.progress < 90) {
                  // Increase by a small random amount to simulate progress
                  const increment = Math.floor(Math.random() * 5) + 3
                  const newProgress = Math.min(90, currentItem.progress + increment)
                  current[queueIndex] = { ...currentItem, progress: newProgress }
                }
                return current
              })
            }, 800)

            const response = await fetch("/api/bulk-upload", {
              method: "POST",
              body: formData,
            })

            // Clear the interval
            clearInterval(progressUpdater)

            // Update progress to 95%
            setUploadQueue((prev) => {
              const updated = [...prev]
              updated[queueIndex] = { ...updated[queueIndex], progress: 95 }
              return updated
            })

            const result = await response.json()

            if (!response.ok) {
              throw new Error(result.error || "Upload failed")
            }

            // Check if the file was a duplicate
            if (result.duplicate) {
              duplicates.push({
                filename: item.file.name,
                existingFile: result.existingFile,
              })

              // Mark as duplicate
              setUploadQueue((prev) => {
                const updated = [...prev]
                updated[queueIndex] = {
                  ...updated[queueIndex],
                  status: "duplicate",
                  progress: 100,
                  response: result,
                  duplicateId: result.existingFile?.id,
                }
                return updated
              })

              // Add to duplicates map
              setDuplicateItems((prev) => ({
                ...prev,
                [item.file.name]: result.existingFile?.id,
              }))

              // If in selection mode, select the duplicate
              if (selectionMode !== "none" && result.existingFile) {
                toggleItemSelection(result.existingFile)
              }
            } else {
              // Success
              setUploadQueue((prev) => {
                const updated = [...prev]
                updated[queueIndex] = {
                  ...updated[queueIndex],
                  status: "success",
                  progress: 100,
                  response: result,
                }
                return updated
              })

              // If in selection mode, select the new file
              // Assuming result.mediaItem contains the full MediaItem object
              if (selectionMode !== "none" && result.mediaItem) {
                toggleItemSelection(result.mediaItem)
              } else if (selectionMode !== "none" && result.publicUrl) {
                 // Fallback if full mediaItem is not in result
                const newItem = mediaItems.find(mi => mi.public_url === result.publicUrl);
                if (newItem) toggleItemSelection(newItem);
              }
            }
          } catch (error) {
            // Exception
            setUploadQueue((prev) => {
              const updated = [...prev]
              updated[queueIndex] = {
                ...updated[queueIndex],
                status: "error",
                progress: 100,
                error: error instanceof Error ? error.message : "Unknown error",
              }
              return updated
            })
          }
        }),
      )
    }

    // Refresh media list after all uploads
    fetchMedia()
    setIsProcessingQueue(false)

    // Count results
    const successful = uploadQueue.filter((item) => item.status === "success").length
    const converted = uploadQueue.filter((item) => item.status === "success" && item.response?.convertedToWebP).length
    const failed = uploadQueue.filter((item) => item.status === "error").length
    const pending = uploadQueue.filter((item) => item.status === "pending").length
    const duplicateCount = duplicates.length

    toast({
      title: "Bulk upload progress",
      description: `${successful} files uploaded successfully${converted > 0 ? ` (${converted} converted to WebP)` : ""}${duplicateCount > 0 ? `, ${duplicateCount} duplicates skipped` : ""}, ${failed} files failed, ${pending} files pending`,
      variant: successful > 0 ? "default" : "destructive",
    })

    // If there were duplicates, show a separate toast with details
    if (duplicateCount > 0) {
      toast({
        title: `${duplicateCount} duplicate files detected`,
        description: "Duplicate files were skipped. The existing files will be used.",
        variant: "warning",
      })
    }

    console.log("Bulk upload process completed")
  }

  const clearUploadQueue = () => {
    // Only clear completed uploads
    setUploadQueue((prev) => prev.filter((item) => item.status === "pending" || item.status === "uploading"))
  }

  const resetUploadQueue = () => {
    if (isProcessingQueue) {
      toast({
        title: "Upload in progress",
        description: "Please wait for the current upload to complete",
        variant: "destructive",
      })
      return
    }
    setUploadQueue([])
  }

  const cancelUpload = (index: number) => {
    setUploadQueue((prev) => {
      const updated = [...prev]
      // Only allow canceling pending uploads
      if (updated[index].status === "pending") {
        updated[index] = { ...updated[index], status: "error", progress: 0, error: "Cancelled by user" }
      }
      return updated
    })
  }

  const handleVideoAdd = async () => {
    // Validate input
    if (!videoUrls.trim()) {
      toast({
        title: "Error",
        description: "Please enter at least one video URL",
        variant: "destructive",
      })
      return
    }

    setUploadingVideo(true)
    let successCount = 0
    let failCount = 0
    let duplicateCount = 0
    const results = { vimeo: 0, youtube: 0, linkedin: 0 }
    const processedUrls = new Set() // Track processed URLs to avoid duplicates
    const foundDuplicates: { url: string; existingItem: any }[] = []

    try {
      // First check if the media table exists
      const tableExists = await checkMediaTable()

      // If the table doesn't exist, set it up automatically
      if (!tableExists) {
        await setupDatabase()
      }

      // Split the input by common delimiters to handle multiple URLs
      const urls = videoUrls.split(/[\r\n\s,;]+/).filter((url) => url.trim().length > 0)

      if (urls.length === 0) {
        toast({
          title: "No valid URLs found",
          description: "Please check your input and try again",
          variant: "destructive",
        })
        return
      }

      // Process each video URL
      for (const url of urls) {
        try {
          // Skip if we've already processed this URL
          if (processedUrls.has(url)) {
            continue
          }

          processedUrls.add(url)

          // Check for duplicates before processing
          const duplicateCheckResponse = await fetch("/api/check-media-duplicate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url,
            }),
          })

          const duplicateCheckResult = await duplicateCheckResponse.json()

          if (duplicateCheckResult.isDuplicate) {
            // If it's a duplicate, use the existing video instead of processing again
            duplicateCount++
            foundDuplicates.push({
              url,
              existingItem: duplicateCheckResult.existingItem,
            })

            // Add to duplicates map
            setDuplicateItems((prev) => ({
              ...prev,
              [url]: duplicateCheckResult.existingItem?.id,
            }))

            // If in selection mode, select the duplicate
            if (selectionMode !== "none" && duplicateCheckResult.existingItem) {
              toggleItemSelection(duplicateCheckResult.existingItem)
            }

            continue
          }

          // Process the video URL through the API
          const response = await fetch("/api/process-video-url", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              url,
              isBts: false,
            }),
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.error || "Failed to process video URL")
          }

          // Check if it was a duplicate
          if (result.duplicate) {
            duplicateCount++
            foundDuplicates.push({
              url,
              existingItem: result.existingVideo,
            })

            // Add to duplicates map
            setDuplicateItems((prev) => ({
              ...prev,
              [url]: result.existingVideo?.id,
            }))

            // If in selection mode, select the duplicate
            if (selectionMode !== "none" && result.existingVideo) {
              toggleItemSelection(result.existingVideo)
            }

            continue
          }

          // Count by platform
          if (result.platform === "vimeo") results.vimeo++
          else if (result.platform === "youtube") results.youtube++
          else if (result.platform === "linkedin") results.linkedin++

          // If in selection mode, select the new video
          // Assuming result.videoItem contains the full MediaItem object
          if (selectionMode !== "none" && result.videoItem) {
            toggleItemSelection(result.videoItem)
          } else if (selectionMode !== "none" && result.url) {
            // Fallback if full videoItem is not in result
            const newItem = mediaItems.find(mi => mi.public_url === result.url);
            if (newItem) toggleItemSelection(newItem);
          }

          successCount++
        } catch (err) {
          console.error("Error processing video URL:", url, err)
          failCount++
        }
      }

      // Show summary toast
      let successMessage = `${successCount} videos added successfully`
      if (results.vimeo > 0 || results.youtube > 0 || results.linkedin > 0) {
        successMessage += ` (${results.vimeo} Vimeo, ${results.youtube} YouTube, ${results.linkedin} LinkedIn)`
      }

      toast({
        title: successCount > 0 ? "Success" : "Error",
        description: `${successMessage}${duplicateCount > 0 ? `, ${duplicateCount} duplicates skipped` : ""}${failCount > 0 ? `, ${failCount} failed` : ""}`,
        variant: successCount > 0 ? "default" : "destructive",
      })

      // If there were duplicates, show them in a dialog
      if (duplicateCount > 0) {
        setCurrentDuplicates(foundDuplicates)
        setDuplicateDialogOpen(true)
      }

      // Reset form if any successful and refresh
      if (successCount > 0) {
        setVideoUrls("")
        fetchMedia()
      }
    } catch (error) {
      console.error("Error adding videos:", error)
      toast({
        title: "Error",
        description: "Failed to add videos",
        variant: "destructive",
      })
    } finally {
      setUploadingVideo(false)
    }
  }

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)

    toast({
      title: "URL copied",
      description: "Media URL copied to clipboard",
    })
  }

  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const toggleItemSelection = (itemToToggle: MediaItem) => {
    // When selectionMode is "none", it implies we are on the main /admin/media page,
    // where selection should always be enabled for bulk actions.
    const currentSelectionMode = selectionMode === "none" ? "multiple" : selectionMode;

    if (currentSelectionMode === "single") {
      setSelectedItems([itemToToggle])
    } else { // "multiple"
      setSelectedItems((prevSelectedItems) => {
        // Check if this item is already selected by ID, public_url, or filepath
        const isAlreadySelected = prevSelectedItems.some(item => 
          item.id === itemToToggle.id || 
          item.public_url === itemToToggle.public_url || 
          item.filepath === itemToToggle.filepath
        )
        
        if (isAlreadySelected) {
          // Item is selected (or a duplicate is selected), remove all matching items
          return prevSelectedItems.filter((item) => 
            item.id !== itemToToggle.id && 
            item.public_url !== itemToToggle.public_url && 
            item.filepath !== itemToToggle.filepath
          )
        } else {
          // Item is not selected, add it (and remove any duplicates first)
          const deduplicatedItems = prevSelectedItems.filter(item => 
            item.public_url !== itemToToggle.public_url && 
            item.filepath !== itemToToggle.filepath
          )
          return [...deduplicatedItems, itemToToggle]
        }
      })
    }
  }

  // Effect to log selection changes for debugging
  useEffect(() => {
    console.log("Selected items changed:", selectedItems)
  }, [selectedItems])

  const handleConfirmSelection = () => {
    if (onSelect && selectedItems.length > 0) {
      onSelect(selectedItems)
    }
  }

  const filteredMedia = mediaItems.filter((item) => {
    // Filter by search term
    const matchesSearch =
      item.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.metadata && JSON.stringify(item.metadata).toLowerCase().includes(searchTerm.toLowerCase()))

    // Filter by selected tags
    const matchesTags = selectedTags.length === 0 || selectedTags.every((tag) => item.tags && item.tags.includes(tag))

    // Filter by type (tab)
    const matchesType =
      activeTab === "all" ||
      item.filetype === activeTab ||
      (activeTab === "video" && ["vimeo", "youtube", "linkedin"].includes(item.filetype))

    // Filter by media type filter prop
    const matchesMediaTypeFilter =
      mediaTypeFilter === "all" ||
      (mediaTypeFilter === "image" && item.filetype === "image") ||
      (mediaTypeFilter === "video" &&
        (item.filetype === "video" || ["vimeo", "youtube", "linkedin"].includes(item.filetype)))

    return matchesSearch && matchesTags && matchesType && matchesMediaTypeFilter
  })

  const calculateTotalStorage = (): number => {
    return mediaItems.reduce((total, item) => total + (item.filesize || 0), 0)
  }

  const handleEditMedia = (item: MediaItem) => {
    setEditingItem(item)
    setNewFilename(item.filename)
    setEditingTags(item.tags || [])
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingItem) return

    try {
      // Validate input
      if (!newFilename.trim()) {
        toast({
          title: "Error",
          description: "Filename cannot be empty",
          variant: "destructive",
        })
        return
      }

      console.log("Updating media item:", editingItem.id, {
        filename: newFilename,
        tags: editingTags,
      })

      // Use direct Supabase update
      const { error } = await supabase
        .from("media")
        .update({
          filename: newFilename,
          tags: editingTags,
        })
        .eq("id", editingItem.id)

      if (error) {
        throw new Error(error.message || "Failed to update media")
      }

      // Update local state
      setMediaItems(
        mediaItems.map((item) =>
          item.id === editingItem.id ? { ...item, filename: newFilename, tags: editingTags } : item,
        ),
      )

      // Extract all unique tags for the filter
      const tags = new Set<string>()
      mediaItems.forEach((item) => {
        if (item.tags) {
          item.tags.forEach((tag: string) => tags.add(tag))
        }
      })
      // Add any new tags
      editingTags.forEach((tag) => tags.add(tag))
      setAllTags(Array.from(tags))

      toast({
        title: "Success",
        description: "Media updated successfully",
      })

      // Close the dialog
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error("Error updating media:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update media",
        variant: "destructive",
      })
    }
  }

  const handleAddTag = () => {
    if (!newTag.trim()) return

    // Don't add duplicate tags
    if (!editingTags.includes(newTag.trim())) {
      setEditingTags([...editingTags, newTag.trim()])
    }
    setNewTag("")
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setEditingTags(editingTags.filter((tag) => tag !== tagToRemove))
  }

  const handleDeleteMedia = async (id: string, filepath: string, filetype: string) => {
    if (!confirm("Are you sure you want to delete this media item?")) return

    // Optimistic UI update - remove the item from the UI immediately
    const itemToDelete = mediaItems.find((item) => item.id === id)
    setMediaItems(mediaItems.filter((item) => item.id !== id))

    // Show toast with loading state
    const toastId = toast({
      title: "Deleting media...",
      description: "Please wait while the media is being deleted",
    }).id

    try {
      // Use non-blocking fetch to delete the media
      const response = await fetch("/api/media/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: [{ id, filepath, filetype }] }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete media")
      }

      // Update toast on success
      toast({
        id: toastId,
        title: "Success",
        description: "Media deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting media:", error)

      // Revert the optimistic update
      if (itemToDelete) {
        setMediaItems((prev) => [...prev, itemToDelete])
      }

      // Show error toast
      toast({
        id: toastId,
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete media",
        variant: "destructive",
      })
    }
  }

  const handleImageError = (id: string) => {
    setImageLoadError((prev) => ({
      ...prev,
      [id]: true,
    }))
  }

  const highlightDuplicate = (id: string) => {
    if (!id) return

    // Close the dialog
    setDuplicateDialogOpen(false)

    // Highlight the item in the grid
    setTimeout(() => {
      const element = document.getElementById(`media-item-${id}`)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
        element.classList.add("ring-2", "ring-yellow-500", "ring-offset-2", "ring-offset-black")
        setTimeout(() => {
          element.classList.remove("ring-2", "ring-yellow-500", "ring-offset-2", "ring-offset-black")
        }, 3000)
      }
    }, 300)
  }

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return

    const itemsToDelete = selectedItems.map(item => ({
      id: item.id,
      filepath: item.filepath,
      filetype: item.filetype,
    }))

    // Show toast with loading state
    const toastId = toast({
      title: `Deleting ${itemsToDelete.length} media items...`,
      description: "Please wait...",
    }).id

    try {
      const response = await fetch("/api/media/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsToDelete }),
      })

      if (!response.ok) {
        let errorData;
        let errorMessage;
        try {
          errorData = await response.json();
          console.error("API deletion failed. Response status:", response.status, "Error data:", errorData); // Log full error data
          errorMessage = errorData?.error || errorData?.message || `Failed to delete media items (status: ${response.status})`;
          throw new Error(errorMessage);
        } catch (jsonError) {
          const errorText = await response.text();
          console.error("API deletion failed. Response status:", response.status, "Response text:", errorText); // Log text if not JSON
          errorMessage = `Failed to delete media items and parse error response (status: ${response.status}). Response: ${errorText}`;
          throw new Error(errorMessage);
        }
      }

      // If response.ok, then the API call was successful (even if some items in the batch failed)
      // The API route /api/media/delete now returns a more detailed response
      const resultData = await response.json();
      console.log("Bulk delete API response:", resultData);

      // Dismiss the initial "Deleting..." toast
      toast.dismiss(toastId);

      if (resultData.success) {
         toast({ // Changed from toast.update
          title: "Success",
          description: resultData.message || `${itemsToDelete.length} media items processed.`,
          variant: "default",
        });
      } else {
        // Some or all items failed, but the API call itself was okay
        toast({ // Changed from toast.update
          title: "Partial Deletion or Errors",
          description: resultData.message || "Some items could not be deleted. Check console for details.",
          variant: "warning", // Use warning for partial success or specific errors
        });
        // Log detailed results if available
        if (resultData.results) {
          console.warn("Detailed deletion results:", resultData.results);
        }
      }
      
      // Update local state based on successfully deleted items from response if possible,
      // or just refresh all media as a simpler approach for now.
      // For a more precise update:
      const successfullyDeletedIds = resultData.results?.filter((r: any) => r.status === 'success').map((r: any) => r.id) || [];
      if (successfullyDeletedIds.length > 0) {
         setMediaItems(prevItems => prevItems.filter(item => !successfullyDeletedIds.includes(item.id)))
      }
      
      if(resultData.results?.every((r: any) => r.status === 'success')) {
        setSelectedItems([]) // Clear selection only if all were successful
      } else {
        // Keep selection for items that failed, or clear all - depends on desired UX
        // For now, let's clear items that were successfully deleted from the selection
        setSelectedItems(prevSelected => prevSelected.filter(item => !successfullyDeletedIds.includes(item.id)));
      }

    } catch (error) {
      console.error("Error during handleBulkDelete (client-side or network error):", error);
      // This catch block handles errors from the fetch call itself (network error)
      // or errors thrown from the !response.ok block
      toast({ // Changed from toast.update
        title: "Error Deleting Items",
        description: error instanceof Error ? error.message : "An unknown client-side or network error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsBulkDeleteDialogOpen(false)
    }
  }

  const handleBulkAddTag = async () => {
    if (selectedItems.length === 0 || !bulkTagInput.trim()) return

    const tagToAdd = bulkTagInput.trim()
    let successCount = 0
    let errorCount = 0

    const toastId = toast({
      title: `Adding tag "${tagToAdd}" to ${selectedItems.length} items...`,
      description: "Processing...",
    }).id

    for (const item of selectedItems) {
      const currentTags = item.tags || []
      if (currentTags.includes(tagToAdd)) {
        // Optionally, count as success or skip
        // successCount++;
        continue // Tag already exists
      }
      const newTags = [...currentTags, tagToAdd]

      try {
        const response = await supabase
          .from("media")
          .update({ tags: newTags, filename: item.filename }) // filename is often required by policies/triggers
          .eq("id", item.id)

        if (response.error) {
          throw response.error
        }
        successCount++
      } catch (err) {
        console.error(`Failed to add tag to item ${item.id}:`, err)
        errorCount++
      }
    }

    toast.update(toastId, {
      title: errorCount > 0 ? "Partial Success" : "Success",
      description: `Tag "${tagToAdd}" added to ${successCount} items. ${errorCount > 0 ? `${errorCount} items failed.` : ''}`,
      variant: errorCount > 0 ? "warning" : "default",
    })

    if (successCount > 0) {
      fetchMedia() // Refresh all media to show updated tags
    }
    setSelectedItems([])
    setBulkTagInput("")
    setIsBulkAddTagDialogOpen(false)
  }

  const handleBulkRemoveTag = async () => {
    if (selectedItems.length === 0 || !bulkTagInput.trim()) return

    const tagToRemove = bulkTagInput.trim()
    let successCount = 0
    let errorCount = 0

    const toastId = toast({
      title: `Removing tag "${tagToRemove}" from ${selectedItems.length} items...`,
      description: "Processing...",
    }).id

    for (const item of selectedItems) {
      const currentTags = item.tags || []
      if (!currentTags.includes(tagToRemove)) {
        // Optionally, count as success or skip
        // successCount++;
        continue // Tag doesn't exist
      }
      const newTags = currentTags.filter(tag => tag !== tagToRemove)

      try {
        const response = await supabase
          .from("media")
          .update({ tags: newTags, filename: item.filename }) // filename might be required
          .eq("id", item.id)

        if (response.error) {
          throw response.error
        }
        successCount++
      } catch (err) {
        console.error(`Failed to remove tag from item ${item.id}:`, err)
        errorCount++
      }
    }

    toast.update(toastId, {
      title: errorCount > 0 ? "Partial Success" : "Success",
      description: `Tag "${tagToRemove}" removed from ${successCount} items. ${errorCount > 0 ? `${errorCount} items failed.` : ''}`,
      variant: errorCount > 0 ? "warning" : "default",
    })

    if (successCount > 0) {
      fetchMedia() // Refresh all media
    }
    setSelectedItems([])
    setBulkTagInput("")
    setIsBulkRemoveTagDialogOpen(false)
  }

  const handleCleanupDuplicates = async () => {
    const confirmCleanup = window.confirm("This will remove duplicate media items from the database. Are you sure you want to continue?")
    if (!confirmCleanup) return

    const toastId = toast({
      title: "Cleaning up duplicates...",
      description: "This may take a moment",
    }).id

    try {
      const response = await fetch("/api/cleanup-media-duplicates", {
        method: "POST",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to cleanup duplicates")
      }

      toast.update(toastId, {
        title: "Cleanup Complete",
        description: `${result.duplicatesRemoved} duplicate items removed`,
        variant: "default",
      })

      // Refresh the media list
      fetchMedia()
    } catch (error) {
      console.error("Error cleaning up duplicates:", error)
      toast.update(toastId, {
        title: "Cleanup Failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    }
  }

  function renderMediaItem(item: MediaItem) {
    const isVimeo = item.filetype === "vimeo"
    const isYoutube = item.filetype === "youtube"
    const isLinkedin = item.filetype === "linkedin"
    const isImage = item.filetype === "image"
    const hasImageError = imageLoadError[item.id]
    // Check selection by ID, public_url, or filepath to handle duplicates better
    const isSelected = selectedItems.some(selected => 
      selected.id === item.id || 
      selected.public_url === item.public_url || 
      selected.filepath === item.filepath
    )
    // Selection is now always possible on the main page (selectionMode === "none")
    const canSelect = selectionMode !== "none" || selectionMode === "none";


    return (
      <div
        key={item.id}
        id={`media-item-${item.id}`}
        className={`bg-gray-900 rounded-lg overflow-hidden cursor-pointer touch-manipulation transition-all ${
          isSelected ? "ring-2 ring-blue-500 shadow-lg" : "hover:shadow-md"
        }`}
        onClick={canSelect ? () => toggleItemSelection(item) : undefined}
      >
        <div
          className="relative h-32 sm:h-40" // Responsive height
          // Removed redundant onClick from this inner div
        >
          {/* Visual cue for selection (checkbox) always visible if canSelect */}
          {canSelect && (
             <div className="absolute top-2 left-2 z-10">
              <div
                role="checkbox"
                aria-checked={isSelected}
                tabIndex={0} // Make it focusable
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all touch-manipulation ${
                  isSelected ? "bg-blue-500 border-blue-500" : "bg-black/50 border-white/70 group-hover:border-white"
                }`}
                onClick={(e: React.MouseEvent<HTMLDivElement>) => { 
                  e.stopPropagation(); // Prevent card click when checkbox is clicked
                  toggleItemSelection(item);
                }}
                onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => { // Allow selection with Space/Enter
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleItemSelection(item);
                  }
                }}
              >
                {isSelected && <Check className="h-4 w-4 text-white" />}
              </div>
            </div>
          )}
          {item.thumbnail_url && !hasImageError ? (
            <Image
              src={item.thumbnail_url || "/placeholder.svg"}
              alt={item.filename}
              fill
              className="object-cover"
              onError={() => handleImageError(item.id)}
              unoptimized // Skip Next.js image optimization to avoid CORS issues
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              {isImage ? (
                <Image
                  src={item.public_url || "/placeholder.svg"}
                  alt={item.filename}
                  fill
                  className="object-cover"
                  onError={() => handleImageError(item.id)}
                  unoptimized
                />
              ) : (
                <span className="text-gray-400">{item.filetype}</span>
              )}
            </div>
          )}
          {isVimeo && (
            <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">Vimeo</div>
          )}
          {isYoutube && (
            <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">YouTube</div>
          )}
          {isLinkedin && (
            <div className="absolute top-2 right-2 bg-blue-800 text-white text-xs px-2 py-1 rounded">LinkedIn</div>
          )}
          {/* Preview button - can be styled as an icon button */}
          {isImage && ( // Show preview option for images
            <button
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation(); // Prevent selection toggle if clicking the preview button
                setSelectedImage(item);
              }}
              className="absolute bottom-2 right-2 bg-gray-800/70 text-white text-xs px-2 py-1 rounded flex items-center hover:bg-gray-700/90 transition-colors z-10"
              title="Preview image"
            >
              <ImageIcon size={12} className="mr-1" /> Preview
            </button>
          )}
        </div>
        <div className="p-3">
          <p className="text-sm font-medium truncate leading-tight" title={item.filename}>
            {item.filename}
          </p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500 flex items-center">
              {isVimeo || isYoutube || isLinkedin ? (
                <span className="bg-gray-800 text-purple-400 px-2 py-1 rounded-full text-xs">
                  External Video
                </span>
              ) : (
                <span className="bg-gray-800 text-blue-400 px-2 py-1 rounded-full text-xs font-medium">
                  {formatFileSize(item.filesize)}
                </span>
              )}
            </p>
          </div>

          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center mt-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-xs flex-1 min-w-0 touch-manipulation"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation();
                handleCopyUrl(item.public_url);
              }}
            >
              {copiedUrl === item.public_url ? (
                <>
                  <CheckCircle className="h-3 w-3 text-green-500 shrink-0" />
                  <span className="truncate">Copied</span>
                </>
              ) : (
                <>
                  <Link className="h-3 w-3 shrink-0" />
                  <span className="truncate">Copy URL</span>
                </>
              )}
            </Button>

            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  handleEditMedia(item);
                }}
                className="h-9 w-9 touch-manipulation"
                title="Edit media"
              >
                <Edit className="h-4 w-4 text-blue-500" />
                <span className="sr-only">Edit</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  handleDeleteMedia(item.id, item.filepath, item.filetype);
                }}
                className="h-9 w-9 touch-manipulation"
                title="Delete media"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      {selectionMode === "none" && <h1 className="text-3xl font-serif mb-8">Media Library</h1>}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex flex-col gap-4">
            <p>{error}</p>
            {error.includes("database") && (
              <Button onClick={setupDatabase} disabled={setupInProgress} className="w-fit flex items-center gap-2">
                {setupInProgress ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Set up database
                  </>
                )}
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-900 p-4 rounded-lg">
          <h2 className="text-xl mb-4">Upload Files</h2>
          <div className="space-y-4">
            <div
              ref={dropAreaRef}
              className={`border-2 border-dashed rounded-lg p-6 md:p-8 text-center transition-colors touch-manipulation ${
                isDragging ? "border-blue-500 bg-blue-500/10" : "border-gray-700 hover:border-gray-500"
              }`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center justify-center gap-2">
                <UploadCloud className="h-8 w-8 md:h-10 md:w-10 text-gray-400" />
                <p className="text-base md:text-lg font-medium">{isDragging ? "Drop files here" : "Drag & drop files here"}</p>
                <p className="text-sm text-gray-400">
                  or <span className="text-blue-500 cursor-pointer">tap to upload</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">Supports single or multiple files</p>
                {uploadingFile && (
                  <div className="flex items-center gap-2 mt-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Uploading...</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept={
                  mediaTypeFilter === "image"
                    ? "image/*"
                    : mediaTypeFilter === "video"
                      ? "video/*"
                      : "image/*,video/*,audio/*,application/pdf"
                }
              />
            </div>
            <div className="text-sm text-gray-400">
              <p>Upload files directly to the media library.</p>
              <p className="mt-1">Select multiple files or drag and drop a folder to upload in bulk.</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 p-4 rounded-lg">
          <h2 className="text-xl mb-4">Add Videos</h2>
          <div className="space-y-4">
            <Textarea
              placeholder="Paste one or more video URLs (one per line or separated by spaces)"
              value={videoUrls}
              onChange={(e) => setVideoUrls(e.target.value)}
              disabled={uploadingVideo || !!error}
              className="bg-gray-800 border-gray-700 min-h-[100px]"
            />
            <Button onClick={handleVideoAdd} disabled={!videoUrls || uploadingVideo || !!error} className="w-full">
              {uploadingVideo ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                "Add Videos"
              )}
            </Button>
            <div className="text-sm text-gray-400">
              <p>
                You can paste multiple video URLs. The system will automatically detect and process all valid YouTube,
                Vimeo, and LinkedIn video links.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search media files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border-gray-700 pl-10 h-12 text-base"
          />
        </div>

        {/* Filter tags - mobile responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <Filter size={18} className="text-gray-400" />
            <span className="text-sm text-gray-400">Filter by tags:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {allTags.slice(0, 6).map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`text-xs px-3 py-2 rounded-full transition-colors touch-manipulation ${
                  selectedTags.includes(tag) 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {tag}
              </button>
            ))}
            {allTags.length > 6 && (
              <span className="text-xs text-gray-400 px-2 py-2">
                +{allTags.length - 6} more
              </span>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="bg-gray-800">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="image">Images</TabsTrigger>
          <TabsTrigger value="video">Videos</TabsTrigger>
          <TabsTrigger value="vimeo">Vimeo</TabsTrigger>
          <TabsTrigger value="youtube">YouTube</TabsTrigger>
          <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl">All Media ({filteredMedia.length})</h2>
            <div className="bg-gray-800 px-3 py-1 rounded-md text-sm">
              Total Storage:{" "}
              <span className="font-medium text-blue-400">{formatFileSize(calculateTotalStorage())}</span>
            </div>
          </div>
          {renderMediaGrid()}
        </TabsContent>

        <TabsContent value="image" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl">Images ({filteredMedia.length})</h2>
            <div className="bg-gray-800 px-3 py-1 rounded-md text-sm">
              Total Storage:{" "}
              <span className="font-medium text-blue-400">{formatFileSize(calculateTotalStorage())}</span>
            </div>
          </div>
          {renderMediaGrid()}
        </TabsContent>

        <TabsContent value="video" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl">Videos ({filteredMedia.length})</h2>
            <div className="bg-gray-800 px-3 py-1 rounded-md text-sm">
              Total Storage:{" "}
              <span className="font-medium text-blue-400">{formatFileSize(calculateTotalStorage())}</span>
            </div>
          </div>
          {renderMediaGrid()}
        </TabsContent>

        <TabsContent value="vimeo" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl">Vimeo Videos ({filteredMedia.length})</h2>
            <div className="bg-gray-800 px-3 py-1 rounded-md text-sm">
              Total Storage:{" "}
              <span className="font-medium text-blue-400">{formatFileSize(calculateTotalStorage())}</span>
            </div>
          </div>
          {renderMediaGrid()}
        </TabsContent>

        <TabsContent value="youtube" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl">YouTube Videos ({filteredMedia.length})</h2>
            <div className="bg-gray-800 px-3 py-1 rounded-md text-sm">
              Total Storage:{" "}
              <span className="font-medium text-blue-400">{formatFileSize(calculateTotalStorage())}</span>
            </div>
          </div>
          {renderMediaGrid()}
        </TabsContent>

        <TabsContent value="linkedin" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl">LinkedIn Videos ({filteredMedia.length})</h2>
            <div className="bg-gray-800 px-3 py-1 rounded-md text-sm">
              Total Storage:{" "}
              <span className="font-medium text-blue-400">{formatFileSize(calculateTotalStorage())}</span>
            </div>
          </div>
          {renderMediaGrid()}
        </TabsContent>

        <TabsContent value="other" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl">Other Files ({filteredMedia.length})</h2>
            <div className="bg-gray-800 px-3 py-1 rounded-md text-sm">
              Total Storage:{" "}
              <span className="font-medium text-blue-400">{formatFileSize(calculateTotalStorage())}</span>
            </div>
          </div>
          {renderMediaGrid()}
        </TabsContent>
      </Tabs>

      {/* Selection controls (used when component is embedded for selection) */}
      {selectionMode !== "none" && selectionMode !== "single" && selectionMode !== "multiple" && ( // This condition might need adjustment based on final design
        <div className="fixed bottom-4 right-4 bg-gray-900 p-3 rounded-lg shadow-lg flex items-center gap-3 z-50">
          <span className="text-sm text-gray-300">{selectedItems.length} items selected</span>
          <Button onClick={handleConfirmSelection} disabled={selectedItems.length === 0}>
            Confirm Selection
          </Button>
        </div>
      )}

      {/* Bulk Actions UI */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 bg-gray-900 p-3 rounded-lg shadow-xl border border-gray-700 z-50 md:left-1/2 md:right-auto md:transform md:-translate-x-1/2 md:w-auto">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
            <span className="text-sm text-gray-300 text-center md:text-left md:pl-2">
              {selectedItems.length} item{selectedItems.length > 1 ? "s" : ""} selected
            </span>
            <div className="flex gap-2 justify-center md:justify-start">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsBulkDeleteDialogOpen(true)}
                className="flex items-center gap-1.5 touch-manipulation"
              >
                <Trash2 size={16} />
                Delete
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBulkTagInput("")
                  setIsBulkAddTagDialogOpen(true)
                }}
                className="flex items-center gap-1.5 touch-manipulation"
              >
                <Plus size={16} />
                Add Tag
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBulkTagInput("")
                  setIsBulkRemoveTagDialogOpen(true)
                }}
                className="flex items-center gap-1.5 touch-manipulation"
              >
                <X size={16} />
                Remove Tag
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedItems([])} 
                className="text-gray-400 hover:text-white touch-manipulation"
              >
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>{selectedImage?.filename}</DialogTitle>
            <DialogDescription>
              {selectedImage?.filepath} •{" "}
              {selectedImage?.filesize ? `${(selectedImage.filesize / 1024).toFixed(2)} KB` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="relative w-full h-[60vh] bg-black/50 rounded-md overflow-hidden">
            {selectedImage?.public_url && (
              <Image
                src={selectedImage.public_url || "/placeholder.svg"}
                alt={selectedImage.filename}
                fill
                className="object-contain"
                unoptimized
              />
            )}
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm">
              <p>
                <strong>URL:</strong> <span className="text-gray-400">{selectedImage?.public_url}</span>
              </p>
              <p>
                <strong>Path:</strong> <span className="text-gray-400">{selectedImage?.filepath}</span>
              </p>
            </div>

            <Button
              onClick={() => selectedImage && handleCopyUrl(selectedImage.public_url)}
              className="flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy URL
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog
        open={isUploadDialogOpen}
        onOpenChange={(open) => {
          if (!isProcessingQueue) setIsUploadDialogOpen(open)
          else
            toast({
              title: "Upload in progress",
              description: "Please wait for uploads to complete before closing",
              variant: "destructive",
            })
        }}
      >
        <DialogContent className="max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle>Bulk Upload</DialogTitle>
            <DialogDescription>{uploadQueue.length} files selected for upload</DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto pr-2">
            {uploadQueue.map((item, index) => (
              <div key={index} className="mb-2 p-3 bg-gray-900 rounded-md">
                <div className="flex justify-between items-start mb-1">
                  <div className="truncate mr-2 text-sm" title={item.file.name}>
                    {item.file.name}
                  </div>
                  <div className="text-xs whitespace-nowrap">{(item.file.size / 1024).toFixed(2)} KB</div>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <Progress value={item.progress} className="h-2 flex-grow" />
                  <span className="text-xs whitespace-nowrap w-20 text-right">
                    {item.status === "pending" && (
                      <span className="flex items-center justify-end gap-1">
                        Pending
                        <Button variant="ghost" size="icon" className="h-4 w-4 p-0" onClick={() => cancelUpload(index)}>
                          <AlertCircle className="h-3 w-3 text-red-400" />
                        </Button>
                      </span>
                    )}
                    {item.status === "uploading" && `${item.progress}%`}
                    {item.status === "success" && "Complete"}
                    {item.status === "duplicate" && "Duplicate"}
                    {item.status === "error" && "Failed"}
                  </span>
                </div>

                {item.status === "error" && (
                  <div className="text-xs text-red-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {item.error || "Upload failed"}
                  </div>
                )}

                {item.status === "duplicate" && (
                  <div className="text-xs text-yellow-400 flex items-center gap-1 mt-1">
                    <Info className="h-3 w-3" />
                    <span>Duplicate file - </span>
                    <button className="text-blue-400 underline" onClick={() => highlightDuplicate(item.duplicateId)}>
                      View existing
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between gap-2 mt-2">
            <div className="space-x-2">
              <Button variant="outline" onClick={clearUploadQueue} disabled={isProcessingQueue}>
                Clear Completed
              </Button>
              <Button variant="outline" onClick={resetUploadQueue} disabled={isProcessingQueue}>
                Reset All
              </Button>
            </div>

            <div className="flex items-center">
              {isProcessingQueue ? (
                <span className="flex items-center gap-2 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </span>
              ) : (
                <span className="text-sm text-gray-400">
                  {uploadQueue.filter((i) => i.status === "pending").length > 0
                    ? "Upload will start automatically"
                    : "All uploads processed"}
                </span>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Media Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Media</DialogTitle>
            <DialogDescription>Update the details of this media item</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="filename">Filename</Label>
              <Input
                id="filename"
                value={newFilename}
                onChange={(e) => setNewFilename(e.target.value)}
                placeholder="Enter filename"
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {editingTags.map((tag) => (
                  <div key={tag} className="bg-gray-800 text-white px-2 py-1 rounded-md flex items-center gap-1">
                    <span>{tag}</span>
                    <button onClick={() => handleRemoveTag(tag)} className="text-gray-400 hover:text-white">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                />
                <Button type="button" size="sm" onClick={handleAddTag}>
                  <Plus size={16} />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Duplicate Videos Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Duplicate Videos Detected</DialogTitle>
            <DialogDescription>The following videos already exist in your media library</DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto pr-1">
            {currentDuplicates.map((item, index) => (
              <div key={index} className="mb-3 p-3 bg-gray-900 rounded-md flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.existingItem?.filename}</p>
                  <p className="text-xs text-gray-400 truncate">{item.url}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => highlightDuplicate(item.existingItem?.id)}>
                  View in Library
                </Button>
              </div>
            ))}
          </div>

          <Button onClick={() => setDuplicateDialogOpen(false)}>Close</Button>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-4 right-4 z-40 flex gap-2"> {/* Ensure refresh button is not overlapped by bulk actions bar */}
        <Button onClick={handleCleanupDuplicates} variant="outline" className="bg-yellow-600 hover:bg-yellow-700">
          <AlertCircle className="h-4 w-4 mr-2" />
          Cleanup Duplicates
        </Button>
        <Button onClick={fetchMedia} className="bg-blue-600 hover:bg-blue-700">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Media
        </Button>
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Bulk Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedItems.length} selected media item
              {selectedItems.length > 1 ? "s" : ""}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsBulkDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Delete {selectedItems.length} Item{selectedItems.length > 1 ? "s" : ""}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Tag Dialog */}
      <Dialog open={isBulkAddTagDialogOpen} onOpenChange={setIsBulkAddTagDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Tag to Selected Items</DialogTitle>
            <DialogDescription>
              Enter the tag you want to add to {selectedItems.length} selected item
              {selectedItems.length > 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <Input
              placeholder="Enter tag name"
              value={bulkTagInput}
              onChange={(e) => setBulkTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && bulkTagInput.trim() && handleBulkAddTag()}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsBulkAddTagDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAddTag} disabled={!bulkTagInput.trim()}>
              Add Tag
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Remove Tag Dialog */}
      <Dialog open={isBulkRemoveTagDialogOpen} onOpenChange={setIsBulkRemoveTagDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Tag from Selected Items</DialogTitle>
            <DialogDescription>
              Enter the tag you want to remove from {selectedItems.length} selected item
              {selectedItems.length > 1 ? "s" : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            <Input
              placeholder="Enter tag name"
              value={bulkTagInput}
              onChange={(e) => setBulkTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && bulkTagInput.trim() && handleBulkRemoveTag()}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsBulkRemoveTagDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkRemoveTag} disabled={!bulkTagInput.trim()}>
              Remove Tag
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )

  function renderMediaGrid() {
    if (loading) {
      return <div className="text-center py-8">Loading media...</div>
    }

    if (error) {
      return (
        <div className="text-center py-8 bg-gray-900 rounded-lg">
          <p className="text-gray-400">Please resolve the error to view media</p>
        </div>
      )
    }

    if (filteredMedia.length === 0) {
      return (
        <div className="text-center py-8 bg-gray-900 rounded-lg">
          <p className="text-gray-400">No media found</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">{/* Added padding-bottom for bulk actions bar */}
        {filteredMedia.map(renderMediaItem)}
      </div>
    )
  }
}
