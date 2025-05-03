"use client"

import type React from "react"

import { useEffect, useState, useRef, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, Trash2, ImageIcon, Film, Link, Check, AlertCircle } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import { formatFileSize, extractVideoInfo } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type MediaItem = {
  id: string
  name: string
  type: string
  url: string
  thumbnail_url?: string
  created_at: string
  size?: number
  video_platform?: "vimeo" | "youtube" | "linkedin"
}

type UploadQueueItem = {
  id: string
  file: File
  progress: number
  status: "pending" | "uploading" | "success" | "error"
  error?: string
}

type VideoProcessResult = {
  success: boolean
  platform: "vimeo" | "youtube" | "linkedin" | null
  videoId: string | null
  error?: string
}

export default function UnifiedMediaLibrary() {
  const [activeTab, setActiveTab] = useState("all")
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [videoUrl, setVideoUrl] = useState("")
  const [videoTitle, setVideoTitle] = useState("")
  const [videoDescription, setVideoDescription] = useState("")
  const [isProcessingVideo, setIsProcessingVideo] = useState(false)
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([])
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const dropAreaRef = useRef<HTMLDivElement>(null)
  const [storageUsage, setStorageUsage] = useState({
    images: 0,
    videos: 0,
    total: 0,
  })

  // Load media items from Supabase
  const loadMediaItems = useCallback(async () => {
    try {
      setIsLoading(true)
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase.from("media").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading media items:", error)
        return
      }

      setMediaItems(data || [])

      // Calculate storage usage
      let imagesSize = 0
      let videosSize = 0

      data?.forEach((item) => {
        if (item.type.startsWith("image/")) {
          imagesSize += item.size || 0
        } else if (item.type === "video/vimeo" || item.type === "video/youtube" || item.type === "video/linkedin") {
          videosSize += item.size || 0
        }
      })

      setStorageUsage({
        images: imagesSize,
        videos: videosSize,
        total: imagesSize + videosSize,
      })
    } catch (error) {
      console.error("Error in loadMediaItems:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMediaItems()
  }, [loadMediaItems])

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      addFilesToQueue(newFiles)
    }
  }

  // Add files to upload queue
  const addFilesToQueue = (files: File[]) => {
    const newQueueItems = files.map((file) => ({
      id: Math.random().toString(36).substring(2, 11),
      file,
      progress: 0,
      status: "pending" as const,
    }))

    setUploadQueue((prevQueue) => [...prevQueue, ...newQueueItems])
    setIsUploadDialogOpen(true)

    // Start upload automatically
    setTimeout(() => {
      processQueue([...uploadQueue, ...newQueueItems])
    }, 100)
  }

  // Process upload queue
  const processQueue = async (queue: UploadQueueItem[]) => {
    if (queue.length === 0 || isUploading) return

    setIsUploading(true)

    // Find the next pending item
    const pendingItems = queue.filter((item) => item.status === "pending")
    if (pendingItems.length === 0) {
      setIsUploading(false)
      return
    }

    // Process all pending items in parallel with a limit
    const MAX_CONCURRENT = 3
    const itemsToProcess = pendingItems.slice(0, MAX_CONCURRENT)

    await Promise.all(
      itemsToProcess.map(async (item) => {
        try {
          // Update status to uploading
          setUploadQueue((prevQueue) =>
            prevQueue.map((qItem) => (qItem.id === item.id ? { ...qItem, status: "uploading", progress: 0 } : qItem)),
          )

          // Create form data
          const formData = new FormData()
          formData.append("file", item.file)

          // Upload file with progress tracking
          const xhr = new XMLHttpRequest()

          // Create a promise that resolves when the upload is complete
          const uploadPromise = new Promise<void>((resolve, reject) => {
            xhr.upload.addEventListener("progress", (event) => {
              if (event.lengthComputable) {
                const progress = Math.round((event.loaded / event.total) * 100)
                setUploadQueue((prevQueue) =>
                  prevQueue.map((qItem) => (qItem.id === item.id ? { ...qItem, progress } : qItem)),
                )
              }
            })

            xhr.addEventListener("load", () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                const response = JSON.parse(xhr.responseText)
                setUploadQueue((prevQueue) =>
                  prevQueue.map((qItem) =>
                    qItem.id === item.id ? { ...qItem, status: "success", progress: 100 } : qItem,
                  ),
                )
                resolve()
              } else {
                setUploadQueue((prevQueue) =>
                  prevQueue.map((qItem) =>
                    qItem.id === item.id
                      ? { ...qItem, status: "error", error: `Upload failed: ${xhr.statusText}` }
                      : qItem,
                  ),
                )
                reject(new Error(`Upload failed: ${xhr.statusText}`))
              }
            })

            xhr.addEventListener("error", () => {
              setUploadQueue((prevQueue) =>
                prevQueue.map((qItem) =>
                  qItem.id === item.id ? { ...qItem, status: "error", error: "Network error during upload" } : qItem,
                ),
              )
              reject(new Error("Network error during upload"))
            })

            xhr.addEventListener("abort", () => {
              setUploadQueue((prevQueue) =>
                prevQueue.map((qItem) =>
                  qItem.id === item.id ? { ...qItem, status: "error", error: "Upload aborted" } : qItem,
                ),
              )
              reject(new Error("Upload aborted"))
            })
          })

          // Start the upload
          xhr.open("POST", "/api/bulk-upload")
          xhr.send(formData)

          // Wait for the upload to complete
          await uploadPromise
        } catch (error) {
          console.error(`Error uploading ${item.file.name}:`, error)
          setUploadQueue((prevQueue) =>
            prevQueue.map((qItem) =>
              qItem.id === item.id
                ? { ...qItem, status: "error", error: error instanceof Error ? error.message : "Unknown error" }
                : qItem,
            ),
          )
        }
      }),
    )

    // Check if there are more items to process
    const updatedQueue = [...queue]
    const remainingPendingItems = updatedQueue.filter((item) => item.status === "pending")

    if (remainingPendingItems.length > 0) {
      // Process next batch
      processQueue(updatedQueue)
    } else {
      setIsUploading(false)

      // Count successful uploads and WebP conversions
      const successCount = updatedQueue.filter((item) => item.status === "success").length
      const imageCount = updatedQueue.filter(
        (item) => item.status === "success" && item.file.type.startsWith("image/"),
      ).length

      if (successCount > 0) {
        toast({
          title: "Upload Complete",
          description: `Successfully uploaded ${successCount} file${successCount !== 1 ? "s" : ""}${imageCount > 0 ? ` (${imageCount} image${imageCount !== 1 ? "s" : ""} converted to WebP)` : ""}`,
        })

        // Reload media items
        loadMediaItems()
      }
    }
  }

  // Handle drag and drop
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Only set isDragging to false if we're leaving the drop area
    if (dropAreaRef.current && !dropAreaRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files)
      addFilesToQueue(files)
    }
  }

  // Process video URL
  const processVideoUrl = async () => {
    if (!videoUrl.trim()) return

    setIsProcessingVideo(true)

    try {
      // Split the input by common delimiters to handle multiple URLs
      const urls = videoUrl.split(/[\n\s,;]+/).filter((url) => url.trim().length > 0)

      if (urls.length === 0) {
        toast({
          title: "No valid URLs found",
          description: "Please enter at least one valid video URL",
          variant: "destructive",
        })
        setIsProcessingVideo(false)
        return
      }

      const results: VideoProcessResult[] = []

      // Process each URL
      for (const url of urls) {
        const { platform, videoId } = extractVideoInfo(url.trim())

        if (!platform || !videoId) {
          results.push({
            success: false,
            platform: null,
            videoId: null,
            error: `Could not extract video information from: ${url}`,
          })
          continue
        }

        // Get video information based on platform
        let thumbnailUrl = ""
        let videoType = ""

        if (platform === "vimeo") {
          // Get Vimeo video information
          const response = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`)

          if (!response.ok) {
            results.push({
              success: false,
              platform,
              videoId,
              error: `Failed to fetch Vimeo video information: ${response.statusText}`,
            })
            continue
          }

          const data = await response.json()
          thumbnailUrl = data.thumbnail_url
          videoType = "video/vimeo"
        } else if (platform === "youtube") {
          // Use YouTube thumbnail URL format
          thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
          videoType = "video/youtube"
        } else if (platform === "linkedin") {
          // LinkedIn doesn't provide easy thumbnail access, use a generic video thumbnail
          thumbnailUrl = "/generic-icon.png"
          videoType = "video/linkedin"
        }

        // Save to database
        const supabase = getSupabaseBrowserClient()

        const { data, error } = await supabase
          .from("media")
          .insert([
            {
              name: videoTitle || `${platform.charAt(0).toUpperCase() + platform.slice(1)} Video ${videoId}`,
              type: videoType,
              url: url.trim(),
              thumbnail_url: thumbnailUrl,
              description: videoDescription || "",
              size: 0, // Video links don't consume storage
              video_platform: platform,
            },
          ])
          .select()

        if (error) {
          results.push({
            success: false,
            platform,
            videoId,
            error: `Database error: ${error.message}`,
          })
        } else {
          results.push({
            success: true,
            platform,
            videoId,
          })
        }
      }

      // Summarize results
      const successful = results.filter((r) => r.success)
      const failed = results.filter((r) => !r.success)

      // Group successful results by platform
      const vimeoCount = successful.filter((r) => r.platform === "vimeo").length
      const youtubeCount = successful.filter((r) => r.platform === "youtube").length
      const linkedinCount = successful.filter((r) => r.platform === "linkedin").length

      let successMessage = ""
      if (vimeoCount > 0) successMessage += `${vimeoCount} Vimeo video${vimeoCount !== 1 ? "s" : ""}`
      if (youtubeCount > 0) {
        if (successMessage) successMessage += ", "
        successMessage += `${youtubeCount} YouTube video${youtubeCount !== 1 ? "s" : ""}`
      }
      if (linkedinCount > 0) {
        if (successMessage) successMessage += ", "
        successMessage += `${linkedinCount} LinkedIn video${linkedinCount !== 1 ? "s" : ""}`
      }

      if (successful.length > 0) {
        toast({
          title: "Videos Added Successfully",
          description: `Added ${successMessage} to your media library`,
        })

        // Clear form
        setVideoUrl("")
        setVideoTitle("")
        setVideoDescription("")

        // Reload media items
        loadMediaItems()
      }

      if (failed.length > 0) {
        toast({
          title: `${failed.length} video${failed.length !== 1 ? "s" : ""} failed to add`,
          description: failed.map((f) => f.error).join("\n"),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error processing video URL:", error)
      toast({
        title: "Error Adding Video",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsProcessingVideo(false)
    }
  }

  // Delete media item
  const deleteMediaItem = async (id: string) => {
    try {
      const supabase = getSupabaseBrowserClient()
      const { error } = await supabase.from("media").delete().eq("id", id)

      if (error) {
        console.error("Error deleting media item:", error)
        toast({
          title: "Error",
          description: `Failed to delete media item: ${error.message}`,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Media item deleted successfully",
      })

      // Reload media items
      loadMediaItems()
    } catch (error) {
      console.error("Error in deleteMediaItem:", error)
    } finally {
      setDeleteItemId(null)
    }
  }

  // Filter media items based on active tab
  const filteredMediaItems = mediaItems.filter((item) => {
    if (activeTab === "all") return true
    if (activeTab === "images") return item.type.startsWith("image/")
    if (activeTab === "videos")
      return item.type === "video/vimeo" || item.type === "video/youtube" || item.type === "video/linkedin"
    if (activeTab === "vimeo") return item.type === "video/vimeo"
    if (activeTab === "youtube") return item.type === "video/youtube"
    if (activeTab === "linkedin") return item.type === "video/linkedin"
    return true
  })

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Media Library</h1>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="vimeo">Vimeo</TabsTrigger>
            <TabsTrigger value="youtube">YouTube</TabsTrigger>
            <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
          </TabsList>

          <div className="text-sm text-muted-foreground">
            {activeTab === "all" && `Total storage: ${formatFileSize(storageUsage.total)}`}
            {activeTab === "images" && `Images storage: ${formatFileSize(storageUsage.images)}`}
            {(activeTab === "videos" || activeTab === "vimeo" || activeTab === "youtube" || activeTab === "linkedin") &&
              `Videos storage: ${formatFileSize(storageUsage.videos)}`}
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-full flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredMediaItems.length > 0 ? (
              filteredMediaItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="aspect-video relative bg-muted">
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url || "/placeholder.svg"}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {item.type.startsWith("image/") ? (
                          <ImageIcon className="h-12 w-12 text-muted-foreground" />
                        ) : (
                          <Film className="h-12 w-12 text-muted-foreground" />
                        )}
                      </div>
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => setDeleteItemId(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {item.video_platform && (
                      <Badge
                        className={`absolute top-2 left-2 ${
                          item.video_platform === "vimeo"
                            ? "bg-blue-500"
                            : item.video_platform === "youtube"
                              ? "bg-red-500"
                              : "bg-blue-800"
                        }`}
                      >
                        {item.video_platform.charAt(0).toUpperCase() + item.video_platform.slice(1)}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium truncate" title={item.name}>
                      {item.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(item.created_at).toLocaleDateString()}
                      {item.size !== undefined && ` • ${formatFileSize(item.size)}`}
                    </p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        navigator.clipboard.writeText(item.url)
                        toast({
                          title: "URL Copied",
                          description: "Media URL copied to clipboard",
                        })
                      }}
                    >
                      Copy URL
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No media items found. Upload some files or add video links to get started.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="images" className="space-y-4">
          <div
            ref={dropAreaRef}
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/20"
            }`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="rounded-full bg-primary/10 p-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Drag and drop files here</h3>
                <p className="text-sm text-muted-foreground mt-1">Or click the buttons below to select files</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button onClick={() => fileInputRef.current?.click()}>Select Files</Button>
                <Button variant="outline" onClick={() => folderInputRef.current?.click()}>
                  Select Folder
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <input
                  ref={folderInputRef}
                  type="file"
                  webkitdirectory="true"
                  directory=""
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-full flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredMediaItems.length > 0 ? (
              filteredMediaItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="aspect-video relative bg-muted">
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url || "/placeholder.svg"}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => setDeleteItemId(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium truncate" title={item.name}>
                      {item.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(item.created_at).toLocaleDateString()}
                      {item.size !== undefined && ` • ${formatFileSize(item.size)}`}
                    </p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        navigator.clipboard.writeText(item.url)
                        toast({
                          title: "URL Copied",
                          description: "Media URL copied to clipboard",
                        })
                      }}
                    >
                      Copy URL
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No images found. Upload some image files to get started.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="videos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add Videos</CardTitle>
              <CardDescription>Add videos from YouTube, Vimeo, or LinkedIn by pasting the URL below</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="video-url">Video URL(s)</Label>
                <Textarea
                  id="video-url"
                  placeholder="Paste one or more video URLs (separated by spaces, commas, or new lines)"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="video-title">Title (Optional)</Label>
                <Input
                  id="video-title"
                  placeholder="Video title"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="video-description">Description (Optional)</Label>
                <Textarea
                  id="video-description"
                  placeholder="Video description"
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={processVideoUrl} disabled={isProcessingVideo || !videoUrl.trim()}>
                {isProcessingVideo ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Link className="mr-2 h-4 w-4" />
                    Add Video
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-full flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredMediaItems.length > 0 ? (
              filteredMediaItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="aspect-video relative bg-muted">
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url || "/placeholder.svg"}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8"
                      onClick={() => setDeleteItemId(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {item.video_platform && (
                      <Badge
                        className={`absolute top-2 left-2 ${
                          item.video_platform === "vimeo"
                            ? "bg-blue-500"
                            : item.video_platform === "youtube"
                              ? "bg-red-500"
                              : "bg-blue-800"
                        }`}
                      >
                        {item.video_platform.charAt(0).toUpperCase() + item.video_platform.slice(1)}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium truncate" title={item.name}>
                      {item.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        navigator.clipboard.writeText(item.url)
                        toast({
                          title: "URL Copied",
                          description: "Video URL copied to clipboard",
                        })
                      }}
                    >
                      Copy URL
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No videos found. Add video links to get started.
              </div>
            )}
          </div>
        </TabsContent>

        {/* Platform-specific tabs */}
        {["vimeo", "youtube", "linkedin"].map((platform) => (
          <TabsContent key={platform} value={platform} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                <div className="col-span-full flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredMediaItems.length > 0 ? (
                filteredMediaItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden">
                    <div className="aspect-video relative bg-muted">
                      {item.thumbnail_url ? (
                        <img
                          src={item.thumbnail_url || "/placeholder.svg"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8"
                        onClick={() => setDeleteItemId(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Badge
                        className={`absolute top-2 left-2 ${
                          platform === "vimeo" ? "bg-blue-500" : platform === "youtube" ? "bg-red-500" : "bg-blue-800"
                        }`}
                      >
                        {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium truncate" title={item.name}>
                        {item.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(item.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          navigator.clipboard.writeText(item.url)
                          toast({
                            title: "URL Copied",
                            description: "Video URL copied to clipboard",
                          })
                        }}
                      >
                        Copy URL
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No {platform} videos found. Add {platform} video links to get started.
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Uploading Files</DialogTitle>
            <DialogDescription>
              {isUploading
                ? "Files are being uploaded. Please wait..."
                : uploadQueue.every((item) => item.status === "success")
                  ? "All files uploaded successfully!"
                  : "Upload queue"}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto">
            {uploadQueue.map((item) => (
              <div key={item.id} className="py-2 border-b last:border-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium truncate max-w-[200px]" title={item.file.name}>
                    {item.file.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatFileSize(item.file.size)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={item.progress} className="flex-1" />
                  <span className="text-xs w-12 text-right">
                    {item.status === "pending" && "Pending"}
                    {item.status === "uploading" && `${item.progress}%`}
                    {item.status === "success" && <Check className="h-4 w-4 text-green-500" />}
                    {item.status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
                  </span>
                </div>
                {item.status === "error" && <p className="text-xs text-red-500 mt-1">{item.error}</p>}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (!isUploading) {
                  setIsUploadDialogOpen(false)
                  // Clear successful uploads from queue
                  setUploadQueue((prevQueue) => prevQueue.filter((item) => item.status !== "success"))
                }
              }}
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteItemId} onOpenChange={(open) => !open && setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the media item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteItemId && deleteMediaItem(deleteItemId)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
