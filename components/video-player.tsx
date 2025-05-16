"use client"

import { useState, useEffect } from "react"

interface VideoPlayerProps {
  platform: string
  videoId: string
}

export default function VideoPlayer({ platform, videoId }: VideoPlayerProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    // Reset states when props change
    setIsLoaded(false)
    setHasError(false)
  }, [platform, videoId])

  const getEmbedUrl = () => {
    try {
      if (!platform || !videoId) {
        setHasError(true)
        return ""
      }

      if (platform === "youtube") {
        return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`
      } else if (platform === "vimeo") {
        return `https://player.vimeo.com/video/${videoId}?color=ffffff&title=0&byline=0&portrait=0`
      }

      setHasError(true)
      return ""
    } catch (error) {
      console.error("Error generating embed URL:", error)
      setHasError(true)
      return ""
    }
  }

  const embedUrl = getEmbedUrl()

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
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        ></iframe>
      )}
    </div>
  )
}
