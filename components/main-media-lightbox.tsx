"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight, Play } from "lucide-react"

interface MainMedia {
  id: string
  image_url: string
  caption?: string
  is_video?: boolean
  video_url?: string
}

interface MainMediaLightboxProps {
  media: MainMedia[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
  onNavigate?: (direction: "next" | "prev") => void
  isMobile?: boolean
}

export default function MainMediaLightbox({
  media,
  initialIndex,
  isOpen,
  onClose,
  onNavigate,
  isMobile = false,
}: MainMediaLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isLoading, setIsLoading] = useState(true)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Touch handling for mobile swiping
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Focus trap management
  useEffect(() => {
    if (isOpen) {
      // Focus the close button when the lightbox opens
      setTimeout(() => {
        if (closeButtonRef.current) {
          closeButtonRef.current.focus()
        }
      }, 100)
    }
  }, [isOpen])

  // Reset loading state when media changes
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      // Simulate loading completion
      const timer = setTimeout(() => setIsLoading(false), 500)
      return () => clearTimeout(timer)
    }
  }, [currentIndex, isOpen])

  // Reset video playing state when index changes and auto-play videos
  useEffect(() => {
    const currentMedia = media[currentIndex]
    const isVideo = currentMedia?.is_video && currentMedia?.video_url
    setIsVideoPlaying(isVideo) // Auto-play videos, show static images immediately
  }, [currentIndex, media])

  // Auto-play video when lightbox initially opens
  useEffect(() => {
    if (isOpen) {
      const currentMedia = media[currentIndex]
      const isVideo = currentMedia?.is_video && currentMedia?.video_url
      if (isVideo) {
        setIsVideoPlaying(true)
      }
    }
  }, [isOpen, currentIndex, media])

  const navigate = useCallback(
    (direction: "next" | "prev") => {
      if (media.length <= 1) return

      const newIndex =
        direction === "next" ? (currentIndex + 1) % media.length : (currentIndex - 1 + media.length) % media.length

      setCurrentIndex(newIndex)

      // Use the parent's navigate function if provided
      if (onNavigate) {
        onNavigate(direction)
      }
    },
    [media.length, currentIndex, onNavigate],
  )

  // Touch event handlers for mobile swiping - only when not playing video
  const handleTouchStart = (e: React.TouchEvent) => {
    const currentMedia = media[currentIndex]
    const isVideo = currentMedia?.is_video && currentMedia?.video_url
    
    // Don't handle touch events if video is playing to avoid interference
    if (isVideo && isVideoPlaying) return
    
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentMedia = media[currentIndex]
    const isVideo = currentMedia?.is_video && currentMedia?.video_url
    
    // Don't handle touch events if video is playing to avoid interference
    if (isVideo && isVideoPlaying) return
    
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    const currentMedia = media[currentIndex]
    const isVideo = currentMedia?.is_video && currentMedia?.video_url
    
    // Don't handle touch events if video is playing to avoid interference
    if (isVideo && isVideoPlaying) return
    
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && media.length > 1) {
      navigate("next")
    } else if (isRightSwipe && media.length > 1) {
      navigate("prev")
    }
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "ArrowRight") {
        navigate("next")
      } else if (e.key === "ArrowLeft") {
        navigate("prev")
      } else if (e.key === "Tab") {
        // Trap focus within the lightbox
        if (!containerRef.current) return

        const focusableElements = containerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )

        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0] as HTMLElement
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, navigate, onClose])

  // Prevent scrolling when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!isOpen || media.length === 0) return null

  const currentMedia = media[currentIndex]
  const isVideo = currentMedia.is_video && currentMedia.video_url

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-title"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        ref={closeButtonRef}
        className="absolute top-4 right-4 text-white p-2 rounded-full bg-black/50 hover:bg-black/70 z-10 focus:outline-none focus:ring-2 focus:ring-white"
        onClick={onClose}
        aria-label="Close lightbox"
      >
        <X className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Navigation buttons - only show on non-mobile or if explicitly requested */}
      {media.length > 1 && !isMobile && (
        <>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 rounded-full bg-black/50 hover:bg-black/70 z-10 focus:outline-none focus:ring-2 focus:ring-white"
            onClick={() => navigate("prev")}
            aria-label="Previous image"
          >
            <ChevronLeft className="h-8 w-8" aria-hidden="true" />
          </button>

          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 rounded-full bg-black/50 hover:bg-black/70 z-10 focus:outline-none focus:ring-2 focus:ring-white"
            onClick={() => navigate("next")}
            aria-label="Next image"
          >
            <ChevronRight className="h-8 w-8" aria-hidden="true" />
          </button>
        </>
      )}

      {/* Counter indicator */}
      <div className="absolute top-4 left-4 bg-black/50 px-3 py-1 rounded-full text-white text-sm" id="lightbox-title">
        {currentIndex + 1} / {media.length}
        {currentMedia.is_video && <span className="ml-2">(Video)</span>}
      </div>

      {/* Swipe instructions for mobile - only show when not playing video */}
      {isMobile && media.length > 1 && !(isVideo && isVideoPlaying) && (
        <div className="absolute bottom-20 left-0 right-0 text-center text-white text-sm opacity-70">
          Swipe left or right to navigate
        </div>
      )}

      {/* Media container - main media should fill screen on mobile */}
      <div className={`relative ${isMobile ? 'w-full h-full' : 'w-full h-full max-w-[95vw] max-h-[95vh]'} flex items-center justify-center`}>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {isVideo ? (
          <div className="relative w-full h-full">
            {!isVideoPlaying ? (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
                onClick={() => setIsVideoPlaying(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    setIsVideoPlaying(true)
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label="Play video"
              >
                <div className="relative w-full h-full">
                  <Image
                    src={currentMedia.image_url || "/placeholder.svg"}
                    alt=""
                    fill
                    className={isMobile ? "object-cover" : "object-contain"}
                    sizes={isMobile ? "100vw" : "95vw"}
                    priority
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="rounded-full bg-white/20 p-6 backdrop-blur-sm">
                      <Play className="h-12 w-12 text-white" fill="white" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <iframe
                src={currentMedia.video_url}
                className="w-full h-full min-h-[70vh]"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={currentMedia.caption || "Main media video"}
              />
            )}
          </div>
        ) : (
          <div className="relative w-full h-full">
            <Image
              src={currentMedia.image_url || "/placeholder.svg"}
              alt={currentMedia.caption || `Main media ${currentIndex + 1}`}
              fill
              className={isMobile ? "object-cover" : "object-contain"}
              sizes={isMobile ? "100vw" : "95vw"}
              priority
            />
          </div>
        )}

        {/* Caption */}
        {currentMedia.caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-4">
            <p className="text-white">{currentMedia.caption}</p>
          </div>
        )}
      </div>
    </div>
  )
}
