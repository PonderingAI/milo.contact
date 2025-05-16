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
  })

  useEffect(() => {
    async function loadSettings() {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data, error } = await supabase
          .from("site_settings")
          .select("key, value")
          .in("key", ["hero_heading", "hero_subheading", "image_hero_bg", "hero_bg_type"])

        if (!error && data) {
          const newSettings = { ...settings }
          data.forEach((item) => {
            // @ts-ignore
            newSettings[item.key] = item.value
          })
          console.log("Loaded settings:", newSettings)
          setSettings(newSettings)
        }
      } catch (err) {
        console.error("Error loading hero settings:", err)
      }
    }

    loadSettings()
  }, [])

  // Force using latest project video if available
  const useLatestProjectVideo = settings.hero_bg_type === "latest_project" && latestProject?.video_url

  // Debug logs
  console.log("Hero bg type:", settings.hero_bg_type)
  console.log("Latest project:", latestProject)
  console.log("Latest project video:", latestProject?.video_url)
  console.log("Using latest project video:", useLatestProjectVideo)

  // Extract video info if using latest project video
  let videoInfo = null
  if (useLatestProjectVideo && latestProject?.video_url) {
    videoInfo = extractVideoInfo(latestProject.video_url)
    console.log("Video info extracted:", videoInfo)
  }

  const scrollToProjects = () => {
    const projectsSection = document.getElementById("projects")
    if (projectsSection) {
      projectsSection.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      {useLatestProjectVideo && videoInfo ? (
        // Use latest project video
        <VideoBackground
          platform={videoInfo.platform}
          videoId={videoInfo.id}
          fallbackImage={latestProject?.image || settings.image_hero_bg}
        />
      ) : (
        // Use image background
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${settings.image_hero_bg})` }}
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
