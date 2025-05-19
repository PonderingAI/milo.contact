"use client"

import { useState, useEffect, useRef } from "react"
import { extractVideoInfo } from "@/lib/utils"

interface VideoBackgroundProps {
  videoUrl: string
  fallbackImage?: string
}

export default function VideoBackground({ videoUrl, fallbackImage = "/images/hero-bg.jpg" }: VideoBackgroundProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [videoInfo, setVideoInfo] = useState<{ platform: string; id: string } | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const retryCountRef = useRef(0)
  const maxRetries = 1 // Reduced retries to avoid long loading times

  // Extract video info on mount or when videoUrl changes
  useEffect(() => {
    console.log("VideoBackground received URL:", videoUrl)
    if (!videoUrl) {
      console.error("No video URL provided")
      setHasError(true)
      return
    }

    try {
      const info = extractVideoInfo(videoUrl)
      if (info) {
        console.log("Video info extracted:", info)
        setVideoInfo(info)
        setHasError(false)
        retryCountRef.current = 0
      } else {
        console.error("Could not extract video info from URL:", videoUrl)
        setHasError(true)
      }
    } catch (error) {
      console.error("Error extracting video info:", error)
      setHasError(true)
    }
  }, [videoUrl])

  // Set up load timeout and cleanup
  useEffect(() => {
    // Clear any existing timeout
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current)
    }

    // Reset states when video changes
    setIsLoaded(false)

    // Set a timeout to show fallback if video doesn't load
    loadTimeoutRef.current = setTimeout(() => {
      if (!isLoaded) {
        console.log("Video load timeout - showing black background")
        setHasError(true)
      }
    }, 5000) // Shorter timeout to avoid long waiting

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current)
      }
    }
  }, [videoUrl, isLoaded])

  const handleLoad = () => {
    console.log("Video iframe loaded successfully")
    setIsLoaded(true)
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current)
    }
  }

  const handleError = () => {
    console.error("Error loading video iframe")
    setHasError(true)
  }

  // Get video embed URL with minimal parameters
  const getVideoSrc = () => {
    if (!videoInfo) return ""

    const { platform, id } = videoInfo

    // Use minimal parameters to avoid permission policy errors
    if (platform === "youtube") {
      return `https://www.youtube-nocookie.com/embed/${id}?controls=0&rel=0&autoplay=1&mute=1`
    } else if (platform === "vimeo") {
      return `https://player.vimeo.com/video/${id}?background=1&autoplay=1&muted=1`
    }

    return ""
  }

  // If error or no valid video source, show black background
  if (hasError || !videoInfo) {
    return <div className="absolute inset-0 bg-black" />
  }

  const videoSrc = getVideoSrc()

  // If we couldn't generate a valid video source, show black background
  if (!videoSrc) {
    return <div className="absolute inset-0 bg-black" />
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {/* Video iframe */}
      <div className="absolute inset-0 w-full h-full">
        <iframe
          ref={iframeRef}
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
          allowFullScreen
          onLoad={handleLoad}
          onError={handleError}
          title="Background video"
        ></iframe>
      </div>
    </div>
  )
}
