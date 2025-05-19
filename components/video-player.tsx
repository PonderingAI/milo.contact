"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Play, AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  platform: string
  videoId: string
  autoplay?: boolean
  useNativeControls?: boolean
  onError?: () => void
}

export default function VideoPlayer({
  platform,
  videoId,
  autoplay = false,
  useNativeControls = false,
  onError,
}: VideoPlayerProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(autoplay)
  const [retryCount, setRetryCount] = useState(0)
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Log props for debugging
  useEffect(() => {
    console.log("VideoPlayer mounted with props:", { platform, videoId, autoplay, useNativeControls })
  }, [platform, videoId, autoplay, useNativeControls])

  useEffect(() => {
    // Reset states when props change
    setIsLoaded(false)
    setHasError(false)
    setIsPlaying(autoplay)
    setRetryCount(0)

    console.log("VideoPlayer props changed:", { platform, videoId, autoplay, useNativeControls })

    // Clear any existing timeout
    if (loadingTimeout) {
      clearTimeout(loadingTimeout)
    }

    // Set a timeout to show fallback if video doesn't load
    const timer = setTimeout(() => {
      if (!isLoaded && isPlaying) {
        console.log("Video load timeout - showing fallback")
        setHasError(true)
        onError?.()
      }
    }, 8000) // Increased timeout for slower connections

    setLoadingTimeout(timer)

    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout)
      }
    }
  }, [platform, videoId, autoplay, useNativeControls, onError])

  const handleLoad = () => {
    console.log("Video loaded successfully")
    setIsLoaded(true)

    // Clear the timeout since the video loaded successfully
    if (loadingTimeout) {
      clearTimeout(loadingTimeout)
    }
  }

  const handleError = (e: React.SyntheticEvent<HTMLIFrameElement, Event>) => {
    console.error("Error loading video:", e)
    setHasError(true)
    onError?.()
  }

  const handleRetry = () => {
    setHasError(false)
    setIsLoaded(false)
    setRetryCount((prev) => prev + 1)
    setIsPlaying(true)

    // Announce retry to screen readers
    const announcement = document.getElementById("sr-announcement")
    if (announcement) {
      announcement.textContent = "Retrying video playback"
    }
  }

  const handlePlay = () => {
    setIsPlaying(true)

    // Announce play to screen readers
    const announcement = document.getElementById("sr-announcement")
    if (announcement) {
      announcement.textContent = "Playing video"
    }
  }

  // Get video embed URL
  const getEmbedUrl = () => {
    try {
      if (!platform || !videoId) {
        console.error("Missing platform or videoId", { platform, videoId })
        setHasError(true)
        onError?.()
        return ""
      }

      // Add a cache-busting parameter for retries
      const cacheBuster = retryCount > 0 ? `&cb=${Date.now()}` : ""

      if (platform.toLowerCase() === "youtube") {
        // For YouTube, use the standard embed URL with appropriate parameters
        // When useNativeControls is true, we don't add any parameters that would hide the native controls
        return `https://www.youtube.com/embed/${videoId}?rel=0${
          useNativeControls ? "" : "&modestbranding=1"
        }${isPlaying && autoplay ? "&autoplay=1&mute=1" : ""}${cacheBuster}`
      } else if (platform.toLowerCase() === "vimeo") {
        // For Vimeo, use the player.vimeo.com/video/ID format
        // When useNativeControls is true, we don't add parameters that would hide controls
        return `https://player.vimeo.com/video/${videoId}?${
          useNativeControls ? "" : "title=0&byline=0&portrait=0"
        }${isPlaying && autoplay ? "&autoplay=1&muted=1" : ""}${cacheBuster}`
      }

      console.error("Unsupported platform", platform)
      setHasError(true)
      onError?.()
      return ""
    } catch (error) {
      console.error("Error generating embed URL:", error)
      setHasError(true)
      onError?.()
      return ""
    }
  }

  const embedUrl = getEmbedUrl()
  console.log("Generated embed URL:", embedUrl)

  if (hasError) {
    return (
      <div
        ref={containerRef}
        className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center"
        role="alert"
      >
        <div className="text-white text-center p-4 flex flex-col items-center">
          <AlertCircle className="h-12 w-12 mb-4 text-red-500" aria-hidden="true" />
          <p className="mb-2 text-lg font-medium">Unable to load video</p>
          <p className="text-sm text-gray-400 mb-4">There was a problem loading the video</p>
          <Button
            variant="outline"
            onClick={handleRetry}
            className="flex items-center gap-2"
            aria-label="Retry loading video"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!isPlaying && !useNativeControls) {
    return (
      <div
        ref={containerRef}
        className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center cursor-pointer"
        onClick={handlePlay}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            handlePlay()
          }
        }}
        tabIndex={0}
        role="button"
        aria-label="Play video"
      >
        <div className="rounded-full bg-white/20 p-6 backdrop-blur-sm">
          <Play className="h-12 w-12 text-white" fill="white" aria-hidden="true" />
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-900">
      {!isLoaded && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          aria-live="polite"
          aria-label="Loading video"
        >
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      {embedUrl && (
        <iframe
          ref={iframeRef}
          key={`video-${platform}-${videoId}-${retryCount}`} // Force iframe refresh on retry
          src={embedUrl}
          className={`w-full h-full ${isLoaded ? "opacity-100" : "opacity-0"}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={`${platform} video player`}
          onLoad={handleLoad}
          onError={handleError}
          aria-hidden={!isLoaded}
        />
      )}
    </div>
  )
}
