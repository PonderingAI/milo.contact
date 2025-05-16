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
  const [aspectRatio, setAspectRatio] = useState<number | null>(null)

  // Create a clean embed URL without unnecessary parameters
  const getEmbedUrl = () => {
    if (platform === "youtube") {
      // Simplified YouTube embed with only essential parameters
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&rel=0&loop=1&playlist=${videoId}&mute=1&modestbranding=1&showinfo=0`
    } else if (platform === "vimeo") {
      // Simplified Vimeo embed
      return `https://player.vimeo.com/video/${videoId}?background=1&autoplay=1&loop=1&byline=0&title=0`
    }
    return ""
  }

  // Handle errors and timeouts
  useEffect(() => {
    // Set a timeout to show fallback if video doesn't load
    const timer = setTimeout(() => {
      if (!isLoaded) {
        console.warn("Video failed to load in a reasonable time, showing fallback image")
        setHasError(true)
      }
    }, 8000) // 8 seconds timeout

    return () => clearTimeout(timer)
  }, [isLoaded, videoId])

  // Reset states when video changes
  useEffect(() => {
    setIsLoaded(false)
    setHasError(false)
  }, [platform, videoId])

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full overflow-hidden bg-black">
      {hasError ? (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${fallbackImage})` }}
        />
      ) : (
        <>
          {/* Fallback image shown until video loads */}
          {!isLoaded && (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${fallbackImage})` }}
            />
          )}

          {/* Video container with proper aspect ratio preservation */}
          <div className={`absolute inset-0 ${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-700`}>
            <div className="relative w-full h-full">
              <iframe
                src={getEmbedUrl()}
                className="absolute w-full h-full object-cover"
                style={{
                  width: "100%",
                  height: "100%",
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  minWidth: "100%",
                  minHeight: "100%",
                }}
                frameBorder="0"
                allow="autoplay; fullscreen"
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
