"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Calendar, Tag, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import VideoPlayer from "@/components/video-player"
import { extractVideoInfo } from "@/lib/project-data"

interface ProjectDetailContentProps {
  project: {
    id: string
    title: string
    category: string
    role: string
    image: string
    thumbnail_url?: string // Changed from video_url to thumbnail_url
    video_platform?: string
    video_id?: string
    description?: string
    special_notes?: string
    project_date?: string
    tags?: string[]
    bts_images?: { id: string; image_url: string; caption?: string }[]
  }
}

export default function ProjectDetailContent({ project }: ProjectDetailContentProps) {
  const [videoInfo, setVideoInfo] = useState<{ platform: string; id: string } | null>(
    project.video_platform && project.video_id ? { platform: project.video_platform, id: project.video_id } : null,
  )
  const [videoError, setVideoError] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "bts">("overview")

  // Extract video info from thumbnail_url if not already available
  useEffect(() => {
    if (!videoInfo && project.thumbnail_url) {
      console.log("Extracting video info from thumbnail_url:", project.thumbnail_url)
      const info = extractVideoInfo(project.thumbnail_url)
      if (info) {
        console.log("Extracted video info:", info)
        setVideoInfo(info)
      } else {
        console.log("Failed to extract video info from thumbnail_url")
      }
    }
  }, [project.thumbnail_url, videoInfo])

  // For debugging
  useEffect(() => {
    console.log("Project Detail Content Props:", {
      id: project.id,
      title: project.title,
      thumbnail_url: project.thumbnail_url,
      video_platform: project.video_platform,
      video_id: project.video_id,
      extractedVideoInfo: videoInfo,
      bts_images: project.bts_images?.length || 0,
    })
  }, [project, videoInfo])

  const handleVideoError = () => {
    console.error("Video failed to load")
    setVideoError(true)
  }

  const formattedDate = project.project_date
    ? new Date(project.project_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      })
    : null

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Back button */}
      <div className="mb-8">
        <Button asChild variant="ghost" className="group">
          <Link href="/projects" className="flex items-center text-gray-400 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Projects
          </Link>
        </Button>
      </div>

      {/* Project title */}
      <h1 className="text-4xl md:text-5xl font-bold mb-6">{project.title}</h1>

      {/* Project metadata */}
      <div className="flex flex-wrap gap-3 mb-8">
        {project.category && (
          <Badge variant="outline" className="flex items-center gap-1 text-sm py-1.5">
            <Tag className="h-3.5 w-3.5" />
            {project.category}
          </Badge>
        )}
        {project.role && (
          <Badge variant="outline" className="flex items-center gap-1 text-sm py-1.5">
            <Info className="h-3.5 w-3.5" />
            {project.role}
          </Badge>
        )}
        {formattedDate && (
          <Badge variant="outline" className="flex items-center gap-1 text-sm py-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formattedDate}
          </Badge>
        )}
      </div>

      {/* Tabs for Overview and BTS */}
      {project.bts_images && project.bts_images.length > 0 && (
        <div className="flex border-b border-gray-800 mb-8">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "overview" ? "border-b-2 border-white text-white" : "text-gray-400"
            }`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "bts" ? "border-b-2 border-white text-white" : "text-gray-400"
            }`}
            onClick={() => setActiveTab("bts")}
          >
            Behind the Scenes
          </button>
        </div>
      )}

      {activeTab === "overview" ? (
        <>
          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Media section */}
            <div className="lg:col-span-3">
              {/* Video player or image */}
              {videoInfo && !videoError ? (
                <div className="mb-8 rounded-lg overflow-hidden">
                  <VideoPlayer platform={videoInfo.platform} videoId={videoInfo.id} onError={handleVideoError} />
                </div>
              ) : (
                <div className="mb-8 rounded-lg overflow-hidden">
                  <div className="relative aspect-video">
                    <Image
                      src={project.image || "/placeholder.svg"}
                      alt={project.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Project details */}
            <div className="lg:col-span-2">
              {project.description && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">About this project</h2>
                  <div className="prose prose-invert max-w-none">
                    <p>{project.description}</p>
                  </div>
                </div>
              )}

              {project.special_notes && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4">Special Notes</h2>
                  <div className="prose prose-invert max-w-none">
                    <p>{project.special_notes}</p>
                  </div>
                </div>
              )}

              {project.tags && project.tags.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {project.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        // Behind the Scenes tab
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {project.bts_images?.map((image, index) => (
            <div key={index} className="group relative rounded-lg overflow-hidden">
              <div className="aspect-video relative">
                <Image
                  src={image.image_url || "/placeholder.svg"}
                  alt={image.caption || `Behind the scenes ${index + 1}`}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                />
              </div>
              {image.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-3 transform transition-transform translate-y-full group-hover:translate-y-0">
                  <p className="text-sm text-white">{image.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
