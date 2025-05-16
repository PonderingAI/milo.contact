"use client"

import { useState, useEffect, useRef } from "react"

interface VideoBackgroundProps {
  platform: string
  videoId: string
  fallbackImage: string
}

export default function VideoBackground({ platform, videoId, fallbackImage }: VideoBackgroundProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Set a timeout to show fallback if video doesn't load in 8 seconds
    const timer = setTimeout(() => {
      if (loading) {
        console.log("Video load timeout - showing fallback")
        setError(true)
      }
    }, 8000)

    return () => clearTimeout(timer)
  }, [loading])

  const handleLoad = () => {
    console.log("Video loaded successfully")
    setLoading(false)
  }

  const handleError = () => {
    console.error("Error loading video")
    setError(true)
    setLoading(false)
  }

  // Determine the video URL based on the platform
  let videoSrc = ""
  if (platform === "youtube") {
    videoSrc = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${videoId}&modestbranding=1`
  } else if (platform === "vimeo") {
    videoSrc = `https://player.vimeo.com/video/${videoId}?background=1&autoplay=1&loop=1&byline=0&title=0`
  }

  if (error || !videoSrc) {
    return (
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${fallbackImage})` }}
      />
    )
  }

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-black">
      {loading && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${fallbackImage})` }}
        />
      )}

      {/* Video container with aspect ratio preservation */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full">
          <iframe
            src={videoSrc}
            className={`absolute w-full h-full object-contain transition-opacity duration-700 ${
              loading ? "opacity-0" : "opacity-100"
            }`}
            style={{
              position: "absolute",
              width: "100vw",
              height: "100vh",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              objectFit: "contain",
            }}
            frameBorder="0"
            allow="autoplay"
            onLoad={handleLoad}
            onError={handleError}
          ></iframe>
        </div>
      </div>
    </div>
  )
}
