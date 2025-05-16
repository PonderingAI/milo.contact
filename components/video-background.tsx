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
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Set a timeout to show fallback if video doesn't load in 5 seconds
    timeoutRef.current = setTimeout(() => {
      if (loading) {
        console.log("Video load timeout - showing fallback")
        setError(true)
      }
    }, 5000)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [loading])

  const handleLoad = () => {
    console.log("Video loaded successfully")
    setLoading(false)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  const handleError = () => {
    console.error("Error loading video")
    setError(true)
    setLoading(false)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
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
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
        style={{ backgroundImage: `url(${fallbackImage})` }}
      />
    )
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {loading && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-500"
          style={{ backgroundImage: `url(${fallbackImage})` }}
        />
      )}
      <iframe
        ref={iframeRef}
        src={videoSrc}
        className={`absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover transition-opacity duration-500 ${
          loading ? "opacity-0" : "opacity-100"
        }`}
        frameBorder="0"
        allow="autoplay"
        onLoad={handleLoad}
        onError={handleError}
      ></iframe>
    </div>
  )
}
