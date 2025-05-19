"use client"

import { useState, useEffect } from "react"
import { extractVideoInfo } from "@/lib/utils"

interface VideoBackgroundProps {
  videoUrl: string
}

export default function VideoBackground({ videoUrl }: VideoBackgroundProps) {
  const [videoInfo, setVideoInfo] = useState<{ platform: string; id: string } | null>(null)

  useEffect(() => {
    if (!videoUrl) return

    try {
      const info = extractVideoInfo(videoUrl)
      setVideoInfo(info)
    } catch (error) {
      console.error("Error extracting video info:", error)
    }
  }, [videoUrl])

  if (!videoInfo) {
    // Fallback to a static image if video info can't be extracted
    return (
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(/images/hero-bg.jpg)` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      </div>
    )
  }

  if (videoInfo.platform === "youtube") {
    return (
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <div className="relative w-full h-full pt-0">
          <iframe
            src={`https://www.youtube.com/embed/${videoInfo.id}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${videoInfo.id}&modestbranding=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            className="absolute top-0 left-0 w-full h-full"
            style={{ border: "none" }}
          ></iframe>
          <div className="absolute inset-0 bg-black bg-opacity-30 pointer-events-none"></div>
        </div>
      </div>
    )
  }

  if (videoInfo.platform === "vimeo") {
    return (
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <div className="relative w-full h-full pt-0">
          <iframe
            src={`https://player.vimeo.com/video/${videoInfo.id}?background=1&autoplay=1&loop=1&byline=0&title=0`}
            allow="autoplay; fullscreen; picture-in-picture"
            className="absolute top-0 left-0 w-full h-full"
            style={{ border: "none" }}
          ></iframe>
          <div className="absolute inset-0 bg-black bg-opacity-30 pointer-events-none"></div>
        </div>
      </div>
    )
  }

  // Fallback for unsupported platforms or if something goes wrong
  return (
    <div
      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(/images/hero-bg.jpg)` }}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
    </div>
  )
}
