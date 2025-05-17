"use client"

import { useRef, useEffect, useState } from "react"
import { extractVideoInfo } from "@/lib/project-data"

interface VideoBackgroundProps {
  videoUrl: string
  fallbackImageUrl?: string
  isVisible?: boolean
}

export default function VideoBackground({ videoUrl, fallbackImageUrl, isVisible = true }: VideoBackgroundProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [videoSrc, setVideoSrc] = useState<string | null>(null)

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    console.log("VideoBackground: Video URL received:", videoUrl)

    // Only process if the URL is present and component is visible
    if (videoUrl && isVisible) {
      setLoading(true)
      setError(null)
      getVideoSrc(videoUrl)
        .then((src) => {
          console.log("VideoBackground: Processed video source:", src)
          setVideoSrc(src)
          setLoading(false)
        })
        .catch((err) => {
          console.error("VideoBackground: Error processing video URL:", err)
          setError(err.message || "Failed to load video")
          setLoading(false)
        })
    }
  }, [videoUrl, isVisible])

  // Function to extract proper embed URL based on platform
  const getVideoSrc = async (url: string): Promise<string> => {
    try {
      if (!url) throw new Error("No video URL provided")

      const videoInfo = extractVideoInfo(url)

      if (!videoInfo) {
        console.warn("VideoBackground: Could not extract video info from URL:", url)
        throw new Error("Invalid video URL")
      }

      console.log("VideoBackground: Extracted video info:", videoInfo)

      switch (videoInfo.platform) {
        case "youtube":
          return `https://www.youtube.com/embed/${videoInfo.id}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${videoInfo.id}&modestbranding=1&iv_load_policy=3&disablekb=1`
        case "vimeo":
          return `https://player.vimeo.com/video/${videoInfo.id}?background=1&autoplay=1&loop=1&byline=0&title=0`
        default:
          console.warn("VideoBackground: Unsupported platform:", videoInfo.platform)
          throw new Error(`Unsupported video platform: ${videoInfo.platform}`)
      }
    } catch (error) {
      console.error("VideoBackground: Error in getVideoSrc:", error)
      throw error
    }
  }

  // If there's an error or loading, we'll show the fallback image if available
  if (!isVisible || error || !videoUrl) {
    if (fallbackImageUrl) {
      return (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${fallbackImageUrl})` }}
        />
      )
    }
    return null
  }

  return (
    <>
      {loading && fallbackImageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${fallbackImageUrl})` }}
        />
      )}

      {videoSrc && (
        <div className="absolute inset-0 overflow-hidden bg-black">
          <iframe
            ref={iframeRef}
            src={videoSrc}
            className="absolute inset-0 w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            style={{
              width: "100%",
              height: "100%",
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              minHeight: "100%",
              minWidth: "100%",
              objectFit: "cover",
            }}
            frameBorder="0"
            allowFullScreen
          />
          <div className="absolute inset-0 bg-black/30" /> {/* Overlay to darken the video slightly */}
        </div>
      )}
    </>
  )
}
