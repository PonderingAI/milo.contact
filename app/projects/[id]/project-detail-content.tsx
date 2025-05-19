"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Calendar, Tag, Info, Play, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import VideoPlayer from "@/components/video-player"
import BTSLightbox from "@/components/bts-lightbox"
import { extractVideoInfo } from "@/lib/project-data"

interface BTSMedia {
  id: string
  image_url: string
  caption?: string
  is_video?: boolean
  video_url?: string
  video_platform?: string
  video_id?: string
}

interface ProjectDetailContentProps {
  project: {
    id: string
    title: string
    category: string
    role: string
    image: string
    thumbnail_url?: string
    video_platform?: string
    video_id?: string
    description?: string
    special_notes?: string
    project_date?: string
    tags?: string[]
    bts_images?: BTSMedia[]
    external_url?: string
  }
}

export default function ProjectDetailContent({ project }: ProjectDetailContentProps) {
  const [videoInfo, setVideoInfo] = useState<{ platform: string; id: string } | null>(
    project.video_platform && project.video_id ? { platform: project.video_platform, id: project.video_id } : null,
  )
  const [videoError, setVideoError] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  // Process BTS media to ensure they have proper video info
  const [btsMedia, setBtsMedia] = useState<BTSMedia[]>([])

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

  // Process BTS media
  useEffect(() => {
    if (project.bts_images && project.bts_images.length > 0) {
      const processedMedia = project.bts_images.map((media) => {
        // If it's already processed with is_video flag, return as is
        if (media.is_video !== undefined) return media

        // Check if it has video_url, video_platform, or video_id
        const isVideo = media.video_url || (media.video_platform && media.video_id)

        // If it's a video, ensure it has video_url
        if (isVideo && !media.video_url && media.video_platform && media.video_id) {
          let videoUrl = ""
          if (media.video_platform.toLowerCase() === "youtube") {
            videoUrl = `https://www.youtube.com/embed/${media.video_id}?rel=0&modestbranding=1`
          } else if (media.video_platform.toLowerCase() === "vimeo") {
            videoUrl = `https://player.vimeo.com/video/${media.video_id}?title=0&byline=0&portrait=0`
          }

          return {
            ...media,
            is_video: true,
            video_url: videoUrl,
          }
        }

        return {
          ...media,
          is_video: Boolean(isVideo),
        }
      })

      setBtsMedia(processedMedia)
    }

    // Simulate loading completion
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [project.bts_images])

  const handleVideoError = () => {
    console.error("Video failed to load")
    setVideoError(true)
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  const formattedDate = project.project_date
    ? new Date(project.project_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null

  return (
    <>
      {/* Main content */}
      <div className="max-w-7xl mx-auto">
        {/* Back button */}
        <div className="mb-8">
          <Button asChild variant="ghost" className="group">
            <Link href="/projects" className="flex items-center text-gray-400 hover:text-white">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Projects
            </Link>
          </Button>
        </div>

        {/* Full-width video/image section */}
        <div className="w-full mb-12 rounded-lg overflow-hidden bg-black/50">
          {videoInfo && !videoError ? (
            <div className="aspect-video w-full">
              <VideoPlayer
                platform={videoInfo.platform}
                videoId={videoInfo.id}
                onError={handleVideoError}
                autoplay={false}
              />
            </div>
          ) : (
            <div className="aspect-video w-full relative">
              <Image
                src={project.image || "/placeholder.svg"}
                alt={project.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
        </div>

        {/* Project title and metadata */}
        <div className="mb-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h1 className="text-4xl md:text-5xl font-bold">{project.title}</h1>

            {project.external_url && (
              <Button asChild variant="outline" size="sm" className="self-start">
                <a
                  href={project.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Project
                </a>
              </Button>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
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
        </div>

        {/* Project content in a two-column layout on larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
          {/* Description column */}
          {project.description && (
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-semibold mb-6 pb-2 border-b border-gray-800">About this project</h2>
              <div className="prose prose-invert prose-lg max-w-none">
                <p className="text-gray-300 leading-relaxed">{project.description}</p>
              </div>
            </div>
          )}

          {/* Special notes column */}
          {project.special_notes && (
            <div className="lg:col-span-1">
              <h2 className="text-2xl font-semibold mb-6 pb-2 border-b border-gray-800">Special Notes</h2>
              <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300">{project.special_notes}</p>
                </div>
              </div>

              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">Tags</h3>
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
          )}
        </div>

        {/* BTS Images Section */}
        {btsMedia.length > 0 && (
          <div className="mb-16">
            <h2 className="text-2xl font-semibold mb-8 pb-2 border-b border-gray-800">Behind the Scenes</h2>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((_, index) => (
                  <div key={index} className="rounded-lg bg-gray-800 animate-pulse">
                    <div className="aspect-video"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {btsMedia.map((media, index) => (
                  <div
                    key={media.id || index}
                    className="cursor-pointer group relative rounded-lg overflow-hidden"
                    onClick={() => openLightbox(index)}
                  >
                    <div className="aspect-video relative">
                      <Image
                        src={media.image_url || "/placeholder.svg"}
                        alt={media.caption || `Behind the scenes ${index + 1}`}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />

                      {/* Play button overlay for videos */}
                      {media.is_video && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                          <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm">
                            <Play className="h-8 w-8 text-white" fill="white" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Caption overlay */}
                    {media.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-3 transform transition-transform translate-y-full group-hover:translate-y-0">
                        <p className="text-sm text-white">{media.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* BTS Lightbox */}
      <BTSLightbox media={btsMedia} initialIndex={lightboxIndex} isOpen={lightboxOpen} onClose={closeLightbox} />
    </>
  )
}
