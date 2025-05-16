"use client"

import { useState, useEffect, useRef } from "react"

interface VideoBackgroundProps {
  platform: string
  videoId: string
  fallbackImage: string
}

export default function VideoBackground({ platform, videoId, fallbackImage }: VideoBackgroundProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const getEmbedUrl = () => {
    if (platform === "youtube") {
      // YouTube embed with autoplay, no controls, no related videos, loop
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&rel=0&loop=1&playlist=${videoId}&mute=1&modestbranding=1&showinfo=0&enablejsapi=1`
    } else if (platform === "vimeo") {
      // Vimeo embed with autoplay, no controls, loop
      return `https://player.vimeo.com/video/${videoId}?background=1&autoplay=1&loop=1&byline=0&title=0`
    }
    return ""
  }

  // Handle errors
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoaded) {
        console.warn("Video failed to load in a reasonable time, showing fallback image")
        setHasError(true)
      }
    }, 8000) // 8 seconds timeout

    return () => clearTimeout(timer)
  }, [isLoaded])

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full overflow-hidden bg-black">
      {hasError ? (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${fallbackImage})` }}
        />
      ) : (
        <>
          {!isLoaded && (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${fallbackImage})` }}
            />
          )}
          <div className={`absolute inset-0 ${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-700`}>
            <div className="relative w-full h-full">
              <iframe
                src={getEmbedUrl()}
                className="absolute w-[300%] h-[300%] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 min-w-full min-h-full"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title="Background video"
                onLoad={() => setIsLoaded(true)}
                onError={() => setHasError(true)}
                loading="eager"
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
