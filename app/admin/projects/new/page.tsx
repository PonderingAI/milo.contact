"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2, ArrowLeft, Save, Upload, LinkIcon, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ImageUploader from "@/components/admin/image-uploader"
import MediaSelector from "@/components/admin/media-selector"
import { extractVideoInfo } from "@/lib/project-data"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function NewProjectPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState("")
  const [btsVideoUrl, setBtsVideoUrl] = useState("")
  const [processingVideo, setProcessingVideo] = useState(false)
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    type: "directed",
    role: "",
    image: "",
    video_url: "",
    description: "",
    special_notes: "",
  })

  // BTS images state
  const [btsImages, setBtsImages] = useState<string[]>([])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = (url: string) => {
    setFormData((prev) => ({ ...prev, image: url }))

    // If title is empty, try to extract a title from the image filename
    if (!formData.title) {
      const filename = url.split("/").pop()
      if (filename) {
        // Remove extension and replace dashes/underscores with spaces
        const nameWithoutExt = filename.split(".")[0]
        const title = nameWithoutExt.replace(/[-_]/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) // Capitalize first letter of each word

        setFormData((prev) => ({ ...prev, title }))
      }
    }
  }

  const handleBtsImageUpload = (url: string) => {
    setBtsImages((prev) => [...prev, url])
  }

  const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoUrl(e.target.value)
  }

  const handleBtsVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBtsVideoUrl(e.target.value)
  }

  const addVideoUrl = async () => {
    if (!videoUrl.trim()) return

    setProcessingVideo(true)
    try {
      const videoInfo = extractVideoInfo(videoUrl)
      if (!videoInfo) {
        toast({
          title: "Invalid video URL",
          description: "Please enter a valid YouTube, Vimeo, or LinkedIn video URL",
          variant: "destructive",
        })
        return
      }

      // Add to media library
      let thumbnailUrl = null
      let videoTitle = null

      if (videoInfo.platform === "vimeo") {
        // Get video thumbnail and metadata from Vimeo
        const response = await fetch(`https://vimeo.com/api/v2/video/${videoInfo.id}.json`)
        if (response.ok) {
          const videoData = await response.json()
          const video = videoData[0]
          thumbnailUrl = video.thumbnail_large
          videoTitle = video.title || `Vimeo ${videoInfo.id}`

          // If project title is empty, use video title
          if (!formData.title && videoTitle) {
            setFormData((prev) => ({ ...prev, title: videoTitle }))
          }
        }
      } else if (videoInfo.platform === "youtube") {
        thumbnailUrl = `https://img.youtube.com/vi/${videoInfo.id}/hqdefault.jpg`
        // If project title is empty, use a generic title
        if (!formData.title) {
          setFormData((prev) => ({ ...prev, title: `YouTube Video Project` }))
        }
      }

      // Set video URL in form data
      setFormData((prev) => ({ ...prev, video_url: videoUrl }))

      // If we have a thumbnail and no image is set, use the thumbnail
      if (thumbnailUrl && !formData.image) {
        setFormData((prev) => ({ ...prev, image: thumbnailUrl }))
        setVideoThumbnail(thumbnailUrl)
      }

      // Add to media library
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const userId = session?.user?.id || "anonymous"

      await supabase.from("media").insert({
        filename: videoTitle || `${videoInfo.platform} Video ${videoInfo.id}`,
        filepath: videoUrl,
        filesize: 0,
        filetype: videoInfo.platform,
        public_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        tags: ["video", videoInfo.platform],
        metadata: {
          [videoInfo.platform + "Id"]: videoInfo.id,
          uploadedBy: userId,
        },
      })

      toast({
        title: "Video added",
        description: "Video has been added to the project and media library",
      })

      // Clear the input
      setVideoUrl("")
    } catch (error) {
      console.error("Error processing video:", error)
      toast({
        title: "Error adding video",
        description: "Failed to process video URL",
        variant: "destructive",
      })
    } finally {
      setProcessingVideo(false)
    }
  }

  const addBtsVideoUrl = async () => {
    if (!btsVideoUrl.trim()) return

    try {
      const videoInfo = extractVideoInfo(btsVideoUrl)
      if (!videoInfo) {
        toast({
          title: "Invalid video URL",
          description: "Please enter a valid YouTube, Vimeo, or LinkedIn video URL",
          variant: "destructive",
        })
        return
      }

      // Add to BTS videos
      // (In a real implementation, you would store this in a separate array or database table)

      // Add to media library
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const userId = session?.user?.id || "anonymous"

      let thumbnailUrl = null
      let videoTitle = null

      if (videoInfo.platform === "vimeo") {
        // Get video thumbnail and metadata from Vimeo
        const response = await fetch(`https://vimeo.com/api/v2/video/${videoInfo.id}.json`)
        if (response.ok) {
          const videoData = await response.json()
          const video = videoData[0]
          thumbnailUrl = video.thumbnail_large
          videoTitle = video.title || `Vimeo ${videoInfo.id}`
        }
      } else if (videoInfo.platform === "youtube") {
        thumbnailUrl = `https://img.youtube.com/vi/${videoInfo.id}/hqdefault.jpg`
      }

      await supabase.from("media").insert({
        filename: videoTitle || `BTS ${videoInfo.platform} Video ${videoInfo.id}`,
        filepath: btsVideoUrl,
        filesize: 0,
        filetype: videoInfo.platform,
        public_url: btsVideoUrl,
        thumbnail_url: thumbnailUrl,
        tags: ["video", videoInfo.platform, "bts"],
        metadata: {
          [videoInfo.platform + "Id"]: videoInfo.id,
          uploadedBy: userId,
          isBts: true,
        },
      })

      // Add thumbnail to BTS images if available
      if (thumbnailUrl) {
        setBtsImages((prev) => [...prev, thumbnailUrl])
      }

      toast({
        title: "BTS Video added",
        description: "Behind the scenes video has been added to the project",
      })

      // Clear the input
      setBtsVideoUrl("")
    } catch (error) {
      console.error("Error processing BTS video:", error)
      toast({
        title: "Error adding BTS video",
        description: "Failed to process video URL",
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
        setError("Image is required")
        return
      }

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
      <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm p-4 flex justify-between items-center mb-6">
        <Link href="/admin/projects" className="flex items-center gap-2 text-gray-300 hover:text-white">
          <ArrowLeft size={18} />
          <span>Back to Projects</span>
        </Link>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} size="sm">
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
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Project form */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif mb-2">New Project</h1>
          <p className="text-gray-400">Create a new project for your portfolio.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Project details */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="text-lg font-serif py-2"
                    placeholder="Project Title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                  <Input
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    placeholder="e.g. Short Film, Music Video"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                  <Input
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    placeholder="e.g. Director, 1st AC"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                  <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="directed">Directed</SelectItem>
                      <SelectItem value="camera">Camera</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="photography">Photography</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the project..."
                  className="min-h-[150px]"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Special Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  name="special_notes"
                  value={formData.special_notes}
                  onChange={handleChange}
                  placeholder="Any special notes about this project..."
                  className="min-h-[150px]"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right column - Media uploads */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main media drop area */}
            <Card>
              <CardHeader>
                <CardTitle>Main Media</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="aspect-video relative rounded-lg overflow-hidden bg-gray-900 mb-2">
                    {formData.image ? (
                      <img
                        src={formData.image || "/placeholder.svg"}
                        alt={formData.title || "Project cover"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        <div className="text-center">
                          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No cover image selected</p>
                          <p className="text-sm">Upload an image or add a video URL</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Tabs defaultValue="upload" className="mb-4">
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="upload" className="flex items-center gap-1">
                      <Upload size={14} />
                      Upload
                    </TabsTrigger>
                    <TabsTrigger value="media" className="flex items-center gap-1">
                      <ImageIcon size={14} />
                      Media Library
                    </TabsTrigger>
                    <TabsTrigger value="video" className="flex items-center gap-1">
                      <LinkIcon size={14} />
                      Video URL
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload">
                    <ImageUploader
                      currentImage={formData.image}
                      onImageUploaded={handleImageUpload}
                      folder="projects"
                    />
                  </TabsContent>

                  <TabsContent value="media">
                    <MediaSelector onSelect={handleImageUpload} mediaType="images" buttonLabel="Browse Media Library" />
                  </TabsContent>

                  <TabsContent value="video">
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Paste YouTube, Vimeo, or LinkedIn URL"
                          value={videoUrl}
                          onChange={handleVideoUrlChange}
                        />
                        <Button onClick={addVideoUrl} disabled={processingVideo || !videoUrl}>
                          {processingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400">
                        Adding a video will automatically use its thumbnail as the project cover image if none is set.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                {formData.video_url && (
                  <div className="mt-4 p-3 bg-gray-800 rounded-md">
                    <div className="flex items-center gap-2">
                      <LinkIcon size={16} className="text-blue-400" />
                      <span className="text-sm font-medium">Video URL:</span>
                      <span className="text-sm text-gray-300 truncate">{formData.video_url}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* BTS media drop area */}
            <Card>
              <CardHeader>
                <CardTitle>Behind the Scenes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {btsImages.map((image, index) => (
                      <div key={index} className="aspect-square relative rounded-md overflow-hidden bg-gray-900">
                        <img
                          src={image || "/placeholder.svg"}
                          alt={`BTS ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {btsImages.length === 0 && (
                      <div className="aspect-square flex items-center justify-center bg-gray-900 rounded-md col-span-full">
                        <div className="text-center p-4">
                          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm text-gray-400">No BTS images yet</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Tabs defaultValue="upload" className="mb-4">
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="upload" className="flex items-center gap-1">
                      <Upload size={14} />
                      Upload
                    </TabsTrigger>
                    <TabsTrigger value="media" className="flex items-center gap-1">
                      <ImageIcon size={14} />
                      Media Library
                    </TabsTrigger>
                    <TabsTrigger value="video" className="flex items-center gap-1">
                      <LinkIcon size={14} />
                      Video URL
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload">
                    <ImageUploader currentImage="" onImageUploaded={handleBtsImageUpload} folder="bts" />
                  </TabsContent>

                  <TabsContent value="media">
                    <MediaSelector
                      onSelect={handleBtsImageUpload}
                      mediaType="images"
                      buttonLabel="Browse Media Library"
                    />
                  </TabsContent>

                  <TabsContent value="video">
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Paste YouTube, Vimeo, or LinkedIn URL"
                          value={btsVideoUrl}
                          onChange={handleBtsVideoUrlChange}
                        />
                        <Button onClick={addBtsVideoUrl} disabled={!btsVideoUrl}>
                          Add
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400">
                        Adding a BTS video will automatically extract its thumbnail and add it to the BTS images.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom save button */}
        <div className="flex justify-end gap-4 mt-8">
          <Button variant="outline" onClick={() => router.push("/admin/projects")}>
            Cancel
          </Button>

          <Button onClick={handleSave} disabled={saving} className="bg-white text-black hover:bg-gray-200">
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
