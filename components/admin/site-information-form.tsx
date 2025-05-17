"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Save } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"

const siteInformationSchema = z.object({
  site_name: z.string().min(1, "Site name is required"),
  site_description: z.string().min(1, "Site description is required"),
  contact_email: z.string().email("Invalid email address"),
  hero_bg_type: z.enum(["image", "video", "latest_project"]),
  hero_bg_url: z.string().optional(),
  hero_title: z.string(),
  hero_subtitle: z.string(),
  video_url: z.string().optional(),
  cta_text: z.string().optional(),
  cta_url: z.string().optional(),
})

type SiteInformationFormValues = z.infer<typeof siteInformationSchema>

export default function SiteInformationForm() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Initialize form with default values
  const form = useForm<SiteInformationFormValues>({
    resolver: zodResolver(siteInformationSchema),
    defaultValues: {
      site_name: "",
      site_description: "",
      contact_email: "",
      hero_bg_type: "image",
      hero_bg_url: "",
      hero_title: "",
      hero_subtitle: "",
      video_url: "",
      cta_text: "",
      cta_url: "",
    },
  })

  // Fetch current site information when component mounts
  useEffect(() => {
    const fetchSiteInformation = async () => {
      try {
        setIsLoading(true)
        const supabase = getSupabaseBrowserClient()
        const { data, error } = await supabase.from("settings").select("*")

        if (error) {
          throw error
        }

        // Convert array of settings to an object
        if (data && data.length > 0) {
          const settingsObj: Record<string, any> = {}
          data.forEach((setting) => {
            settingsObj[setting.key] = setting.value
          })

          // Set form values from settings
          form.reset({
            site_name: settingsObj.site_name || "",
            site_description: settingsObj.site_description || "",
            contact_email: settingsObj.contact_email || "",
            hero_bg_type: settingsObj.hero_bg_type || "image",
            hero_bg_url: settingsObj.hero_bg_url || "",
            hero_title: settingsObj.hero_title || "",
            hero_subtitle: settingsObj.hero_subtitle || "",
            video_url: settingsObj.video_url || "",
            cta_text: settingsObj.cta_text || "",
            cta_url: settingsObj.cta_url || "",
          })

          console.log("Loaded settings:", settingsObj)
        }
      } catch (error) {
        console.error("Error fetching site information:", error)
        toast({
          title: "Error",
          description: "Failed to load site information. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchSiteInformation()
  }, [form])

  // Handle form submission
  const onSubmit = async (values: SiteInformationFormValues) => {
    try {
      setIsSaving(true)
      const supabase = getSupabaseBrowserClient()

      console.log("Saving site information:", values)

      // Convert form values to settings format and upsert
      const settings = [
        { key: "site_name", value: values.site_name },
        { key: "site_description", value: values.site_description },
        { key: "contact_email", value: values.contact_email },
        { key: "hero_bg_type", value: values.hero_bg_type },
        { key: "hero_bg_url", value: values.hero_bg_url },
        { key: "hero_title", value: values.hero_title },
        { key: "hero_subtitle", value: values.hero_subtitle },
        { key: "video_url", value: values.video_url },
        { key: "cta_text", value: values.cta_text },
        { key: "cta_url", value: values.cta_url },
      ]

      // Upsert each setting
      for (const setting of settings) {
        const { error } = await supabase
          .from("settings")
          .upsert({ key: setting.key, value: setting.value }, { onConflict: "key" })

        if (error) {
          throw error
        }
      }

      toast({
        title: "Success",
        description: "Site information has been updated.",
      })
    } catch (error) {
      console.error("Error saving site information:", error)
      toast({
        title: "Error",
        description: "Failed to save site information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle bg type change
  const handleBgTypeChange = (value: string) => {
    form.setValue("hero_bg_type", value as "image" | "video" | "latest_project")

    // If switching to latest_project, clear the hero_bg_url and video_url as they'll be pulled from the latest project
    if (value === "latest_project") {
      form.setValue("hero_bg_url", "")
      form.setValue("video_url", "")
    }

    console.log("Background type changed to:", value)
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Site Information</h2>
        <p className="text-muted-foreground">Update your site&apos;s basic information and appearance.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardContent className="pt-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="site_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My Portfolio Site" {...field} />
                        </FormControl>
                        <FormDescription>
                          This will be displayed in the browser tab and various places on your site.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contact_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contact@example.com" {...field} />
                        </FormControl>
                        <FormDescription>This email will be used for contact forms and notifications.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="site_description"
                  render={({ field }) => (
                    <FormItem className="mt-6">
                      <FormLabel>Site Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="A brief description of your portfolio site..." {...field} />
                      </FormControl>
                      <FormDescription>This will be used as the meta description for SEO purposes.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Hero Section</h3>

                <FormField
                  control={form.control}
                  name="hero_bg_type"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel>Hero Background Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) => {
                            field.onChange(value)
                            handleBgTypeChange(value)
                          }}
                          defaultValue={field.value}
                          value={field.value}
                          className="grid grid-cols-3 gap-4"
                        >
                          <FormItem className="flex flex-col items-center space-y-2 rounded-md border border-gray-200 p-4 dark:border-gray-800">
                            <FormControl>
                              <RadioGroupItem value="image" />
                            </FormControl>
                            <FormLabel className="font-normal">Image</FormLabel>
                          </FormItem>
                          <FormItem className="flex flex-col items-center space-y-2 rounded-md border border-gray-200 p-4 dark:border-gray-800">
                            <FormControl>
                              <RadioGroupItem value="video" />
                            </FormControl>
                            <FormLabel className="font-normal">Video</FormLabel>
                          </FormItem>
                          <FormItem className="flex flex-col items-center space-y-2 rounded-md border border-gray-200 p-4 dark:border-gray-800">
                            <FormControl>
                              <RadioGroupItem value="latest_project" />
                            </FormControl>
                            <FormLabel className="font-normal">Latest Project Video</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormDescription>Choose the type of background for your hero section.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("hero_bg_type") === "image" && (
                  <FormField
                    control={form.control}
                    name="hero_bg_url"
                    render={({ field }) => (
                      <FormItem className="mb-6">
                        <FormLabel>Background Image URL</FormLabel>
                        <FormControl>
                          <Input placeholder="/images/hero-bg.jpg" {...field} />
                        </FormControl>
                        <FormDescription>URL to the image you want to use as the hero background.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {form.watch("hero_bg_type") === "video" && (
                  <FormField
                    control={form.control}
                    name="video_url"
                    render={({ field }) => (
                      <FormItem className="mb-6">
                        <FormLabel>Background Video URL</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://www.youtube.com/watch?v=VIDEO_ID or https://vimeo.com/VIDEO_ID"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          URL to the video you want to use as the hero background (YouTube or Vimeo).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {form.watch("hero_bg_type") === "latest_project" && (
                  <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-md">
                    <p className="text-sm">
                      The hero section will automatically use the video from your latest project. Make sure your latest
                      project has a video URL set.
                    </p>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="hero_title"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel>Hero Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Welcome to my portfolio" {...field} />
                      </FormControl>
                      <FormDescription>The main heading for your hero section.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hero_subtitle"
                  render={({ field }) => (
                    <FormItem className="mb-6">
                      <FormLabel>Hero Subtitle</FormLabel>
                      <FormControl>
                        <Textarea placeholder="I'm a filmmaker and photographer based in..." {...field} />
                      </FormControl>
                      <FormDescription>A brief introduction or tagline.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="cta_text"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CTA Button Text</FormLabel>
                        <FormControl>
                          <Input placeholder="View My Work" {...field} />
                        </FormControl>
                        <FormDescription>Text for your call-to-action button.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cta_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CTA Button URL</FormLabel>
                        <FormControl>
                          <Input placeholder="/projects" {...field} />
                        </FormControl>
                        <FormDescription>Where the button should link to.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
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
          </form>
        </Form>
      )}
    </div>
  )
}
