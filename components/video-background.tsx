"use client"

import type React from "react"

import { useState, useEffect } from "react"

interface VideoBackgroundProps {
  platform: string
  videoId: string
  fallbackImage: string
}

export default function VideoBackground({ platform, videoId, fallbackImage }: VideoBackgroundProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Log props for debugging
  useEffect(() => {
    console.log("VideoBackground props:", { platform, videoId, fallbackImage })
  }, [platform, videoId, fallbackImage])

  useEffect(() => {
    // Reset states when video changes
    setIsLoaded(false)
    setHasError(false)

    console.log("VideoBackground props changed:", { platform, videoId, fallbackImage })

    // Set a timeout to show fallback if video doesn't load
    const timer = setTimeout(() => {
      if (!isLoaded) {
        console.log("Video load timeout - showing fallback")
        setHasError(true)
      }
    }, 5000)

    return () => clearTimeout(timer)
  }, [platform, videoId, fallbackImage])

  const handleLoad = () => {
    console.log("Video loaded successfully")
    setIsLoaded(true)
  }

  const handleError = (e: React.SyntheticEvent<HTMLIFrameElement, Event>) => {
    console.error("Error loading video:", e)
    setHasError(true)
  }

  // Get video embed URL
  const getVideoSrc = () => {
    if (!platform || !videoId) {
      console.error("Missing platform or videoId")
      return ""
    }

    if (platform === "youtube") {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${videoId}`
    } else if (platform === "vimeo") {
      return `https://player.vimeo.com/video/${videoId}?background=1&autoplay=1&loop=1&byline=0&title=0`
    } else if (platform === "linkedin") {
      // LinkedIn doesn't support direct embedding in the same way
      // Return empty string to trigger fallback image
      console.log("LinkedIn video detected - using fallback image")
      return ""
    }

    console.warn("Unknown platform:", platform)
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
