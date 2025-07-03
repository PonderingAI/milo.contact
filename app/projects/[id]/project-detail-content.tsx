"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Play, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import VideoPlayer from "@/components/video-player"
import BTSLightbox from "@/components/bts-lightbox"
import { extractVideoInfo } from "@/lib/project-data"
import { useMediaQuery } from "@/hooks/use-media-query"

interface BTSMedia {
  id: string
  image_url: string
  caption?: string
  is_video?: boolean
  video_url?: string
  video_platform?: string
  video_id?: string
}

interface MainMedia {
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
    main_media?: MainMedia[]
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
  
  // Main media state
  const [currentMainMediaIndex, setCurrentMainMediaIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const mainRef = useRef<HTMLDivElement>(null)
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Touch navigation state for main media
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // UI visibility state for main media
  const [showMainMediaUI, setShowMainMediaUI] = useState(true)
  const mainMediaUITimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Reset UI visibility timer
  const resetMainMediaUITimer = () => {
    setShowMainMediaUI(true)
    if (mainMediaUITimeoutRef.current) {
      clearTimeout(mainMediaUITimeoutRef.current)
    }
    mainMediaUITimeoutRef.current = setTimeout(() => {
      setShowMainMediaUI(false)
    }, 1000) // Hide after 1 second of inactivity
  }

  // Touch handlers for main media navigation
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    if (combinedMainMedia.length <= 1 || !isMobile) return
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
    resetMainMediaUITimer()
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (!isMobile) return
    setTouchEnd(e.targetTouches[0].clientX)
    resetMainMediaUITimer()
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || combinedMainMedia.length <= 1 || !isMobile) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      setCurrentMainMediaIndex((prev) => (prev + 1) % combinedMainMedia.length)
    } else if (isRightSwipe) {
      setCurrentMainMediaIndex((prev) => (prev - 1 + combinedMainMedia.length) % combinedMainMedia.length)
    }
    
    resetMainMediaUITimer()
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (mainMediaUITimeoutRef.current) {
        clearTimeout(mainMediaUITimeoutRef.current)
      }
    }
  }, [])

  // Process BTS media to ensure they have proper video info
  const [btsMedia, setBtsMedia] = useState<BTSMedia[]>([])
  
  // Process main media to ensure they have proper video info
  const [mainMedia, setMainMedia] = useState<MainMedia[]>([])
  
  // Combined main media from main_media table and fallback to project.image/thumbnail_url
  const combinedMainMedia = useMemo(() => {
    const media: MainMedia[] = []
    
    // Add main media from database if available
    if (project.main_media && project.main_media.length > 0) {
      // Process main media and filter out duplicates based on video ID
      const seenVideoIds = new Set<string>()
      const seenImageUrls = new Set<string>()
      
      project.main_media.forEach((item) => {
        // For videos, check if we've already seen this video ID
        if (item.is_video && item.video_id) {
          const videoKey = `${item.video_platform}-${item.video_id}`
          if (!seenVideoIds.has(videoKey)) {
            seenVideoIds.add(videoKey)
            media.push(item)
          }
        } else if (!item.is_video) {
          // For images, check if we've already seen this image URL
          // Also skip if this image URL is already being used as a thumbnail for a video
          const isVideoThumbnail = project.main_media.some(
            (videoItem) => videoItem.is_video && videoItem.image_url === item.image_url
          )
          
          if (!seenImageUrls.has(item.image_url) && !isVideoThumbnail) {
            seenImageUrls.add(item.image_url)
            media.push(item)
          }
        }
      })
    } else {
      // Fallback to project.image and thumbnail_url for backward compatibility
      // For videos, only use the video (don't double-count with cover image)
      if (project.thumbnail_url && videoInfo) {
        media.push({
          id: 'main-video',
          image_url: project.thumbnail_url,
          is_video: true,
          video_platform: videoInfo.platform,
          video_id: videoInfo.id,
        })
      } else if (project.image) {
        // Only add cover image if there's no video
        media.push({
          id: 'cover-image',
          image_url: project.image,
          is_video: false,
        })
      }
    }
    
    return media
  }, [project.main_media, project.image, project.thumbnail_url, videoInfo])

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
        // If it's already properly processed, return as is
        if (media.is_video !== undefined && media.is_video && media.video_url) {
          return media
        }

        // Check if it has video metadata to construct video_url
        if (media.video_platform && media.video_id && !media.video_url) {
          let videoUrl = ""
          if (media.video_platform.toLowerCase() === "youtube") {
            videoUrl = `https://www.youtube.com/embed/${media.video_id}?autoplay=1&rel=0&modestbranding=1&mute=0`
          } else if (media.video_platform.toLowerCase() === "vimeo") {
            videoUrl = `https://player.vimeo.com/video/${media.video_id}?autoplay=1&title=0&byline=0&portrait=0&muted=0`
          }

          return {
            ...media,
            is_video: true,
            video_url: videoUrl,
          }
        }

        // Handle legacy detection (fallback for old data without is_video flag)
        const isVideo = media.video_url || (media.video_platform && media.video_id)
        
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

  const handleVideoError = useCallback(() => {
    console.error("Video failed to load")
    setVideoError(true)
  }, [])

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
    // Announce to screen readers
    announceToScreenReader(`Opened image ${index + 1} of ${btsMedia.length}`)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    // Return focus to the main content
    if (mainRef.current) {
      mainRef.current.focus()
    }
    // Announce to screen readers
    announceToScreenReader("Lightbox closed")
  }

  const navigateLightbox = useCallback(
    (direction: "next" | "prev") => {
      if (!btsMedia || btsMedia.length === 0) return

      const newIndex =
        direction === "next"
          ? (lightboxIndex + 1) % btsMedia.length
          : (lightboxIndex - 1 + btsMedia.length) % btsMedia.length

      setLightboxIndex(newIndex)

      // Announce to screen readers
      announceToScreenReader(`Image ${newIndex + 1} of ${btsMedia.length}`)
    },
    [btsMedia, lightboxIndex],
  )

  // Screen reader announcements
  const announceToScreenReader = (message: string) => {
    const announcement = document.getElementById("sr-announcement")
    if (announcement) {
      announcement.textContent = message
    }
  }

  // Handle mouse movement for auto-hide controls and region-based arrow display
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const width = rect.width
    const leftThird = width / 3
    const rightThird = width * 2 / 3

    setMousePosition({ x, y: e.clientY - rect.top })
    setShowControls(true)
    
    // Only show arrows on desktop and when there are multiple media items
    if (!isMobile && combinedMainMedia.length > 1) {
      setShowLeftArrow(x < leftThird && currentMainMediaIndex > 0)
      setShowRightArrow(x > rightThird && currentMainMediaIndex < combinedMainMedia.length - 1)
    }

    // Clear existing timeout
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current)
    }

    // Set new timeout to hide controls after 1.5 seconds
    hideControlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false)
      setShowLeftArrow(false)
      setShowRightArrow(false)
    }, 1500)
  }, [isMobile, combinedMainMedia.length, currentMainMediaIndex])

  const handleMouseLeave = useCallback(() => {
    setShowControls(false)
    setShowLeftArrow(false)
    setShowRightArrow(false)
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current)
    }
  }, [])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current)
      }
    }
  }, [])

  const formattedDate = project.project_date
    ? new Date(project.project_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null

  return (
    <>
      {/* Screen reader announcement area */}
      <div id="sr-announcement" className="sr-only" aria-live="polite" aria-atomic="true"></div>

      {/* Full viewport media section - only on mobile when media exists */}
      {isMobile && combinedMainMedia.length > 0 ? (
        <>
          {/* Full viewport main media + gallery section */}
          <div className="h-screen flex flex-col bg-black">
            {/* Main media area */}
            <div className="flex-1 relative bg-black">
              <div 
                className="w-full h-full relative bg-black"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onClick={() => isMobile && resetMainMediaUITimer()}
              >
                {combinedMainMedia[currentMainMediaIndex]?.is_video && combinedMainMedia[currentMainMediaIndex]?.video_platform && combinedMainMedia[currentMainMediaIndex]?.video_id ? (
                  <VideoPlayer
                    platform={combinedMainMedia[currentMainMediaIndex].video_platform!}
                    videoId={combinedMainMedia[currentMainMediaIndex].video_id!}
                    onError={handleVideoError}
                    autoplay={false}
                    useNativeControls={true}
                  />
                ) : (
                  <Image
                    src={combinedMainMedia[currentMainMediaIndex]?.image_url || "/placeholder.svg"}
                    alt={project.title}
                    fill
                    className="object-contain"
                    priority
                    sizes="100vw"
                  />
                )}
                
                {/* Media counter - auto-hide on mobile */}
                {combinedMainMedia.length > 1 && (
                  <div className={`absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-full text-white text-sm transition-opacity duration-300 ${
                    showMainMediaUI ? 'opacity-100' : 'opacity-0'
                  }`}>
                    {currentMainMediaIndex + 1} / {combinedMainMedia.length}
                  </div>
                )}
                
                {/* Mobile swipe indicator */}
                {combinedMainMedia.length > 1 && (
                  <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 px-3 py-1 rounded-full text-white text-sm transition-opacity duration-300 ${
                    showMainMediaUI ? 'opacity-100' : 'opacity-0'
                  }`}>
                    ← Swipe to navigate →
                  </div>
                )}
              </div>
            </div>
            
            {/* Bottom gallery - always visible */}
            {combinedMainMedia.length > 1 && (
              <div className="bg-black/90 backdrop-blur-sm border-t border-gray-800">
                <div className="flex gap-3 overflow-x-auto py-4 px-6 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent" style={{ scrollPadding: '0 24px' }}>
                  {combinedMainMedia.map((media, index) => (
                    <button
                      key={media.id || index}
                      className={`flex-shrink-0 w-16 h-16 relative rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                        index === currentMainMediaIndex 
                          ? 'border-blue-500 shadow-lg shadow-blue-500/25' 
                          : 'border-gray-700 hover:border-gray-500'
                      }`}
                      onClick={() => {
                        setCurrentMainMediaIndex(index)
                        resetMainMediaUITimer()
                      }}
                      aria-label={`View ${media.is_video ? 'video' : 'image'} ${index + 1}`}
                    >
                      <div className="relative w-full h-full">
                        <Image
                          src={media.image_url || "/placeholder.svg"}
                          alt={`${project.title} ${index + 1}`}
                          fill
                          className="object-contain"
                          sizes="64px"
                        />
                        {media.is_video && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white/90 rounded-full p-1.5">
                              <Play className="h-3 w-3 text-black" fill="currentColor" />
                            </div>
                          </div>
                        )}
                        {/* Active indicator */}
                        {index === currentMainMediaIndex && (
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full z-10"></div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Page content below the full viewport media section */}
          <div className="bg-gray-950 px-4 sm:px-6 lg:px-8 py-8">
            {/* Back button */}
            <div className="mb-6 sm:mb-8">
              <Button asChild variant="ghost" className="group">
                <Link
                  href="/projects"
                  className="flex items-center text-gray-400 hover:text-white"
                  aria-label="Back to Projects"
                >
                  <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  Back to Projects
                </Link>
              </Button>
            </div>

            {/* Project title and metadata */}
            <div className="mb-10 sm:mb-16">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 sm:mb-6">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">{project.title}</h1>

                {project.external_url && (
                  <Button asChild variant="outline" size="sm" className="self-start">
                    <a
                      href={project.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                      aria-label={`View ${project.title} project externally`}
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Project
                    </a>
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-gray-300">
                {project.category && <span>{project.category}</span>}
                {project.role && <span>{project.role}</span>}
                {formattedDate && <span>{formattedDate}</span>}
              </div>
            </div>

            {/* Project content in a two-column layout on larger screens */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12 mb-10 sm:mb-16">
              {/* Description column */}
              {project.description && (
                <div className="lg:col-span-2">
                  <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 pb-2 border-b border-gray-800">
                    About this project
                  </h2>
                  <div className="prose prose-invert prose-lg max-w-none">
                    <p className="text-gray-300 leading-relaxed">{project.description}</p>
                  </div>
                </div>
              )}

              {/* Special notes column */}
              {project.special_notes && (
                <div className="lg:col-span-1">
                  <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 pb-2 border-b border-gray-800">
                    Special Notes
                  </h2>
                  <div className="bg-gray-900/50 rounded-lg p-4 sm:p-6 border border-gray-800">
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">{project.special_notes}</p>
                    </div>
                  </div>

                  {/* Tags */}
                  {project.tags && project.tags.length > 0 && (
                    <div className="mt-6 sm:mt-8">
                      <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Tags</h3>
                      <div className="flex flex-wrap gap-3">
                        {project.tags.map((tag, index) => (
                          <span key={index} className="text-gray-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* BTS Images Section */}
            {btsMedia.length > 0 && (
              <div className="mb-10 sm:mb-16">
                <h2
                  className="text-xl sm:text-2xl font-semibold mb-6 sm:mb-8 pb-2 border-b border-gray-800"
                  id="bts-gallery"
                >
                  Behind the Scenes
                </h2>

                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {[1, 2, 3, 4].map((_, index) => (
                      <div key={index} className="rounded-lg bg-gray-800 animate-pulse">
                        <div className="aspect-video"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6" role="grid" aria-labelledby="bts-gallery">
                    {btsMedia.map((media, index) => (
                      <div
                        key={media.id || index}
                        className="cursor-pointer group relative rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-white"
                        onClick={() => openLightbox(index)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            openLightbox(index)
                          }
                        }}
                        tabIndex={0}
                        role="gridcell"
                        aria-label={`${media.caption || `Behind the scenes image ${index + 1}`}${media.is_video ? " (video)" : ""}`}
                      >
                        <div className="aspect-video relative">
                          <Image
                            src={media.image_url || "/placeholder.svg"}
                            alt=""
                            fill
                            className="object-contain transition-transform group-hover:scale-105 group-focus:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 45vw, 600px"
                          />

                          {/* Play button overlay for videos */}
                          {media.is_video && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 group-focus:bg-black/50 transition-colors">
                              <div className="rounded-full bg-white/20 p-3 sm:p-4 backdrop-blur-sm">
                                <Play className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="white" aria-hidden="true" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Caption overlay */}
                        {media.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 sm:p-3 transform transition-transform translate-y-full group-hover:translate-y-0 group-focus:translate-y-0">
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
        </>
      ) : (
        /* Desktop layout or mobile without media - original layout */
        <div className="w-full mb-8">
          {combinedMainMedia.length > 0 ? (
            <div className="relative">
              {/* Main media display */}
              <div 
                className="w-full aspect-video relative bg-black"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                {combinedMainMedia[currentMainMediaIndex]?.is_video && combinedMainMedia[currentMainMediaIndex]?.video_platform && combinedMainMedia[currentMainMediaIndex]?.video_id ? (
                  <VideoPlayer
                    platform={combinedMainMedia[currentMainMediaIndex].video_platform!}
                    videoId={combinedMainMedia[currentMainMediaIndex].video_id!}
                    onError={handleVideoError}
                    autoplay={false}
                    useNativeControls={true}
                  />
                ) : (
                  <Image
                    src={combinedMainMedia[currentMainMediaIndex]?.image_url || "/placeholder.svg"}
                    alt={project.title}
                    fill
                    className="object-contain"
                    priority
                    sizes="100vw"
                  />
                )}
                
                {/* Navigation arrows for multiple main media - desktop only */}
                {combinedMainMedia.length > 1 && (
                  <>
                    {showLeftArrow && (
                      <button
                        className={`absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 transition-opacity z-10 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white ${showControls ? 'opacity-100' : 'opacity-0'}`}
                        onClick={() => setCurrentMainMediaIndex((prev) => (prev - 1 + combinedMainMedia.length) % combinedMainMedia.length)}
                        aria-label="Previous media"
                      >
                        <ChevronLeft className="h-8 w-8 drop-shadow-lg" />
                      </button>
                    )}
                    {showRightArrow && (
                      <button
                        className={`absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 transition-opacity z-10 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-white ${showControls ? 'opacity-100' : 'opacity-0'}`}
                        onClick={() => setCurrentMainMediaIndex((prev) => (prev + 1) % combinedMainMedia.length)}
                        aria-label="Next media"
                      >
                        <ChevronRight className="h-8 w-8 drop-shadow-lg" />
                      </button>
                    )}
                  </>
                )}
                
                {/* Media counter */}
                {combinedMainMedia.length > 1 && showControls && (
                  <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-full text-white text-sm transition-opacity duration-300">
                    {currentMainMediaIndex + 1} / {combinedMainMedia.length}
                  </div>
                )}
              </div>
              
              {/* Thumbnail gallery for desktop */}
              {combinedMainMedia.length > 1 && (
                <div className="mt-6">
                  <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent px-6" style={{ scrollPadding: '0 24px' }}>
                    {combinedMainMedia.map((media, index) => (
                      <button
                        key={media.id || index}
                        className={`flex-shrink-0 w-16 h-16 relative rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          index === currentMainMediaIndex 
                            ? 'border-blue-500 shadow-lg shadow-blue-500/25' 
                            : 'border-gray-700 hover:border-gray-500'
                        }`}
                        onClick={() => setCurrentMainMediaIndex(index)}
                        aria-label={`View ${media.is_video ? 'video' : 'image'} ${index + 1}`}
                      >
                        <div className="relative w-full h-full">
                          <Image
                            src={media.image_url || "/placeholder.svg"}
                            alt={`${project.title} ${index + 1}`}
                            fill
                            className="object-contain"
                            sizes="64px"
                          />
                          {media.is_video && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-white/90 rounded-full p-1.5">
                                <Play className="h-3 w-3 text-black" fill="currentColor" />
                              </div>
                            </div>
                          )}
                          {/* Active indicator */}
                          {index === currentMainMediaIndex && (
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full z-10"></div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Fallback display if no main media
            <div className="w-full aspect-video relative bg-gray-800 flex items-center justify-center">
              <p className="text-gray-400">No media available</p>
            </div>
          )}
        </div>
      )}

      {/* Content with padding on smaller screens but full width on larger screens */}
      <div className={`px-4 sm:px-6 lg:px-8 ${isMobile && combinedMainMedia.length > 0 ? 'py-8' : ''}`}>
        {/* Only show content below if NOT in mobile media view */}
        {!(isMobile && combinedMainMedia.length > 0) && (
          <>
            {/* Back button */}
            <div className="mb-6 sm:mb-8">
              <Button asChild variant="ghost" className="group">
                <Link
                  href="/projects"
                  className="flex items-center text-gray-400 hover:text-white"
                  aria-label="Back to Projects"
                >
                  <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                  Back to Projects
                </Link>
              </Button>
            </div>

            {/* Project title and metadata */}
            <div className="mb-10 sm:mb-16">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 sm:mb-6">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold">{project.title}</h1>

                {project.external_url && (
                  <Button asChild variant="outline" size="sm" className="self-start">
                    <a
                      href={project.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                      aria-label={`View ${project.title} project externally`}
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Project
                    </a>
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-gray-300">
                {project.category && <span>{project.category}</span>}
                {project.role && <span>{project.role}</span>}
                {formattedDate && <span>{formattedDate}</span>}
              </div>
            </div>

            {/* Project content in a two-column layout on larger screens */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-12 mb-10 sm:mb-16">
              {/* Description column */}
              {project.description && (
                <div className="lg:col-span-2">
                  <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 pb-2 border-b border-gray-800">
                    About this project
                  </h2>
                  <div className="prose prose-invert prose-lg max-w-none">
                    <p className="text-gray-300 leading-relaxed">{project.description}</p>
                  </div>
                </div>
              )}

              {/* Special notes column */}
              {project.special_notes && (
                <div className="lg:col-span-1">
                  <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 pb-2 border-b border-gray-800">
                    Special Notes
                  </h2>
                  <div className="bg-gray-900/50 rounded-lg p-4 sm:p-6 border border-gray-800">
                    <div className="prose prose-invert max-w-none">
                      <p className="text-gray-300">{project.special_notes}</p>
                    </div>
                  </div>

                  {/* Tags */}
                  {project.tags && project.tags.length > 0 && (
                    <div className="mt-6 sm:mt-8">
                      <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Tags</h3>
                      <div className="flex flex-wrap gap-3">
                        {project.tags.map((tag, index) => (
                          <span key={index} className="text-gray-300">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* BTS Images Section */}
            {btsMedia.length > 0 && (
              <div className="mb-10 sm:mb-16">
                <h2
                  className="text-xl sm:text-2xl font-semibold mb-6 sm:mb-8 pb-2 border-b border-gray-800"
                  id="bts-gallery"
                >
                  Behind the Scenes
                </h2>

                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {[1, 2, 3, 4].map((_, index) => (
                      <div key={index} className="rounded-lg bg-gray-800 animate-pulse">
                        <div className="aspect-video"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6" role="grid" aria-labelledby="bts-gallery">
                    {btsMedia.map((media, index) => (
                      <div
                        key={media.id || index}
                        className="cursor-pointer group relative rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-white"
                        onClick={() => openLightbox(index)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            openLightbox(index)
                          }
                        }}
                        tabIndex={0}
                        role="gridcell"
                        aria-label={`${media.caption || `Behind the scenes image ${index + 1}`}${media.is_video ? " (video)" : ""}`}
                      >
                        <div className="aspect-video relative">
                          <Image
                            src={media.image_url || "/placeholder.svg"}
                            alt=""
                            fill
                            className="object-contain transition-transform group-hover:scale-105 group-focus:scale-105"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 45vw, 600px"
                          />

                          {/* Play button overlay for videos */}
                          {media.is_video && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 group-focus:bg-black/50 transition-colors">
                              <div className="rounded-full bg-white/20 p-3 sm:p-4 backdrop-blur-sm">
                                <Play className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="white" aria-hidden="true" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Caption overlay */}
                        {media.caption && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 sm:p-3 transform transition-transform translate-y-full group-hover:translate-y-0 group-focus:translate-y-0">
                            <p className="text-sm text-white">{media.caption}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* BTS Lightbox */}
      {lightboxOpen && (
        <BTSLightbox
          media={btsMedia}
          initialIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={closeLightbox}
          onNavigate={navigateLightbox}
          isMobile={isMobile}
        />
      )}

    </>
  )
}
