"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Trash2, Search, Filter, CheckCircle, Link, ImageIcon, RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { extractVideoInfo } from "@/lib/project-data"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth, useUser } from "@clerk/nextjs"

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
  const [vimeoUrl, setVimeoUrl] = useState("")
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = getSupabaseBrowserClient()
  const { isSignedIn } = useAuth()
  const { user } = useUser()

  useEffect(() => {
    // Check if user is a superAdmin
    if (user) {
      const userMetadata = user.publicMetadata || {}
      setIsAdmin(userMetadata.superAdmin === true)
    } else {
      setIsAdmin(false)
    }

    // Fetch media regardless of authentication status
    fetchMedia()
  }, [user])

  const setupDatabase = async () => {
    if (!isAdmin) {
      toast({
        title: "Permission denied",
        description: "Only super admins can set up the database",
        variant: "destructive",
      })
      return
    }

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) {
      toast({
        title: "Permission denied",
        description: "Only super admins can upload files",
        variant: "destructive",
      })
      return
    }

    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFile(true)
    try {
      // Check if file is an image that can be converted to WebP
      const isConvertibleImage =
        file.type.startsWith("image/") &&
        !file.type.includes("svg") &&
        !file.type.includes("webp") &&
        !file.type.includes("gif")

      // If it's a convertible image, send it to the conversion API
      if (isConvertibleImage) {
        const formData = new FormData()
        formData.append("image", file)

        const response = await fetch("/api/convert-to-webp", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error("Failed to convert image to WebP")
        }

        const result = await response.json()

        // Update the media library with the converted image
        await handleMediaUpload(result.filename, result.filepath, result.filesize, result.publicUrl)

        toast({
          title: "Success",
          description: "Image converted to WebP and uploaded successfully",
        })
      } else {
        // For non-convertible files, proceed with regular upload
        const fileExt = file.name.split(".").pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`

        // Use 'uploads' folder for all media, without user segmentation
        const filePath = `uploads/${fileName}`

        const { error: uploadError, data } = await supabase.storage.from("media").upload(filePath, file)

        if (uploadError) throw uploadError

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("media").getPublicUrl(filePath)

        // Add to media library
        await handleMediaUpload(file.name, filePath, file.size, publicUrl)

        toast({
          title: "Success",
          description: "File uploaded successfully",
        })
      }

      // Refresh the media list
      fetchMedia()
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      setUploadingFile(false)
      // Reset the input
      e.target.value = ""
    }
  }

  const handleMediaUpload = async (filename: string, filepath: string, filesize: number, publicUrl: string) => {
    // Determine file type category
    let fileType = "other"
    if (filepath.match(/\.(jpg|jpeg|png|webp|avif|gif)$/i)) fileType = "image"
    else if (filepath.match(/\.(mp4|webm|mov|avi)$/i)) fileType = "video"
    else if (filepath.match(/\.(mp3|wav|ogg)$/i)) fileType = "audio"

    // Generate thumbnail for images
    let thumbnailUrl = null
    if (fileType === "image") {
      thumbnailUrl = publicUrl
    }

    // Save to media table
    const { error: dbError } = await supabase.from("media").insert({
      filename: filename,
      filepath: filepath,
      filesize: filesize,
      filetype: fileType,
      public_url: publicUrl,
      thumbnail_url: thumbnailUrl,
      tags: [fileType],
      metadata: {
        contentType: fileType,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user?.id || "anonymous",
      },
    })

    if (dbError) throw dbError
  }

  const handleVimeoAdd = async () => {
    if (!isAdmin) {
      toast({
        title: "Permission denied",
        description: "Only super admins can add videos",
        variant: "destructive",
      })
      return
    }

    if (!vimeoUrl.includes("vimeo.com")) {
      toast({
        title: "Error",
        description: "Please enter a valid Vimeo URL",
        variant: "destructive",
      })
      return
    }

    setUploadingVimeo(true)
    try {
      const videoInfo = extractVideoInfo(vimeoUrl)

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

      // Save to media table
      const { error: dbError } = await supabase.from("media").insert({
        filename: video.title || `Vimeo ${videoInfo.id}`,
        filepath: vimeoUrl,
        filesize: 0, // Not applicable for external videos
        filetype: "vimeo",
        public_url: vimeoUrl,
        thumbnail_url: video.thumbnail_large,
        tags: ["video", "vimeo"],
        metadata: {
          vimeoId: videoInfo.id,
          description: video.description,
          duration: video.duration,
          uploadDate: video.upload_date,
          uploadedBy: user?.id || "anonymous",
        },
      })

      if (dbError) throw dbError

      toast({
        title: "Success",
        description: "Vimeo video added successfully",
      })

      // Reset form and refresh
      setVimeoUrl("")
      fetchMedia()
    } catch (error) {
      console.error("Error adding Vimeo video:", error)
      toast({
        title: "Error",
        description: "Failed to add Vimeo video",
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
    if (!isAdmin) {
      toast({
        title: "Permission denied",
        description: "Only super admins can delete media",
        variant: "destructive",
      })
      return
    }

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

            {isAdmin && (
              <Button variant="ghost" size="icon" onClick={() => handleDeleteMedia(item.id, item.filepath)}>
                <Trash2 className="h-4 w-4 text-red-500" />
                <span className="sr-only">Delete</span>
              </Button>
            )}
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
            {error.includes("database") && isAdmin && (
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

      {!isAdmin && (
        <Alert className="mb-6">
          <AlertTitle>View-Only Mode</AlertTitle>
          <AlertDescription>
            You are viewing the media library in read-only mode. Only super admins can upload, modify, or delete media.
          </AlertDescription>
        </Alert>
      )}

      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900 p-4 rounded-lg">
            <h2 className="text-xl mb-4">Upload File</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploadingFile || !!error}
                  className="bg-gray-800 border-gray-700"
                />
                {uploadingFile && <span className="text-sm text-gray-400">Uploading...</span>}
              </div>
              <div className="text-sm text-gray-400">
                <p>Images will be automatically converted to WebP format for optimal quality and performance.</p>
                <p>High quality compression is used to ensure images look great on large displays.</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 p-4 rounded-lg">
            <h2 className="text-xl mb-4">Add Vimeo Video</h2>
            <div className="flex items-center gap-4">
              <Input
                type="text"
                placeholder="Paste Vimeo URL"
                value={vimeoUrl}
                onChange={(e) => setVimeoUrl(e.target.value)}
                disabled={uploadingVimeo || !!error}
                className="bg-gray-800 border-gray-700"
              />
              <Button onClick={handleVimeoAdd} disabled={!vimeoUrl || uploadingVimeo || !!error}>
                {uploadingVimeo ? "Adding..." : "Add"}
              </Button>
            </div>
          </div>
        </div>
      )}

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
