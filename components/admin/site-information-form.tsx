"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import MediaSelector from "./media-selector"
import SqlSetupGuide from "./sql-setup-guide"

// SQL code for site_settings table setup
const SITE_SETTINGS_SQL = `-- 1. Create the site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Insert default values
INSERT INTO public.site_settings (key, value)
VALUES
  ('site_title', 'Milo Presedo Portfolio'),
  ('site_description', 'Filmmaker and Cinematographer Portfolio'),
  ('hero_title', 'Milo Presedo'),
  ('hero_subtitle', 'Filmmaker & Cinematographer'),
  ('hero_background', '/images/hero-bg.jpg'),
  ('about_title', 'About Me'),
  ('about_content', 'I am a filmmaker and cinematographer based in San Francisco, California.'),
  ('profile_image', '/images/profile.jpg'),
  ('contact_email', 'contact@example.com'),
  ('contact_phone', '+1 (555) 123-4567'),
  ('social_instagram', 'https://instagram.com/username'),
  ('social_vimeo', 'https://vimeo.com/username'),
  ('social_linkedin', 'https://linkedin.com/in/username'),
  ('footer_text', '© 2023 Milo Presedo. All rights reserved.')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 3. Enable Row Level Security
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 4. Create policies for site_settings table
-- Allow authenticated users to select
CREATE POLICY "Allow authenticated users to select site_settings"
  ON public.site_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow public to select
CREATE POLICY "Allow public to select site_settings"
  ON public.site_settings
  FOR SELECT
  TO anon
  USING (true);

-- Allow authenticated users with admin role to insert/update/delete
CREATE POLICY "Allow admins to insert site_settings"
  ON public.site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Allow admins to update site_settings"
  ON public.site_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Allow admins to delete site_settings"
  ON public.site_settings
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );`

const formSchema = z.object({
  site_title: z.string().min(2, {
    message: "Site title must be at least 2 characters.",
  }),
  site_description: z.string().min(2, {
    message: "Site description must be at least 2 characters.",
  }),
  hero_title: z.string().min(2, {
    message: "Hero title must be at least 2 characters.",
  }),
  hero_subtitle: z.string().min(2, {
    message: "Hero subtitle must be at least 2 characters.",
  }),
  hero_background: z.string().optional(),
  about_title: z.string().min(2, {
    message: "About title must be at least 2 characters.",
  }),
  about_content: z.string().min(10, {
    message: "About content must be at least 10 characters.",
  }),
  profile_image: z.string().optional(),
  contact_email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  contact_phone: z.string().optional(),
  social_instagram: z
    .string()
    .url({
      message: "Please enter a valid URL.",
    })
    .optional()
    .or(z.literal("")),
  social_vimeo: z
    .string()
    .url({
      message: "Please enter a valid URL.",
    })
    .optional()
    .or(z.literal("")),
  social_linkedin: z
    .string()
    .url({
      message: "Please enter a valid URL.",
    })
    .optional()
    .or(z.literal("")),
  footer_text: z.string().min(2, {
    message: "Footer text must be at least 2 characters.",
  }),
})

type FormValues = z.infer<typeof formSchema>

export default function SiteInformationForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSettingUp, setIsSettingUp] = useState(false)
  const { toast } = useToast()

  // Create form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      site_title: "Milo Presedo Portfolio",
      site_description: "Filmmaker and Cinematographer Portfolio",
      hero_title: "Milo Presedo",
      hero_subtitle: "Filmmaker & Cinematographer",
      hero_background: "/images/hero-bg.jpg",
      about_title: "About Me",
      about_content: "I am a filmmaker and cinematographer based in San Francisco, California.",
      profile_image: "/images/profile.jpg",
      contact_email: "contact@example.com",
      contact_phone: "+1 (555) 123-4567",
      social_instagram: "https://instagram.com/username",
      social_vimeo: "https://vimeo.com/username",
      social_linkedin: "https://linkedin.com/in/username",
      footer_text: "© 2023 Milo Presedo. All rights reserved.",
    },
  })

  // Load settings from database on component mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch("/api/settings")

        if (!response.ok) {
          if (response.status === 404) {
            console.log("Settings not found, using defaults")
            return
          }
          throw new Error("Failed to load settings")
        }

        const data = await response.json()

        // Convert array of {key, value} objects to a single object
        const settings = data.reduce((acc: any, item: { key: string; value: string }) => {
          acc[item.key] = item.value
          return acc
        }, {})

        // Update form with settings from database
        form.reset(settings)
      } catch (error) {
        console.error("Error loading settings:", error)
      }
    }

    loadSettings()
  }, [form])

  async function onSubmit(values: FormValues) {
    setIsLoading(true)

    try {
      // Convert object to array of {key, value} objects
      const settingsArray = Object.entries(values).map(([key, value]) => ({
        key,
        value: value || "",
      }))

      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settingsArray),
      })

      if (!response.ok) {
        throw new Error("Failed to save settings")
      }

      toast({
        title: "Settings saved",
        description: "Your site information has been updated.",
      })
    } catch (error) {
      console.error("Upsert error details:", error)
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function setupSiteSettingsTable() {
    setIsSettingUp(true)

    try {
      // First try to create the check_table_exists function
      await fetch("/api/create-check-table-function")

      // Try the first endpoint
      const response1 = await fetch("/api/create-site-settings-table")

      if (response1.ok) {
        toast({
          title: "Success",
          description: "Site settings table has been set up.",
        })
        return
      }

      // If the first endpoint fails, try the second one
      const response2 = await fetch("/api/setup-site-settings-table")

      if (response2.ok) {
        toast({
          title: "Success",
          description: "Site settings table has been set up.",
        })
        return
      }

      throw new Error("Failed to set up site settings table")
    } catch (error) {
      console.error("Error setting up site settings:", error)
      toast({
        title: "Error",
        description: "Failed to set up site settings table. Please run the SQL code manually.",
        variant: "destructive",
      })
    } finally {
      setIsSettingUp(false)
    }
  }

  return (
    <div className="space-y-6">
      <SqlSetupGuide
        tableName="site_settings"
        sqlCode={SITE_SETTINGS_SQL}
        title="Site Settings Table Required"
        description="The site_settings table is missing from your database. Please run the SQL code below in your Supabase SQL Editor to create it."
      />

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Site Information</h2>
        <Button variant="outline" onClick={setupSiteSettingsTable} disabled={isSettingUp}>
          {isSettingUp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Set Up Site Settings Table
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="site_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Milo Presedo Portfolio" {...field} />
                  </FormControl>
                  <FormDescription>This will be displayed in the browser tab.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="site_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Filmmaker and Cinematographer Portfolio" {...field} />
                  </FormControl>
                  <FormDescription>This will be used for SEO.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="hero_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hero Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Milo Presedo" {...field} />
                  </FormControl>
                  <FormDescription>Main title displayed in the hero section.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hero_subtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hero Subtitle</FormLabel>
                  <FormControl>
                    <Input placeholder="Filmmaker & Cinematographer" {...field} />
                  </FormControl>
                  <FormDescription>Subtitle displayed in the hero section.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="hero_background"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hero Background Image</FormLabel>
                <FormControl>
                  <MediaSelector value={field.value || ""} onChange={field.onChange} mediaType="image" />
                </FormControl>
                <FormDescription>Background image for the hero section.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="about_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>About Title</FormLabel>
                  <FormControl>
                    <Input placeholder="About Me" {...field} />
                  </FormControl>
                  <FormDescription>Title for the about section.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="profile_image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Profile Image</FormLabel>
                  <FormControl>
                    <MediaSelector value={field.value || ""} onChange={field.onChange} mediaType="image" />
                  </FormControl>
                  <FormDescription>Your profile image for the about section.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="about_content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>About Content</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="I am a filmmaker and cinematographer based in San Francisco, California."
                    className="min-h-32"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Your bio or about text.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="contact_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Email</FormLabel>
                  <FormControl>
                    <Input placeholder="contact@example.com" {...field} />
                  </FormControl>
                  <FormDescription>Your public contact email.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contact_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 123-4567" {...field} />
                  </FormControl>
                  <FormDescription>Your public contact phone number.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="social_instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://instagram.com/username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="social_vimeo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vimeo URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://vimeo.com/username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="social_linkedin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://linkedin.com/in/username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="footer_text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Footer Text</FormLabel>
                <FormControl>
                  <Input placeholder="© 2023 Milo Presedo. All rights reserved." {...field} />
                </FormControl>
                <FormDescription>Text displayed in the footer.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </Form>
    </div>
  )
}
