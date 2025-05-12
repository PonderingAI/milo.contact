"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2, ArrowLeft, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { extractVideoInfo } from "@/lib/project-data"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import UploadWidget from "@/components/admin/upload-widget"

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleMainImageUpload = (url: string) => {
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

  const openMainMediaBrowser = () => {
    // This would open your media browser component
    toast({
      title: "Media Browser",
      description: "Opening media browser for main content",
    })
  }

  const openBtsMediaBrowser = () => {
    // This would open your media browser component
    toast({
      title: "Media Browser",
      description: "Opening media browser for BTS content",
    })
  }

  const handleMainDeviceBrowse = () => {
    // This would be handled by the UploadWidget component
    toast({
      title: "File Browser",
      description: "Opening file browser for main content",
    })
  }

  const handleBtsDeviceBrowse = () => {
    // This would be handled by the UploadWidget component
    toast({
      title: "File Browser",
      description: "Opening file browser for BTS content",
    })
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
      <div className="sticky top-0 z-10 bg-[#121212]/80 backdrop-blur-sm p-4 flex justify-between items-center mb-6">
        <Link href="/admin/projects" className="flex items-center gap-2 text-gray-300 hover:text-white">
          <ArrowLeft size={18} />
          <span>Back to Projects</span>
        </Link>

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving} size="sm" variant="outline">
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
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6 max-w-7xl mx-auto">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Project form */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column - Upload areas */}
          <div className="space-y-6">
            {/* Main upload area */}
            <div>
              <h2 className="text-2xl font-medium mb-4">Main</h2>
              <UploadWidget
                onMediaBrowse={openMainMediaBrowser}
                onDeviceBrowse={handleMainDeviceBrowse}
                onUrlSubmit={addMainVideoUrl}
                urlPlaceholder="Enter video URL..."
              />
            </div>

            {/* BTS upload area */}
            <div>
              <h2 className="text-2xl font-medium mb-4">BTS</h2>
              <UploadWidget
                onMediaBrowse={openBtsMediaBrowser}
                onDeviceBrowse={handleBtsDeviceBrowse}
                onUrlSubmit={addBtsVideoUrl}
                urlPlaceholder="Enter video URL..."
                multiple={true}
              />
            </div>
          </div>

          {/* Right column - Project details */}
          <div>
            <Card className="border-gray-800 bg-transparent">
              <CardHeader>
                <CardTitle className="text-2xl">Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                  <Input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="border-gray-800 bg-transparent"
                    placeholder="Project Title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                  <Input
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="border-gray-800 bg-transparent"
                    placeholder="e.g. Short Film, Music Video"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
                  <Input
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="border-gray-800 bg-transparent"
                    placeholder="e.g. Director, 1st AC"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                  <Select value={formData.type} onValueChange={(value) => handleSelectChange("type", value)}>
                    <SelectTrigger className="border-gray-800 bg-transparent">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#121212] border-gray-800">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Description */}
          <Card className="border-gray-800 bg-transparent">
            <CardHeader>
              <CardTitle className="text-2xl">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the project..."
                className="min-h-[200px] border-gray-800 bg-transparent"
              />
            </CardContent>
          </Card>

          {/* Crew */}
          <Card className="border-gray-800 bg-transparent">
            <CardHeader>
              <CardTitle className="text-2xl">Crew</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                name="crew"
                value={formData.crew}
                onChange={handleChange}
                placeholder="Enter Names"
                className="min-h-[200px] border-gray-800 bg-transparent"
              />
            </CardContent>
          </Card>
        </div>

        {/* Bottom save button */}
        <div className="flex justify-end gap-4 mt-8">
          <Button variant="outline" onClick={() => router.push("/admin/projects")}>
            Cancel
          </Button>

          <Button onClick={handleSave} disabled={saving} variant="outline">
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
