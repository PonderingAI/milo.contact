"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Film } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import MediaSelector from "./media-selector"
import { extractVideoInfo } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface MediaUploaderProps {
  label: string
  settingKey: string
  currentValue: string
  onUpload: (url: string) => void
  allowVideo?: boolean
  allowLatestProject?: boolean
  bgType?: string
  onBgTypeChange?: (type: string) => void
}

function MediaUploader({
  label,
  settingKey,
  currentValue,
  onUpload,
  allowVideo = false,
  allowLatestProject = false,
  bgType = "image",
  onBgTypeChange,
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [mediaType, setMediaType] = useState<"image" | "video" | "latest_project">("image")
  const [videoUrl, setVideoUrl] = useState(
    currentValue.includes("vimeo.com") ||
      currentValue.includes("youtube.com") ||
      currentValue.includes("youtu.be") ||
      currentValue.includes("linkedin.com")
      ? currentValue
      : "",
  )
  const [preview, setPreview] = useState<string | null>(
    !(
      currentValue.includes("vimeo.com") ||
      currentValue.includes("youtube.com") ||
      currentValue.includes("youtu.be") ||
      currentValue.includes("linkedin.com")
    )
      ? currentValue
      : null,
  )
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Set the initial media type based on the bgType prop or current value
    if (bgType === "latest_project") {
      setMediaType("latest_project")
    } else if (
      currentValue.includes("vimeo.com") ||
      currentValue.includes("youtube.com") ||
      currentValue.includes("youtu.be") ||
      currentValue.includes("linkedin.com")
    ) {
      setMediaType("video")
    } else {
      setMediaType("image")
    }
  }, [bgType, currentValue])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      })
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image size should be less than 5MB",
        variant: "destructive",
      })
      return
    }

    try {
      setUploading(true)

      // Ensure the bucket exists
      const { data: buckets } = await supabase.storage.listBuckets()
      const bucketExists = buckets?.some((bucket) => bucket.name === "public")

      if (!bucketExists) {
        const { error } = await supabase.storage.createBucket("public", {
          public: true,
          fileSizeLimit: 5242880, // 5MB
        })

        if (error) {
          throw new Error(`Failed to create bucket: ${error.message}`)
        }
      }

      // Generate a unique filename
      const timestamp = new Date().getTime()
      const fileExt = file.name.split(".").pop()
      const fileName = `${settingKey}_${timestamp}.${fileExt}`
      const filePath = `site/${fileName}`

      // Upload the file
      const { data, error: uploadError } = await supabase.storage.from("public").upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      })

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`)
      }

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("public").getPublicUrl(filePath)

      // Update the preview
      setPreview(publicUrl)

      // Add to media table
      const { error: mediaError } = await supabase.from("media").insert({
        filename: file.name,
        filepath: filePath,
        filesize: file.size,
        filetype: "image",
        public_url: publicUrl,
        tags: ["site", settingKey],
      })

      if (mediaError) {
        console.error("Warning: Failed to add to media table:", mediaError)
        // Continue anyway as the file is uploaded
      }

      // Call the onUpload callback
      onUpload(publicUrl)

      toast({
        title: "Upload successful",
        description: "Image has been uploaded successfully",
      })
    } catch (err: any) {
      console.error("Error uploading image:", err)
      toast({
        title: "Upload failed",
        description: err.message || "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoUrl(e.target.value)
  }

  const saveVideoUrl = async () => {
    if (!videoUrl) {
      toast({
        title: "Missing URL",
        description: "Please enter a video URL",
        variant: "destructive",
      })
      return
    }

    try {
      // Extract video info
      const videoInfo = extractVideoInfo(videoUrl)

      if (!videoInfo) {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid Vimeo, YouTube, or LinkedIn video URL",
          variant: "destructive",
        })
        return
      }

      // Add to media table
      const { error: mediaError } = await supabase.from("media").insert({
        filename: `${videoInfo.platform} Video ${videoInfo.id}`,
        filepath: videoUrl,
        filesize: 0, // Size is not applicable for external videos
        filetype: videoInfo.platform,
        public_url: videoUrl,
        tags: ["video", videoInfo.platform, "site", settingKey],
      })

      if (mediaError) {
        console.error("Warning: Failed to add to media table:", mediaError)
        // Continue anyway as we have the URL
      }

      onUpload(videoUrl)
      toast({
        title: "Video URL saved",
        description: `${videoInfo.platform.charAt(0).toUpperCase() + videoInfo.platform.slice(1)} video has been saved successfully`,
      })
    } catch (err: any) {
      console.error("Error saving video URL:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to save video URL",
        variant: "destructive",
      })
    }
  }

  const handleMediaSelect = (url: string) => {
    if (!url) return

    // Determine if it's a video or image URL
    const isVideo =
      url.includes("vimeo.com") ||
      url.includes("youtube.com") ||
      url.includes("youtu.be") ||
      url.includes("linkedin.com")

    if (isVideo) {
      setMediaType("video")
      setVideoUrl(url)
      setPreview(null)
      if (onBgTypeChange) onBgTypeChange("video")
    } else {
      setMediaType("image")
      setPreview(url)
      setVideoUrl("")
      if (onBgTypeChange) onBgTypeChange("image")
    }

    onUpload(url)
  }

  const handleMediaTypeChange = (value: "image" | "video" | "latest_project") => {
    setMediaType(value)

    // Always call onBgTypeChange when media type changes
    if (onBgTypeChange) onBgTypeChange(value)

    // If switching to latest_project, we need to update the URL to a special value
    if (value === "latest_project") {
      // Use a special placeholder value to indicate latest project
      onUpload("latest_project")
      console.log("Setting media type to latest_project")
    }
    // If switching between image and video, clear the other value
    else if (value === "image") {
      setVideoUrl("")
      if (preview) {
        console.log("Setting media type to image with URL:", preview)
        onUpload(preview)
      }
    } else if (value === "video") {
      setPreview(null)
      if (videoUrl) {
        console.log("Setting media type to video with URL:", videoUrl)
        onUpload(videoUrl)
      }
    }
  }

  return (
    <div className="space-y-4">
      <Label>{label}</Label>

      {(allowVideo || allowLatestProject) && (
        <RadioGroup
          value={mediaType}
          onValueChange={(value) => handleMediaTypeChange(value as "image" | "video" | "latest_project")}
          className="flex flex-wrap space-x-4 mb-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="image" id={`${settingKey}-image`} />
            <Label htmlFor={`${settingKey}-image`} className="cursor-pointer">
              Image
            </Label>
          </div>
          {allowVideo && (
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="video" id={`${settingKey}-video`} />
              <Label htmlFor={`${settingKey}-video`} className="cursor-pointer">
                Video
              </Label>
            </div>
          )}
          {allowLatestProject && (
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="latest_project" id={`${settingKey}-latest-project`} />
              <Label htmlFor={`${settingKey}-latest-project`} className="cursor-pointer">
                Latest Project Video
              </Label>
            </div>
          )}
        </RadioGroup>
      )}

      {mediaType !== "latest_project" && (
        <div className="mb-4">
          <MediaSelector
            onSelect={handleMediaSelect}
            currentValue={mediaType === "image" ? preview || "" : videoUrl}
            mediaType={mediaType === "image" ? "images" : "videos"}
            buttonLabel={`Browse Media Library (${mediaType === "image" ? "Images" : "Videos"})`}
          />
        </div>
      )}

      {mediaType === "latest_project" ? (
        <div className="p-4 bg-gray-800/50 rounded-lg">
          <p className="text-sm">
            The hero background will automatically use the video from the latest project. If the latest project doesn't
            have a video, it will use the project's image instead.
          </p>
        </div>
      ) : mediaType === "image" ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-400 mb-2">Or upload a new file:</p>
          <div className="flex items-center gap-4">
            <Input
              id={`image-${settingKey}`}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
            />
            {uploading && <Loader2 className="h-5 w-5 animate-spin text-gray-400" />}
          </div>

          {preview && (
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-1">Preview:</p>
              <div className="relative bg-gray-900/50 rounded-lg p-2 w-full max-w-xs">
                <img src={preview || "/placeholder.svg"} alt={`${label} preview`} className="w-full h-auto rounded" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-400 mb-2">Or enter a video URL:</p>
          <div className="flex items-center gap-2">
            <Input
              id={`video-${settingKey}`}
              type="text"
              placeholder="https://vimeo.com/123456789 or YouTube/LinkedIn URL"
              value={videoUrl}
              onChange={handleVideoUrlChange}
            />
            <Button type="button" onClick={saveVideoUrl} size="sm">
              <Film className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
          <p className="text-xs text-gray-400">Enter a Vimeo, YouTube, or LinkedIn video URL</p>

          {videoUrl && (
            <div className="mt-4">
              <p className="text-xs text-gray-400 mb-1">Current Video URL:</p>
              <div className="bg-gray-900/50 rounded-lg p-2">
                <p className="text-sm break-all">{videoUrl}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SiteInformationForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    // Hero section
    hero_heading: "Milo Presedo",
    hero_subheading: "Director of Photography, Camera Assistant, Drone & Underwater Operator",
    image_hero_bg: "/images/hero-bg.jpg",
    hero_bg_type: "image", // "image", "video", or "latest_project"
    background_color: "#000000", // Default black background

    // Projects section
    projects_per_page: "20",

    // About section
    about_heading: "About Me",
    about_text1:
      "I'm Milo Presedo, an AI Solutions Architect and film production professional. Fluent in German, Spanish and English, I love diving into the latest AI models, VR technologies, and complex problem-solving.",
    about_text2:
      "My journey combines a solid educational background with hands-on experience in computer science, graphic design, and film production. I work as a Director of Photography (DP), 1st and 2nd Assistant Camera (1AC & 2AC), as well as a drone and underwater operator.",
    about_text3:
      "In my free time, I enjoy FPV drone flying, scuba diving, and exploring nature, which often inspires my landscape and product photography work.",
    image_profile: "/images/profile.jpg",

    // Services section
    services_heading: "Services",

    // Contact section
    contact_heading: "Get in Touch",
    contact_text:
      "Connect with me to discuss AI, VR, film production, or photography projects. I'm always open to new collaborations and opportunities.",
    contact_email: "milo.presedo@mailbox.org",
    contact_phone: "+41 77 422 68 03",
    chatgpt_url: "https://chatgpt.com/g/g-vOF4lzRBG-milo",

    // Footer
    footer_text: "© 2023 Milo Presedo. All rights reserved.",
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings")

        if (!response.ok) {
          throw new Error(`Failed to load settings: ${response.status}`)
        }

        const data = await response.json()

        if (data && data.length > 0) {
          const newSettings = { ...settings }
          data.forEach((item: { key: string; value: string }) => {
            // @ts-ignore
            if (newSettings.hasOwnProperty(item.key)) {
              // @ts-ignore
              newSettings[item.key] = item.value
            }
          })
          setSettings(newSettings)
        }
      } catch (err) {
        console.error("Error in loadSettings:", err)
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    // Special handling for background color to ensure it has a # prefix
    if (name === "background_color") {
      const colorValue = value.startsWith("#") ? value : `#${value}`
      setSettings((prev) => ({
        ...prev,
        [name]: colorValue,
      }))
    } else {
      setSettings((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleSelectChange = (name: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleMediaUpload = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleBgTypeChange = (type: string) => {
    setSettings((prev) => ({
      ...prev,
      hero_bg_type: type,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSaving(true)

      // Debug log
      console.log("Saving settings:", settings)

      // Convert settings object to array of {key, value} pairs
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value: value || "",
      }))

      // Use the API route to save settings
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settingsArray),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save settings")
      }

      // Force a page reload to ensure the changes are reflected
      toast({
        title: "Settings saved",
        description: "Your site information has been updated successfully. The page will refresh to show changes.",
      })

      // Give the toast time to be seen before refreshing
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      console.error("Error saving settings:", err)
      toast({
        title: "Error saving settings",
        description: err.message || "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="hero">
          <TabsList className="mb-4">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="footer">Footer</TabsTrigger>
          </TabsList>

          <TabsContent value="hero">
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
                <CardDescription>Update the main heading and background image of your site.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hero_heading">Heading</Label>
                  <Input id="hero_heading" name="hero_heading" value={settings.hero_heading} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero_subheading">Subheading</Label>
                  <Input
                    id="hero_subheading"
                    name="hero_subheading"
                    value={settings.hero_subheading}
                    onChange={handleChange}
                  />
                </div>
                <MediaUploader
                  label="Background Media"
                  settingKey="image_hero_bg"
                  currentValue={settings.image_hero_bg}
                  onUpload={(url) => handleMediaUpload("image_hero_bg", url)}
                  allowVideo={true}
                  allowLatestProject={true}
                  bgType={settings.hero_bg_type}
                  onBgTypeChange={handleBgTypeChange}
                />
                <div className="space-y-2 mt-4">
                  <Label htmlFor="background_color">Background Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="background_color"
                      name="background_color"
                      type="color"
                      value={
                        settings.background_color.startsWith("#")
                          ? settings.background_color
                          : `#${settings.background_color}`
                      }
                      onChange={handleChange}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      id="background_color_text"
                      name="background_color"
                      type="text"
                      value={settings.background_color}
                      onChange={(e) => {
                        // Remove # if present for consistency
                        const value = e.target.value.replace(/^#/, "")
                        setSettings((prev) => ({
                          ...prev,
                          background_color: value.startsWith("#") ? value : `#${value}`,
                        }))
                      }}
                      className="flex-1"
                      placeholder="#000000"
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    This color will be used for the site background (with or without # prefix)
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <CardTitle>Projects Section</CardTitle>
                <CardDescription>Configure how projects are displayed on your site.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="projects_per_page">Projects Per Page</Label>
                  <Select
                    value={settings.projects_per_page}
                    onValueChange={(value) => handleSelectChange("projects_per_page", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select number of projects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="30">30</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-400 mt-1">
                    Number of projects to show before the "View More" button appears
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>About Section</CardTitle>
                <CardDescription>Update your profile information and image.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="about_heading">Heading</Label>
                  <Input
                    id="about_heading"
                    name="about_heading"
                    value={settings.about_heading}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="about_text1">Paragraph 1</Label>
                  <Textarea
                    id="about_text1"
                    name="about_text1"
                    value={settings.about_text1}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="about_text2">Paragraph 2</Label>
                  <Textarea
                    id="about_text2"
                    name="about_text2"
                    value={settings.about_text2}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="about_text3">Paragraph 3</Label>
                  <Textarea
                    id="about_text3"
                    name="about_text3"
                    value={settings.about_text3}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>
                <MediaUploader
                  label="Profile Image"
                  settingKey="image_profile"
                  currentValue={settings.image_profile}
                  onUpload={(url) => handleMediaUpload("image_profile", url)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>Services Section</CardTitle>
                <CardDescription>Update your services section heading.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="services_heading">Heading</Label>
                  <Input
                    id="services_heading"
                    name="services_heading"
                    value={settings.services_heading}
                    onChange={handleChange}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Contact Section</CardTitle>
                <CardDescription>Update your contact information.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_heading">Heading</Label>
                  <Input
                    id="contact_heading"
                    name="contact_heading"
                    value={settings.contact_heading}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_text">Description</Label>
                  <Textarea
                    id="contact_text"
                    name="contact_text"
                    value={settings.contact_text}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Email</Label>
                  <Input
                    id="contact_email"
                    name="contact_email"
                    value={settings.contact_email}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Phone</Label>
                  <Input
                    id="contact_phone"
                    name="contact_phone"
                    value={settings.contact_phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chatgpt_url">ChatGPT URL</Label>
                  <Input id="chatgpt_url" name="chatgpt_url" value={settings.chatgpt_url} onChange={handleChange} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="footer">
            <Card>
              <CardHeader>
                <CardTitle>Footer</CardTitle>
                <CardDescription>Update your footer text.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="footer_text">Footer Text</Label>
                  <Input id="footer_text" name="footer_text" value={settings.footer_text} onChange={handleChange} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
