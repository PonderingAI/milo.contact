"use client"

import { useState, useEffect } from "react"

interface VideoBackgroundProps {
  platform: string
  videoId: string
  fallbackImage: string
}

export default function VideoBackground({ platform, videoId, fallbackImage }: VideoBackgroundProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    // Reset states when video changes
    setIsLoaded(false)
    setHasError(false)
  }, [platform, videoId])

  const handleLoad = () => {
    setIsLoaded(true)
  }

  const handleError = () => {
    setHasError(true)
  }

  if (hasError) {
    return (
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${fallbackImage})` }}
      />
    )
  }

  if (platform === "youtube") {
    return (
      <>
        {!isLoaded && (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${fallbackImage})` }}
          />
        )}
        <div className={`absolute inset-0 pointer-events-none ${isLoaded ? "opacity-100" : "opacity-0"}`}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${
              typeof window !== "undefined" ? window.location.origin : ""
            }`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            className="absolute w-[300%] h-[300%] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            onLoad={handleLoad}
            onError={handleError}
          />
        </div>
      </>
    )
  }

  if (platform === "vimeo") {
    return (
      <>
        {!isLoaded && (
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${fallbackImage})` }}
          />
        )}
        <div className={`absolute inset-0 pointer-events-none ${isLoaded ? "opacity-100" : "opacity-0"}`}>
          <iframe
            src={`https://player.vimeo.com/video/${videoId}?background=1&autoplay=1&loop=1&byline=0&title=0`}
            allow="autoplay; fullscreen; picture-in-picture"
            className="absolute w-[300%] h-[300%] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            onLoad={handleLoad}
            onError={handleError}
          />
        </div>
      </>
    )
  }

  // Fallback to image if platform not supported
  return (
    <div
      className="absolute inset-0 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${fallbackImage})` }}
    />
  )
}
