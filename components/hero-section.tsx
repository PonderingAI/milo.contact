"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { extractVideoInfo } from "@/lib/project-data"
import VideoBackground from "./video-background"

interface HeroSectionProps {
  heading: string
  subheading: string
  backgroundImage: string
  backgroundType?: string
  latestProject?: {
    id: string
    title: string
    thumbnail_url?: string // Changed from video_url to thumbnail_url
    image: string
  }
}

export default function HeroSection({
  heading,
  subheading,
  backgroundImage,
  backgroundType = "image",
  latestProject,
}: HeroSectionProps) {
  const [videoInfo, setVideoInfo] = useState<{ platform: string; id: string } | null>(null)
  const [fallbackImage, setFallbackImage] = useState(backgroundImage)

  // Process video URL if backgroundType is "video" or "latest_project"
  useEffect(() => {
    if (backgroundType === "video" && backgroundImage) {
      // For direct video URL in hero settings
      const info = extractVideoInfo(backgroundImage)
      if (info) {
        setVideoInfo(info)
      }
    } else if (backgroundType === "latest_project" && latestProject) {
      // For latest project video
      // Check thumbnail_url first (where videos are actually stored)
      if (latestProject.thumbnail_url) {
        const info = extractVideoInfo(latestProject.thumbnail_url)
        if (info) {
          setVideoInfo(info)
          // Use project image as fallback
          setFallbackImage(latestProject.image || backgroundImage)
          return
        }
      }

      // If no valid video found, use the project image
      setFallbackImage(latestProject.image || backgroundImage)
    } else {
      // Reset video info if not using video
      setVideoInfo(null)
    }
  }, [backgroundType, backgroundImage, latestProject])

  // For debugging
  useEffect(() => {
    console.log("Hero Section Props:", {
      backgroundType,
      backgroundImage,
      latestProject: latestProject
        ? {
            id: latestProject.id,
            title: latestProject.title,
            thumbnail_url: latestProject.thumbnail_url,
            image: latestProject.image,
          }
        : null,
      videoInfo,
    })
  }, [backgroundType, backgroundImage, latestProject, videoInfo])

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      {videoInfo ? (
        <VideoBackground platform={videoInfo.platform} videoId={videoInfo.id} fallbackImage={fallbackImage} />
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${fallbackImage})` }}
        />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{heading}</h1>
        <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-2xl mx-auto">{subheading}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-white text-black hover:bg-gray-200">
            <Link href="/projects">
              View Projects <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/20">
            <Link href="/contact">Contact Me</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
