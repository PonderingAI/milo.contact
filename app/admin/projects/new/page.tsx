"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2, ArrowLeft, Save, X, ImageIcon, Film } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { extractVideoInfo } from "@/lib/project-data"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import UploadWidget from "@/components/admin/upload-widget"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
    type: "directed",
    role: "",
    image: "",
    video_url: "",
    description: "",
    special_notes: "",
    crew: "",
  })

  // BTS images state
  const [btsImages, setBtsImages] = useState<string[]>([])
  const [btsVideos, setBtsVideos] = useState<string[]>([])
  const [mainImages, setMainImages] = useState<string[]>([])
  const [mainVideos, setMainVideos] = useState<string[]>([])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleMainMediaSelect = (url: string) => {
    // Determine if it's an image or video based on extension
    const isVideo =
      url.match(/\.(mp4|webm|ogg|mov)$/) !== null || url.includes("youtube.com") || url.includes("vimeo.com")

    if (isVideo) {
      setMainVideos((prev) => [...prev, url])
      setFormData((prev) => ({ ...prev, video_url: url }))
    } else {
      setMainImages((prev) => [...prev, url])
      // Set as cover image if none is set
      if (!formData.image) {
        setFormData((prev) => ({ ...prev, image: url }))
      }
    }

    // If title is empty, try to extract a title from the filename
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

  const handleBtsMediaSelect = (url: string) => {
    // Determine if it's an image or video based on extension
    const isVideo =
      url.match(/\.(mp4|webm|ogg|mov)$/) !== null || url.includes("youtube.com") || url.includes("vimeo.com")

    if (isVideo) {
      setBtsVideos((prev) => [...prev, url])
    } else {
      setBtsImages((prev) => [...prev, url])
    }
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
    try {
      const videoInfo = extractVideoInfo(url)
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
      setFormData((prev) => ({ ...prev, video_url: url }))
      setMainVideos((prev) => [...prev, url])

      // If we have a thumbnail and no image is set, use the thumbnail
      if (thumbnailUrl && !formData.image) {
        setFormData((prev) => ({ ...prev, image: thumbnailUrl }))
        setVideoThumbnail(thumbnailUrl)
        setMainImages((prev) => [...prev, thumbnailUrl])
      }

      // Add to media library
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const userId = session?.user?.id || "anonymous"

      await supabase.from("media").insert({
        filename: videoTitle || `${videoInfo.platform} Video ${videoInfo.id}`,
        filepath: url,
        filesize: 0,
        filetype: videoInfo.platform,
        public_url: url,
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

  const addBtsVideoUrl = async (url: string) => {
    if (!url.trim()) return

    try {
      const videoInfo = extractVideoInfo(url)
      if (!videoInfo) {
        toast({
          title: "Invalid video URL",
          description: "Please enter a valid YouTube, Vimeo, or LinkedIn video URL",
          variant: "destructive",
        })
        return
      }

      // Add to BTS videos
      setBtsVideos((prev) => [...prev, url])

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
        filepath: url,
        filesize: 0,
        filetype: videoInfo.platform,
        public_url: url,
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
            <div>
              <h2 className="text-sm font-medium mb-2 text-gray-400">Main</h2>
              <UploadWidget
                onMediaSelect={handleMainMediaSelect}
                onUrlSubmit={addMainVideoUrl}
                urlPlaceholder="Enter video URL..."
                folder="projects"
                compact={true}
                mediaType="all"
              />
            </div>

            {/* BTS upload area */}
            <div>
              <h2 className="text-sm font-medium mb-2 text-gray-400">BTS</h2>
              <UploadWidget
                onMediaSelect={handleBtsMediaSelect}
                onUrlSubmit={addBtsVideoUrl}
                urlPlaceholder="Enter video URL..."
                folder="bts"
                multiple={true}
                compact={true}
                mediaType="all"
              />
            </div>
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
                  <label className="block text-xs font-medium text-gray-400 mb-1">Role</label>
                  <Input
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="border-gray-800 bg-[#0f1520] text-gray-200"
                    placeholder="e.g. Director, 1st AC"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Type</label>
                  <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                    <SelectTrigger className="border-gray-800 bg-[#0f1520] text-gray-200">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#070a10] border-gray-800 text-gray-200">
                      <SelectItem value="directed">Directed</SelectItem>
                      <SelectItem value="camera">Camera</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="photography">Photography</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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

          {/* Crew */}
          <Card className="border-gray-800 bg-[#070a10]">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-gray-200">Crew</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Textarea
                name="crew"
                value={formData.crew}
                onChange={handleChange}
                placeholder="Enter Names"
                className="min-h-[180px] border-gray-800 bg-[#0f1520] text-gray-200"
              />
            </CardContent>
          </Card>
        </div>

        {/* Media Overview Section */}
        <div className="mt-8">
          <h2 className="text-xl font-medium mb-4 text-gray-200">Media Overview</h2>

          <Tabs defaultValue="main" className="w-full">
            <TabsList className="bg-[#0f1520] border-b border-gray-800 w-full justify-start mb-4">
              <TabsTrigger value="main" className="data-[state=active]:bg-[#131a2a]">
                Main Media
              </TabsTrigger>
              <TabsTrigger value="bts" className="data-[state=active]:bg-[#131a2a]">
                BTS Media
              </TabsTrigger>
            </TabsList>

            <TabsContent value="main">
              <div className="space-y-4">
                {/* Main Images */}
                {mainImages.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-gray-400">Images</h3>
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
                    <h3 className="text-sm font-medium mb-2 text-gray-400">Videos</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {mainVideos.map((video, index) => (
                        <div key={`main-video-${index}`} className="relative group">
                          <div
                            className={`aspect-video bg-[#0f1520] rounded-md overflow-hidden flex items-center justify-center ${formData.video_url === video ? "ring-2 ring-blue-500" : ""}`}
                          >
                            {video.includes("youtube.com") ? (
                              <img
                                src={`https://img.youtube.com/vi/${video.split("v=")[1].split("&")[0]}/hqdefault.jpg`}
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
                  <div className="text-center py-8 text-gray-400">
                    <p>No main media added yet</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="bts">
              <div className="space-y-4">
                {/* BTS Images */}
                {btsImages.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-gray-400">Images</h3>
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
                    <h3 className="text-sm font-medium mb-2 text-gray-400">Videos</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {btsVideos.map((video, index) => (
                        <div key={`bts-video-${index}`} className="relative group">
                          <div className="aspect-video bg-[#0f1520] rounded-md overflow-hidden flex items-center justify-center">
                            {video.includes("youtube.com") ? (
                              <img
                                src={`https://img.youtube.com/vi/${video.split("v=")[1].split("&")[0]}/hqdefault.jpg`}
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
                  <div className="text-center py-8 text-gray-400">
                    <p>No BTS media added yet</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
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
