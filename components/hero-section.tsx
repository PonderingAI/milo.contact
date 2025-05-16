"use client"

import { useState, useEffect } from "react"
import { ArrowDown } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import { extractVideoInfo } from "@/lib/project-data"
import VideoBackground from "./video-background"
import type { Project } from "@/lib/project-data"

interface HeroSectionProps {
  latestProject?: Project | null
}

export default function HeroSection({ latestProject }: HeroSectionProps) {
  const [settings, setSettings] = useState({
    hero_heading: "Milo Presedo",
    hero_subheading: "Director of Photography, Camera Assistant, Drone & Underwater Operator",
    image_hero_bg: "/images/hero-bg.jpg",
    hero_bg_type: "image", // "image", "video", or "latest_project"
    background_color: "#000000",
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true)
        const supabase = getSupabaseBrowserClient()
        const { data, error } = await supabase
          .from("site_settings")
          .select("key, value")
          .in("key", ["hero_heading", "hero_subheading", "image_hero_bg", "hero_bg_type", "background_color"])

        if (error) {
          console.error("Error loading hero settings:", error)
          setError("Failed to load hero settings")
          return
        }

        if (data && data.length > 0) {
          const newSettings = { ...settings }
          data.forEach((item) => {
            // @ts-ignore
            newSettings[item.key] = item.value
          })
          setSettings(newSettings)
          console.log("Hero settings loaded:", newSettings) // Debug log
        }
      } catch (err) {
        console.error("Error in loadSettings:", err)
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  // Determine background media
  let backgroundMedia = settings.image_hero_bg
  let isVideo = false
  let videoInfo = null

  console.log("Hero background type:", settings.hero_bg_type)
  console.log("Latest project:", latestProject)

  // If hero_bg_type is "latest_project" and we have a latest project with video
  if (settings.hero_bg_type === "latest_project" && latestProject?.video_url) {
    backgroundMedia = latestProject.video_url
    isVideo = true
    videoInfo = extractVideoInfo(latestProject.video_url)
    console.log("Using latest project video:", backgroundMedia, videoInfo)
  }
  // Otherwise check if the current background is a video URL
  else if (
    settings.hero_bg_type === "video" ||
    (settings.image_hero_bg &&
      (settings.image_hero_bg.includes("vimeo.com") ||
        settings.image_hero_bg.includes("youtube.com") ||
        settings.image_hero_bg.includes("youtu.be")))
  ) {
    isVideo = true
    videoInfo = extractVideoInfo(settings.image_hero_bg)
    console.log("Using video background:", backgroundMedia, videoInfo)
  } else {
    console.log("Using image background:", backgroundMedia)
  }

  const scrollToProjects = () => {
    const projectsSection = document.getElementById("projects")
    if (projectsSection) {
      projectsSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  if (loading) {
    return (
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-black">
        <div className="text-white">Loading...</div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-black">
        <div className="text-white">Error: {error}</div>
      </section>
    )
  }

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      {isVideo && videoInfo ? (
        <VideoBackground
          platform={videoInfo.platform}
          videoId={videoInfo.id}
          fallbackImage={latestProject?.image || settings.image_hero_bg}
        />
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundMedia})` }}
        />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content - positioned at bottom left */}
      <div className="absolute bottom-10 left-10 z-10 text-left">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-serif mb-2">{settings.hero_heading}</h1>
        <p className="text-sm md:text-base text-gray-200 mb-4 max-w-md">{settings.hero_subheading}</p>
        <button
          onClick={scrollToProjects}
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors text-sm"
        >
          View My Work <ArrowDown className="w-3 h-3 animate-bounce" />
        </button>
      </div>
    </section>
  )
}
