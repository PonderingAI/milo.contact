"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import Image from "next/image"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Copy,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  Link,
  ImageIcon,
  RefreshCw,
  UploadCloud,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { extractVideoInfo } from "@/lib/project-data"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"

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
  status: "pending" | "uploading" | "success" | "error"
  progress: number
  error?: string
  response?: any
}

export default function UnifiedMediaLibrary() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [setupInProgress, setSetupInProgress] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadingVimeo, setUploadingVimeo] = useState(false)
  const [vimeoUrls, setVimeoUrls] = useState("")
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null)
  const [isAdmin, setIsAdmin] = useState(true) // Default to true to avoid flickering
  const [uploadQueue, setUploadQueue] = useState<UploadStatus[]>([])
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isProcessingQueue, setIsProcessingQueue] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropAreaRef = useRef<HTMLDivElement>(null)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    fetchMedia()
  }, [])

  const setupDatabase = async () => {
    setSetupInProgress(true)
    setError(null)

    try {
      // First try the comprehensive setup
      const setupResponse = await fetch("/api/setup-all")

      if (!setupResponse.ok) {
        // If that fails, try the specific media table setup
        const mediaSetupResponse = await fetch("/api/setup-media-table")

        if (!mediaSetupResponse.ok) {
          throw new Error("Failed to set up media table")
        }
      }

      toast({
        title: "Setup complete",
        description: "Database tables have been created successfully",
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
      const { data, error } = await supabase.from("media").select("*").order("created_at", { ascending: false })

      if (error) {
        if (error.code === "42P01") {
          setError("Media table does not exist. Please set up the database.")
          return
        }
        throw error
      }

      setMediaItems(data || [])

      // Extract all unique tags
      const tags = new Set<string>()
      data?.forEach((item) => {
        if (item.tags) {
          item.tags.forEach((tag: string) => tags.add(tag))
        }
      })

      setAllTags(Array.from(tags))
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

    if (files.length === 1) {
      // Single file upload
      const file = files[0]
      setUploadingFile(true)

      try {
        // Create a FormData object
        const formData = new FormData()
        formData.append("file", file)

        // Upload the file directly
        const response = await fetch("/api/bulk-upload", {
          method: "POST",
          body: formData,
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || "Failed to upload file")
        }

        if (result.success) {
          toast({
            title: "Success",
            description: `File uploaded successfully${result.convertedToWebP ? " (converted to WebP)" : ""}`,
          })

          // Refresh the media list
          fetchMedia()
        } else {
          throw new Error(result.error || "Unknown error during upload")
        }
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
      // Multiple files upload
      const newUploads: UploadStatus[] = Array.from(files).map((file) => ({
        file,
        status: "pending",
        progress: 0,
      }))

      setUploadQueue((prev) => [...prev, ...newUploads])
      setIsUploadDialogOpen(true)

      // Automatically start processing the queue
      setTimeout(() => {
        processBulkUpload()
      }, 100)
    }
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

    setIsProcessingQueue(true)

    // Process files in parallel with a limit (3 at a time)
    const batchSize = 3
    const pendingUploads = uploadQueue.filter((item) => item.status === "pending")

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
            updated[queueIndex] = { ...updated[queueIndex], status: "uploading", progress: 10 }
            return updated
          })

          try {
            // Create a FormData object
            const formData = new FormData()
            formData.append("file", item.file)

            // Update progress to 30%
            setUploadQueue((prev) => {
              const updated = [...prev]
              updated[queueIndex] = { ...updated[queueIndex], progress: 30 }
              return updated
            })

            const response = await fetch("/api/bulk-upload", {
              method: "POST",
              body: formData,
            })

            // Update progress to 80%
            setUploadQueue((prev) => {
              const updated = [...prev]
              updated[queueIndex] = { ...updated[queueIndex], progress: 80 }
              return updated
            })

            const result = await response.json()

            if (!response.ok) {
              throw new Error(result.error || "Upload failed")
            }

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

    toast({
      title: "Bulk upload progress",
      description: `${successful} files uploaded successfully${converted > 0 ? ` (${converted} converted to WebP)` : ""}, ${failed} files failed, ${pending} files pending`,
      variant: successful > 0 ? "default" : "destructive",
    })
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

  const handleVimeoAdd = async () => {
    // Validate input
    if (!vimeoUrls.trim()) {
      toast({
        title: "Error",
        description: "Please enter at least one Vimeo URL",
        variant: "destructive",
      })
      return
    }

    setUploadingVimeo(true)
    let successCount = 0
    let failCount = 0

    try {
      // Extract potential Vimeo URLs
      const urlRegex =
        /(?:https?:)?\/\/(?:www\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:[a-zA-Z0-9_-]+)?/gi
      const matches = vimeoUrls.match(urlRegex) || []

      if (matches.length === 0) {
        toast({
          title: "No valid Vimeo URLs found",
          description: "Please check your input and try again",
          variant: "destructive",
        })
        return
      }

      // Process each Vimeo URL
      for (const url of matches) {
        try {
          const videoInfo = extractVideoInfo(url)

          if (!videoInfo || videoInfo.platform !== "vimeo") {
            throw new Error("Invalid Vimeo URL")
          }

          // Get video thumbnail and metadata
          const response = await fetch(`https://vimeo.com/api/v2/video/${videoInfo.id}.json`)

          if (!response.ok) {
            throw new Error("Failed to fetch Vimeo video info")
          }

          const videoData = await response.json()
          const video = videoData[0]

          // Get current user session
          const {
            data: { session },
          } = await supabase.auth.getSession()
          const userId = session?.user?.id || "anonymous"

          // Save to media table
          const { error: dbError } = await supabase.from("media").insert({
            filename: video.title || `Vimeo ${videoInfo.id}`,
            filepath: url,
            filesize: 0, // Not applicable for external videos
            filetype: "vimeo",
            public_url: url,
            thumbnail_url: video.thumbnail_large,
            tags: ["video", "vimeo"],
            metadata: {
              vimeoId: videoInfo.id,
              description: video.description,
              duration: video.duration,
              uploadDate: video.upload_date,
              uploadedBy: userId,
            },
          })

          if (dbError) throw dbError
          successCount++
        } catch (err) {
          console.error("Error processing Vimeo URL:", url, err)
          failCount++
        }
      }

      // Show summary toast
      toast({
        title: successCount > 0 ? "Success" : "Error",
        description: `${successCount} videos added successfully${failCount > 0 ? `, ${failCount} failed` : ""}`,
        variant: successCount > 0 ? "default" : "destructive",
      })

      // Reset form if any successful and refresh
      if (successCount > 0) {
        setVimeoUrls("")
        fetchMedia()
      }
    } catch (error) {
      console.error("Error adding Vimeo videos:", error)
      toast({
        title: "Error",
        description: "Failed to add Vimeo videos",
        variant: "destructive",
      })
    } finally {
      setUploadingVimeo(false)
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

  const handleDeleteMedia = async (id: string, filepath: string) => {
    if (!confirm("Are you sure you want to delete this media item?")) return

    try {
      // Delete from storage if it's not an external URL
      if (!filepath.startsWith("http")) {
        const { error: storageError } = await supabase.storage.from("media").remove([filepath])

        if (storageError) throw storageError
      }

      // Delete from database
      const { error: dbError } = await supabase.from("media").delete().eq("id", id)

      if (dbError) throw dbError

      toast({
        title: "Success",
        description: "Media deleted successfully",
      })

      // Update state
      setMediaItems(mediaItems.filter((item) => item.id !== id))
    } catch (error) {
      console.error("Error deleting media:", error)
      toast({
        title: "Error",
        description: "Failed to delete media",
        variant: "destructive",
      })
    }
  }

  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
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
      activeTab === "all" || item.filetype === activeTab || (activeTab === "video" && item.filetype === "vimeo")

    return matchesSearch && matchesTags && matchesType
  })

  const renderMediaItem = (item: MediaItem) => {
    const isVimeo = item.filetype === "vimeo"
    const isImage = item.filetype === "image"

    return (
      <div key={item.id} className="bg-gray-900 rounded-lg overflow-hidden">
        <div className="relative h-40 cursor-pointer" onClick={() => (isImage ? setSelectedImage(item) : null)}>
          {item.thumbnail_url ? (
            <Image src={item.thumbnail_url || "/placeholder.svg"} alt={item.filename} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <span className="text-gray-400">{item.filetype}</span>
            </div>
          )}
          {isVimeo && (
            <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">Vimeo</div>
          )}
          {isImage && (
            <div className="absolute bottom-2 right-2 bg-gray-800/70 text-white text-xs px-2 py-1 rounded flex items-center">
              <ImageIcon size={12} className="mr-1" /> Click to preview
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="text-sm truncate" title={item.filename}>
            {item.filename}
          </p>
          <p className="text-xs text-gray-500">
            {isVimeo ? "External Video" : `${(item.filesize / 1024).toFixed(2)} KB`}
          </p>

          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center mt-3">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-xs"
              onClick={() => handleCopyUrl(item.public_url)}
            >
              {copiedUrl === item.public_url ? (
                <>
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Copied
                </>
              ) : (
                <>
                  <Link className="h-3 w-3" />
                  Copy URL
                </>
              )}
            </Button>

            <Button variant="ghost" size="icon" onClick={() => handleDeleteMedia(item.id, item.filepath)}>
              <Trash2 className="h-4 w-4 text-red-500" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-serif mb-8">Media Library</h1>

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-900 p-4 rounded-lg">
          <h2 className="text-xl mb-4">Upload Files</h2>
          <div className="space-y-4">
            <div
              ref={dropAreaRef}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? "border-blue-500 bg-blue-500/10" : "border-gray-700 hover:border-gray-500"
              }`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center justify-center gap-2">
                <UploadCloud className="h-10 w-10 text-gray-400" />
                <p className="text-lg font-medium">{isDragging ? "Drop files here" : "Drag & drop files here"}</p>
                <p className="text-sm text-gray-400">
                  or <span className="text-blue-500 cursor-pointer">browse</span> to upload
                </p>
                <p className="text-xs text-gray-500 mt-2">Supports single or multiple files</p>
                {uploadingFile && (
                  <div className="flex items-center gap-2 mt-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Uploading...</span>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} className="hidden" />
            </div>
            <div className="text-sm text-gray-400">
              <p>Upload files directly to the media library.</p>
              <p className="mt-1">Select multiple files or drag and drop a folder to upload in bulk.</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 p-4 rounded-lg">
          <h2 className="text-xl mb-4">Add Vimeo Videos</h2>
          <div className="space-y-4">
            <Textarea
              placeholder="Paste one or more Vimeo URLs (one per line or separated by spaces)"
              value={vimeoUrls}
              onChange={(e) => setVimeoUrls(e.target.value)}
              disabled={uploadingVimeo || !!error}
              className="bg-gray-800 border-gray-700 min-h-[100px]"
            />
            <Button onClick={handleVimeoAdd} disabled={!vimeoUrls || uploadingVimeo || !!error} className="w-full">
              {uploadingVimeo ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                "Add Vimeo Videos"
              )}
            </Button>
            <div className="text-sm text-gray-400">
              <p>
                You can paste multiple Vimeo URLs. The system will automatically detect and process all valid Vimeo
                links.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search media files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-800 border-gray-700 pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-400" />
          <span className="text-sm text-gray-400">Filter by tags:</span>
          <div className="flex flex-wrap gap-1">
            {allTags.slice(0, 5).map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`text-xs px-2 py-1 rounded ${
                  selectedTags.includes(tag) ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-300"
                }`}
              >
                {tag}
              </button>
            ))}
            {allTags.length > 5 && <span className="text-xs text-gray-400">+{allTags.length - 5} more</span>}
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="bg-gray-800">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="image">Images</TabsTrigger>
          <TabsTrigger value="video">Videos</TabsTrigger>
          <TabsTrigger value="vimeo">Vimeo</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <h2 className="text-xl mb-4">All Media ({filteredMedia.length})</h2>
          {renderMediaGrid()}
        </TabsContent>

        <TabsContent value="image" className="mt-6">
          <h2 className="text-xl mb-4">Images ({filteredMedia.length})</h2>
          {renderMediaGrid()}
        </TabsContent>

        <TabsContent value="video" className="mt-6">
          <h2 className="text-xl mb-4">Videos ({filteredMedia.length})</h2>
          {renderMediaGrid()}
        </TabsContent>

        <TabsContent value="vimeo" className="mt-6">
          <h2 className="text-xl mb-4">Vimeo Videos ({filteredMedia.length})</h2>
          {renderMediaGrid()}
        </TabsContent>

        <TabsContent value="other" className="mt-6">
          <h2 className="text-xl mb-4">Other Files ({filteredMedia.length})</h2>
          {renderMediaGrid()}
        </TabsContent>
      </Tabs>

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
                  <span className="text-xs whitespace-nowrap">
                    {item.status === "pending" && "Pending"}
                    {item.status === "uploading" && "Uploading..."}
                    {item.status === "success" && "Complete"}
                    {item.status === "error" && "Failed"}
                  </span>
                </div>

                {item.status === "error" && (
                  <div className="text-xs text-red-400 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {item.error || "Upload failed"}
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
                  Uploading automatically...
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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">{filteredMedia.map(renderMediaItem)}</div>
    )
  }
}
