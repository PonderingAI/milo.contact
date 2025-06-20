"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight, Play } from "lucide-react"

interface BTSMedia {
  id: string
  image_url: string
  caption?: string
  is_video?: boolean
  video_url?: string
}

interface BTSLightboxProps {
  media: BTSMedia[]
  initialIndex: number
  isOpen: boolean
  onClose: () => void
  onNavigate?: (direction: "next" | "prev") => void
  isMobile?: boolean
}

export default function BTSLightbox({
  media,
  initialIndex,
  isOpen,
  onClose,
  onNavigate,
  isMobile = false,
}: BTSLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isLoading, setIsLoading] = useState(true)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

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

  // Reset video playing state when index changes
  useEffect(() => {
    setIsVideoPlaying(false)
  }, [currentIndex])

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
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-title"
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

      {/* Swipe instructions for mobile */}
      {isMobile && media.length > 1 && (
        <div className="absolute bottom-20 left-0 right-0 text-center text-white text-sm opacity-70">
          Swipe left or right to navigate
        </div>
      )}

      {/* Media container */}
      <div className="relative w-full max-w-5xl max-h-[90vh] px-4">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {isVideo ? (
          <div className="relative aspect-video">
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
                <div className="relative aspect-video w-full">
                  <Image
                    src={currentMedia.image_url || "/placeholder.svg"}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 80vw"
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
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={currentMedia.caption || "Behind the scenes video"}
              />
            )}
          </div>
        ) : (
          <div className="relative aspect-video">
            <Image
              src={currentMedia.image_url || "/placeholder.svg"}
              alt={currentMedia.caption || `Behind the scenes ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 80vw"
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
