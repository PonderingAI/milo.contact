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

  return (
    <>
      {/* Fallback image shown until video loads */}
      {!isLoaded && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${fallbackImage})` }}
        />
      )}

      <div className={`absolute inset-0 transition-opacity duration-1000 ${isLoaded ? "opacity-100" : "opacity-0"}`}>
        {platform === "vimeo" && (
          <iframe
            src={`https://player.vimeo.com/video/${videoId}?background=1&autoplay=1&loop=1&byline=0&title=0&muted=1`}
            className="absolute top-0 left-0 w-full h-full"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title="Background Video"
            onLoad={handleLoad}
            onError={handleError}
          />
        )}

        {platform === "youtube" && (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${videoId}&modestbranding=1`}
            className="absolute top-0 left-0 w-full h-full"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
            title="Background Video"
            onLoad={handleLoad}
            onError={handleError}
          />
        )}
      </div>
    </>
  )
}
