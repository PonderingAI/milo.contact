"use client"

import { useState, useEffect } from "react"

interface VideoPlayerProps {
  platform: string
  videoId: string
  onError?: () => void
}

export default function VideoPlayer({ platform, videoId, onError }: VideoPlayerProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Log props for debugging
  useEffect(() => {
    console.log("VideoPlayer mounted with props:", { platform, videoId })
  }, [platform, videoId])

  useEffect(() => {
    // Reset states when props change
    setIsLoaded(false)
    setHasError(false)
  }, [platform, videoId])

  const getEmbedUrl = () => {
    try {
      if (!platform || !videoId) {
        console.error("Missing platform or videoId", { platform, videoId })
        setHasError(true)
        onError?.()
        return ""
      }

      if (platform.toLowerCase() === "youtube") {
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`
      } else if (platform.toLowerCase() === "vimeo") {
        return `https://player.vimeo.com/video/${videoId}?autoplay=1&color=ffffff&title=0&byline=0&portrait=0`
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

  const handleError = () => {
    console.error("Error loading video iframe")
    setHasError(true)
    onError?.()
  }

  if (hasError) {
    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center p-4">
          <p className="mb-2">Unable to load video</p>
          <p className="text-sm text-gray-400">Check the video URL format</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-900">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      {embedUrl && (
        <iframe
          src={embedUrl}
          className={`w-full h-full ${isLoaded ? "opacity-100" : "opacity-0"}`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Embedded video"
          onLoad={() => {
            console.log("Video iframe loaded successfully")
            setIsLoaded(true)
          }}
          onError={handleError}
        ></iframe>
      )}
    </div>
  )
}
