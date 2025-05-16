"use client"

import { useState, useEffect } from "react"
import { extractVideoInfo } from "@/lib/utils"
import VideoBackground from "./video-background"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface HeroSectionProps {
  heading?: string
  subheading?: string
  backgroundImage?: string
  backgroundVideo?: string
  backgroundType?: string
}

export default function HeroSection({
  heading = "Milo Presedo",
  subheading = "Director of Photography, Camera Assistant, Drone & Underwater Operator",
  backgroundImage = "/images/hero-bg.jpg",
  backgroundVideo = "",
  backgroundType = "image",
}: HeroSectionProps) {
  const [videoInfo, setVideoInfo] = useState<{ platform: string; id: string } | null>(null)
  const [latestProjectMedia, setLatestProjectMedia] = useState<{
    type: "image" | "video"
    url: string
    platform?: string
    videoId?: string
  } | null>(null)

  useEffect(() => {
    // Extract video info if backgroundType is video and backgroundVideo is provided
    if (backgroundType === "video" && backgroundVideo) {
      const info = extractVideoInfo(backgroundVideo)
      if (info) {
        setVideoInfo(info)
      }
    }

    // Fetch latest project media if backgroundType is latest_project
    if (backgroundType === "latest_project") {
      fetchLatestProjectMedia()
    }
  }, [backgroundType, backgroundVideo])

  const fetchLatestProjectMedia = async () => {
    try {
      const supabase = createClientComponentClient()

      // Get the latest project
      const { data: projects, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)

      if (error) {
        console.error("Error fetching latest project:", error)
        return
      }

      if (projects && projects.length > 0) {
        const latestProject = projects[0]

        // Check if the project has a video
        if (latestProject.video_url) {
          const videoInfo = extractVideoInfo(latestProject.video_url)
          if (videoInfo) {
            setLatestProjectMedia({
              type: "video",
              url: latestProject.video_url,
              platform: videoInfo.platform,
              videoId: videoInfo.id,
            })
            return
          }
        }

        // Fallback to image if no video or video info extraction failed
        if (latestProject.image_url) {
          setLatestProjectMedia({
            type: "image",
            url: latestProject.image_url,
          })
        }
      }
    } catch (error) {
      console.error("Error in fetchLatestProjectMedia:", error)
    }
  }

  // Determine what to display as background
  const renderBackground = () => {
    // Case 1: Latest project media (video or image)
    if (backgroundType === "latest_project" && latestProjectMedia) {
      if (latestProjectMedia.type === "video" && latestProjectMedia.platform && latestProjectMedia.videoId) {
        return (
          <VideoBackground
            platform={latestProjectMedia.platform}
            videoId={latestProjectMedia.videoId}
            fallbackImage={backgroundImage}
          />
        )
      } else {
        return (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${latestProjectMedia.url})` }}
          />
        )
      }
    }

    // Case 2: Video background
    if (backgroundType === "video" && videoInfo) {
      return <VideoBackground platform={videoInfo.platform} videoId={videoInfo.id} fallbackImage={backgroundImage} />
    }

    // Case 3: Default to image background
    return (
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />
    )
  }

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background */}
      {renderBackground()}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>

      {/* Content - Positioned at bottom left */}
      <div className="absolute bottom-8 left-8 z-10 max-w-xl text-white">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">{heading}</h1>
        <p className="text-sm md:text-base opacity-90">{subheading}</p>
      </div>
    </section>
  )
}
