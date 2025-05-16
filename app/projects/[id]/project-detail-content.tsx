"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { extractVideoInfo } from "@/lib/project-data"
import VideoPlayer from "@/components/video-player"

interface BtsImage {
  id: string
  project_id: string
  image_url: string
  caption?: string
  size?: "small" | "medium" | "large"
  aspect_ratio?: "square" | "portrait" | "landscape"
}

interface ProjectDetailContentProps {
  project: {
    id: string
    title: string
    category: string
    type: string
    role: string
    image: string
    video_url?: string
    description?: string
    special_notes?: string
    bts_images?: BtsImage[]
  }
}

export default function ProjectDetailContent({ project }: ProjectDetailContentProps) {
  const [selectedBtsImage, setSelectedBtsImage] = useState<string | null>(null)
  const descriptionRef = useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (descriptionRef.current) {
        const rect = descriptionRef.current.getBoundingClientRect()
        setIsScrolled(rect.top <= 100)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Extract video ID from YouTube or Vimeo URL
  const videoInfo = project.video_url ? extractVideoInfo(project.video_url) : null

  // Get BTS images or use empty array if none
  const btsImages = project.bts_images || []

  // Check if description or special notes exist
  const hasDescription = project.description && project.description.trim().length > 0
  const hasSpecialNotes = project.special_notes && project.special_notes.trim().length > 0
  const hasAboutSection = hasDescription || hasSpecialNotes

  return (
    <>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>
      </div>

      <h1 className="text-4xl md:text-6xl font-serif mb-4">{project.title}</h1>
      <div className="flex flex-wrap gap-3 mb-8">
        <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm">{project.category}</span>
        <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-sm">{project.role}</span>
      </div>

      {/* Main video/image section - almost full screen */}
      <div className="w-full max-w-5xl mx-auto mb-16">
        {project.video_url && videoInfo ? (
          <VideoPlayer platform={videoInfo.platform} videoId={videoInfo.id} />
        ) : (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden">
            <Image src={project.image || "/placeholder.svg"} alt={project.title} fill className="object-cover" />
          </div>
        )}
      </div>

      {/* Description section - only render if there's content */}
      {hasAboutSection && (
        <div ref={descriptionRef} className="max-w-3xl mx-auto mb-16">
          {hasDescription && (
            <>
              <h2 className="text-2xl font-serif mb-4">About this Project</h2>
              <p className="text-gray-300 mb-6">{project.description}</p>
            </>
          )}

          {hasSpecialNotes && (
            <div className="mb-8">
              <h3 className="text-xl font-serif mb-2">What made this special</h3>
              <p className="text-gray-300">{project.special_notes}</p>
            </div>
          )}

          {project.video_url && (
            <a
              href={project.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 border border-white rounded-full text-white hover:bg-white hover:text-black transition-colors"
            >
              View Original <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      )}

      {/* BTS Gallery - clustered around with proper aspect ratios */}
      {btsImages.length > 0 && (
        <div className="mb-16">
          <h3 className="text-2xl font-serif mb-6 text-center">Behind the Scenes</h3>
          <div className="bts-gallery-cluster">
            {btsImages.map((image) => (
              <div
                key={image.id}
                className={`bts-item ${image.size || "medium"} ${image.aspect_ratio || "landscape"}`}
                onClick={() => setSelectedBtsImage(image.image_url)}
              >
                <Image
                  src={image.image_url || "/placeholder.svg"}
                  alt={image.caption || "Behind the scenes"}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BTS Image Modal */}
      {selectedBtsImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedBtsImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <Image
              src={selectedBtsImage || "/placeholder.svg"}
              alt="Behind the scenes"
              width={1200}
              height={800}
              className="object-contain max-h-[90vh]"
            />
          </div>
        </div>
      )}
    </>
  )
}
