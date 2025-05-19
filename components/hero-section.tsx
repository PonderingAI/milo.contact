"use client"

import { useState } from "react"
import VideoBackground from "./video-background"
import { fontSerif } from "@/lib/fonts"
import { useRefreshListener } from "@/lib/refresh-utils"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface HeroSectionProps {
  initialSettings: {
    hero_heading: string
    hero_subheading: string
    image_hero_bg: string
    hero_bg_type: string
  }
  latestProject?: any
}

export default function HeroSection({ initialSettings, latestProject }: HeroSectionProps) {
  const [settings, setSettings] = useState(initialSettings)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()

  // Function to fetch the latest settings
  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .in("key", ["hero_heading", "hero_subheading", "image_hero_bg", "hero_bg_type"])

      if (error) {
        console.error("Error fetching hero settings:", error)
        return
      }

      // Convert array to object
      const newSettings = { ...settings }
      data.forEach((item) => {
        // @ts-ignore
        if (newSettings.hasOwnProperty(item.key)) {
          // @ts-ignore
          newSettings[item.key] = item.value
        }
      })

      setSettings(newSettings)
      console.log("Hero settings refreshed:", newSettings)
    } catch (error) {
      console.error("Error in fetchSettings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Listen for refresh events
  useRefreshListener(["settings", "hero"], fetchSettings)

  // Determine what media to show based on hero_bg_type
  let backgroundMedia = settings.image_hero_bg

  if (settings.hero_bg_type === "latest_project" && latestProject) {
    // Use the latest project's video or image
    backgroundMedia = latestProject.video_url || latestProject.thumbnail_url || settings.image_hero_bg
  }

  const isVideo =
    backgroundMedia?.includes("vimeo.com") ||
    backgroundMedia?.includes("youtube.com") ||
    backgroundMedia?.includes("youtu.be") ||
    backgroundMedia?.includes("linkedin.com")

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Background Media */}
      {isVideo ? (
        <VideoBackground videoUrl={backgroundMedia} />
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${backgroundMedia}?t=${Date.now()})`, // Add cache-busting parameter
          }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>
      )}

      {/* Bottom Left Text */}
      <div className="absolute bottom-8 left-8 z-10 max-w-md text-left">
        <h1 className={`text-3xl md:text-4xl font-bold mb-2 ${fontSerif.variable} font-serif text-shadow-sm`}>
          {settings.hero_heading}
        </h1>
        <p className="text-sm md:text-base text-gray-200 leading-snug text-shadow-sm">{settings.hero_subheading}</p>
      </div>

      {/* Loading indicator (hidden when not loading) */}
      {isLoading && (
        <div className="absolute top-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded">Refreshing...</div>
      )}
    </section>
  )
}
