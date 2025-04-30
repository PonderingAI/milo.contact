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
import { Loader2 } from "lucide-react"

export default function SiteInformationForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    // Hero section
    hero_heading: "Film Production & Photography",
    hero_subheading: "Director of Photography, Camera Assistant, Drone & Underwater Operator",
    image_hero_bg: "/images/hero-bg.jpg",

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
        setLoading(true)
        const { data, error } = await supabase.from("site_settings").select("key, value")

        if (error) {
          console.error("Error loading settings:", error)
          toast({
            title: "Error loading settings",
            description: error.message,
            variant: "destructive",
          })
          return
        }

        if (data && data.length > 0) {
          const newSettings = { ...settings }
          data.forEach((item) => {
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
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)

      // Convert settings object to array of {key, value} pairs
      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
      }))

      // Use upsert to insert or update settings
      const { error } = await supabase.from("site_settings").upsert(settingsArray, { onConflict: "key" })

      if (error) {
        throw error
      }

      toast({
        title: "Settings saved",
        description: "Your site information has been updated successfully.",
      })
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
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="hero">
        <TabsList className="mb-4">
          <TabsTrigger value="hero">Hero</TabsTrigger>
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
              <div className="space-y-2">
                <Label htmlFor="image_hero_bg">Background Image URL</Label>
                <Input id="image_hero_bg" name="image_hero_bg" value={settings.image_hero_bg} onChange={handleChange} />
                <p className="text-sm text-gray-500">Enter the URL of the image (e.g., /images/hero-bg.jpg)</p>
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
                <Input id="about_heading" name="about_heading" value={settings.about_heading} onChange={handleChange} />
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
              <div className="space-y-2">
                <Label htmlFor="image_profile">Profile Image URL</Label>
                <Input id="image_profile" name="image_profile" value={settings.image_profile} onChange={handleChange} />
                <p className="text-sm text-gray-500">Enter the URL of the image (e.g., /images/profile.jpg)</p>
              </div>
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
                <Input id="contact_email" name="contact_email" value={settings.contact_email} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Phone</Label>
                <Input id="contact_phone" name="contact_phone" value={settings.contact_phone} onChange={handleChange} />
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
  )
}
