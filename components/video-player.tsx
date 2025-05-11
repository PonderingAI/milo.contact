"use client"

import { useState } from "react"

interface VideoPlayerProps {
  platform: string
  videoId: string
}

export default function VideoPlayer({ platform, videoId }: VideoPlayerProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  const getEmbedUrl = () => {
    if (platform === "youtube") {
      return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`
    } else if (platform === "vimeo") {
      return `https://player.vimeo.com/video/${videoId}?color=ffffff&title=0&byline=0&portrait=0`
    }
    return ""
  }

  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-900">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <iframe
        src={getEmbedUrl()}
        className={`w-full h-full ${isLoaded ? "opacity-100" : "opacity-0"}`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Embedded video"
        onLoad={() => setIsLoaded(true)}
      ></iframe>
    </div>
  )
}
