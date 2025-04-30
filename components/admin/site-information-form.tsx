"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Save, Check, AlertCircle } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"

interface SiteSettings {
  site_title: string
  site_description: string
  contact_email: string
  instagram_url: string
  hero_heading: string
  hero_subheading: string
  about_heading: string
  about_text: string
  services_heading: string
  services_text: string
  contact_heading: string
  contact_text: string
  footer_text: string
}

interface ImageUploadProps {
  label: string
  settingKey: string
  description?: string
  currentUrl?: string
  onUpload: (url: string) => void
}

function ImageUploader({ label, settingKey, description, currentUrl, onUpload }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl || null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (currentUrl) {
      setPreview(currentUrl)
    }
  }, [currentUrl])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if file is an image
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB")
      return
    }

    try {
      setUploading(true)
      setError(null)

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

      // Upload the file
      const { data, error: uploadError } = await supabase.storage.from("public").upload(`site/${settingKey}`, file, {
        cacheControl: "3600",
        upsert: true,
      })

      if (uploadError) {
        throw new Error(`Failed to upload image: ${uploadError.message}`)
      }

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("public").getPublicUrl(`site/${settingKey}`)

      // Update the preview
      setPreview(publicUrl)

      // Call the onUpload callback
      onUpload(publicUrl)
    } catch (err: any) {
      console.error("Error uploading image:", err)
      setError(err.message || "Failed to upload image")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`image-${settingKey}`}>{label}</Label>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            id={`image-${settingKey}`}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
        </div>

        {uploading && <Loader2 className="h-5 w-5 animate-spin text-gray-400" />}
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-2 flex items-center text-sm">
          <AlertCircle className="h-4 w-4 text-red-400 mr-2 flex-shrink-0" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {preview && (
        <div className="mt-2">
          <p className="text-xs text-gray-400 mb-1">Preview:</p>
          <div className="relative bg-gray-900/50 rounded-lg p-2 w-full max-w-xs">
            <img src={preview || "/placeholder.svg"} alt={`${label} preview`} className="w-full h-auto rounded" />
          </div>
        </div>
      )}
    </div>
  )
}

export default function SiteInformationForm() {
  const [settings, setSettings] = useState<SiteSettings>({
    site_title: "Milo Presedo",
    site_description: "Filmmaker & Photographer",
    contact_email: "milo.presedo@mailbox.org",
    instagram_url: "https://instagram.com/milo.presedo",
    hero_heading: "Milo Presedo",
    hero_subheading: "Filmmaker & Photographer",
    about_heading: "About Me",
    about_text: "I'm a filmmaker and photographer based in...",
    services_heading: "My Work",
    services_text: "Explore my portfolio of projects...",
    contact_heading: "Get in Touch",
    contact_text: "Interested in working together? Let's talk!",
    footer_text: "© 2023 Milo Presedo. All rights reserved.",
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageSettings, setImageSettings] = useState<Record<string, string>>({})

  const supabase = createClientComponentClient()

  // Load settings from database
  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true)

        // Get text settings
        const { data: textData, error: textError } = await supabase
          .from("site_settings")
          .select("key, value")
          .in("key", [
            "site_title",
            "site_description",
            "contact_email",
            "instagram_url",
            "hero_heading",
            "hero_subheading",
            "about_heading",
            "about_text",
            "services_heading",
            "services_text",
            "contact_heading",
            "contact_text",
            "footer_text",
          ])

        if (textError) {
          console.error("Error loading text settings:", textError)
        } else if (textData) {
          const loadedSettings = { ...settings }
          textData.forEach((item) => {
            if (item.key in loadedSettings) {
              loadedSettings[item.key as keyof SiteSettings] = item.value
            }
          })
          setSettings(loadedSettings)
        }

        // Get image settings
        const { data: imageData, error: imageError } = await supabase
          .from("site_settings")
          .select("key, value")
          .like("key", "image_%")

        if (imageError) {
          console.error("Error loading image settings:", imageError)
        } else if (imageData) {
          const images: Record<string, string> = {}
          imageData.forEach((item) => {
            const key = item.key.replace("image_", "")
            images[key] = item.value
          })
          setImageSettings(images)
        }
      } catch (err) {
        console.error("Error in loadSettings:", err)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = async (key: string, url: string) => {
    setImageSettings((prev) => ({ ...prev, [key]: url }))

    // Save to database immediately
    try {
      await supabase.from("site_settings").upsert({
        key: `image_${key}`,
        value: url,
      })
    } catch (err) {
      console.error(`Error saving image setting ${key}:`, err)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      setError(null)

      // Prepare settings for database
      const settingsToSave = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
      }))

      // Save to database
      const { error: saveError } = await supabase.from("site_settings").upsert(settingsToSave)

      if (saveError) {
        throw new Error(`Failed to save settings: ${saveError.message}`)
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error("Error saving settings:", err)
      setError(err.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">Site Information</h2>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 flex items-center">
          <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-900/20 border border-green-800 rounded-lg p-3 flex items-center">
          <Check className="h-4 w-4 text-green-400 mr-2" />
          <p className="text-green-400 text-sm">Settings saved successfully!</p>
        </div>
      )}

      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="hero">Hero Section</TabsTrigger>
          <TabsTrigger value="about">About Section</TabsTrigger>
          <TabsTrigger value="services">Services Section</TabsTrigger>
          <TabsTrigger value="contact">Contact Section</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site_title">Site Title</Label>
                <Input id="site_title" name="site_title" value={settings.site_title} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_description">Site Description</Label>
                <Textarea
                  id="site_description"
                  name="site_description"
                  value={settings.site_description}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  name="contact_email"
                  type="email"
                  value={settings.contact_email}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram_url">Instagram URL</Label>
                <Input id="instagram_url" name="instagram_url" value={settings.instagram_url} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="footer_text">Footer Text</Label>
                <Input id="footer_text" name="footer_text" value={settings.footer_text} onChange={handleChange} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hero" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hero_heading">Hero Heading</Label>
                <Input id="hero_heading" name="hero_heading" value={settings.hero_heading} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hero_subheading">Hero Subheading</Label>
                <Input
                  id="hero_subheading"
                  name="hero_subheading"
                  value={settings.hero_subheading}
                  onChange={handleChange}
                />
              </div>

              <ImageUploader
                label="Hero Background Image"
                settingKey="hero_bg"
                description="Recommended size: 1920x1080px"
                currentUrl={imageSettings.hero_bg}
                onUpload={(url) => handleImageUpload("hero_bg", url)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="about_heading">About Heading</Label>
                <Input id="about_heading" name="about_heading" value={settings.about_heading} onChange={handleChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="about_text">About Text</Label>
                <Textarea
                  id="about_text"
                  name="about_text"
                  value={settings.about_text}
                  onChange={handleChange}
                  rows={6}
                />
              </div>

              <ImageUploader
                label="Profile Image"
                settingKey="profile"
                description="Recommended size: 500x500px"
                currentUrl={imageSettings.profile}
                onUpload={(url) => handleImageUpload("profile", url)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="services_heading">Services Heading</Label>
                <Input
                  id="services_heading"
                  name="services_heading"
                  value={settings.services_heading}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="services_text">Services Text</Label>
                <Textarea
                  id="services_text"
                  name="services_text"
                  value={settings.services_text}
                  onChange={handleChange}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact_heading">Contact Heading</Label>
                <Input
                  id="contact_heading"
                  name="contact_heading"
                  value={settings.contact_heading}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_text">Contact Text</Label>
                <Textarea
                  id="contact_text"
                  name="contact_text"
                  value={settings.contact_text}
                  onChange={handleChange}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
