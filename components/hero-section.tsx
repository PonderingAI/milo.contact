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
    hero_heading: "Film Production & Photography",
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
          setSettings(newSettings)
        }
      } catch (err) {
        console.error("Error loading hero settings:", err)
      }
    }

    loadSettings()
  }, [])

  // Determine background media
  let backgroundMedia = settings.image_hero_bg
  let isVideo = false
  let videoInfo = null

  // If hero_bg_type is "latest_project" and we have a latest project with video
  if (settings.hero_bg_type === "latest_project" && latestProject?.video_url) {
    backgroundMedia = latestProject.video_url
    isVideo = true
    videoInfo = extractVideoInfo(latestProject.video_url)
  }
  // Otherwise check if the current background is a video URL
  else if (
    settings.image_hero_bg &&
    (settings.image_hero_bg.includes("vimeo.com") ||
      settings.image_hero_bg.includes("youtube.com") ||
      settings.image_hero_bg.includes("youtu.be"))
  ) {
    isVideo = true
    videoInfo = extractVideoInfo(settings.image_hero_bg)
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
      {isVideo && videoInfo ? (
        <VideoBackground
          platform={videoInfo.platform}
          videoId={videoInfo.id}
          fallbackImage={latestProject?.image || "/images/hero-bg.jpg"}
        />
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundMedia})` }}
        />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif mb-6">{settings.hero_heading}</h1>
        <p className="text-xl md:text-2xl text-gray-200 mb-12 max-w-3xl mx-auto">{settings.hero_subheading}</p>
        <button
          onClick={scrollToProjects}
          className="flex items-center gap-2 mx-auto text-gray-300 hover:text-white transition-colors"
        >
          View My Work <ArrowDown className="w-4 h-4 animate-bounce" />
        </button>
      </div>
    </section>
  )
}
