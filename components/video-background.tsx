"use client"

import { useState, useEffect } from "react"
import { extractVideoInfo } from "@/lib/utils"

interface VideoBackgroundProps {
  videoUrl: string
  fallbackImage?: string
}

export default function VideoBackground({ videoUrl, fallbackImage = "/images/hero-bg.jpg" }: VideoBackgroundProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [videoInfo, setVideoInfo] = useState<{ platform: string; id: string } | null>(null)

  // Extract video info on mount or when videoUrl changes
  useEffect(() => {
    if (!videoUrl) {
      setHasError(true)
      return
    }

    try {
      const info = extractVideoInfo(videoUrl)
      if (info) {
        setVideoInfo(info)
        setHasError(false)
      } else {
        console.error("Could not extract video info from URL:", videoUrl)
        setHasError(true)
      }
    } catch (error) {
      console.error("Error extracting video info:", error)
      setHasError(true)
    }
  }, [videoUrl])

  // Handle load events
  useEffect(() => {
    // Reset states when video changes
    setIsLoaded(false)

    // Set a timeout to show fallback if video doesn't load
    const timer = setTimeout(() => {
      if (!isLoaded) {
        console.log("Video load timeout - showing fallback")
        setHasError(true)
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [videoUrl, isLoaded])

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    setHasError(true)
  }

  // Get video embed URL
  const getVideoSrc = () => {
    if (!videoInfo) return ""

    const { platform, id } = videoInfo

    if (platform === "youtube") {
      return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${id}`
    } else if (platform === "vimeo") {
      return `https://player.vimeo.com/video/${id}?background=1&autoplay=1&loop=1&byline=0&title=0`
    }

    return ""
  }

  const videoSrc = getVideoSrc()

  // If error or no valid video source, show fallback image
  if (hasError || !videoSrc) {
    return (
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${fallbackImage})` }}
      />
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {/* Fallback image shown until video loads */}
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${fallbackImage})` }}
        />
      )}

      {/* Video iframe */}
      <div className="absolute inset-0 w-full h-full">
        <iframe
          src={videoSrc}
          className={`absolute transition-opacity duration-500 ${isLoaded ? "opacity-100" : "opacity-0"}`}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
          frameBorder="0"
          allow="autoplay"
          onLoad={handleLoad}
          onError={handleError}
        ></iframe>
      </div>
    </div>
  )
}
