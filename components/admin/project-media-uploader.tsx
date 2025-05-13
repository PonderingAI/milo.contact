"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Music, Upload } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import MediaSelector from "./media-selector"

// Global state to track if any file is being dragged over the document
let globalDragging = false
let dragCounter = 0
const dragListeners: ((isDragging: boolean) => void)[] = []

// Function to notify all listeners about drag state changes
function notifyDragListeners(isDragging: boolean) {
  globalDragging = isDragging
  dragListeners.forEach((listener) => listener(isDragging))
}

// Add global document drag event listeners (only once)
if (typeof window !== "undefined") {
  document.addEventListener("dragenter", (e) => {
    e.preventDefault()
    dragCounter++
    if (dragCounter === 1) {
      notifyDragListeners(true)
    }
  })

  document.addEventListener("dragleave", (e) => {
    e.preventDefault()
    dragCounter--
    if (dragCounter === 0) {
      notifyDragListeners(false)
    }
  })

  document.addEventListener("dragover", (e) => {
    e.preventDefault()
  })

  document.addEventListener("drop", (e) => {
    e.preventDefault()
    dragCounter = 0
    notifyDragListeners(false)
  })
}

interface ProjectMediaUploaderProps {
  title: string
  onMediaSelect: (url: string | string[]) => void
  onVideoUrlSubmit?: (url: string) => void
  compact?: boolean
  mediaType?: "all" | "images" | "videos"
  folder?: string
}

export default function ProjectMediaUploader({
  title,
  onMediaSelect,
  onVideoUrlSubmit,
  compact = false,
  mediaType = "all",
  folder = "projects",
}: ProjectMediaUploaderProps) {
  const supabase = createClientComponentClient()
  const [isDragging, setIsDragging] = useState(false)
  const [isLocalDrag, setIsLocalDrag] = useState(false)
  const [videoUrl, setVideoUrl] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Subscribe to global drag events
  useEffect(() => {
    const handleGlobalDrag = (isDragging: boolean) => {
      setIsDragging(isDragging)
    }

    dragListeners.push(handleGlobalDrag)

    return () => {
      // Remove this component's listener when unmounted
      const index = dragListeners.indexOf(handleGlobalDrag)
      if (index > -1) {
        dragListeners.splice(index, 1)
      }
    }
  }, [])

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsLocalDrag(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsLocalDrag(false)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsLocalDrag(false)
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      await handleFileUpload(files)
    }
  }

  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return

    try {
      // Show upload in progress toast
      toast({
        title: "Upload in progress",
        description: `Uploading ${files.length} file(s)...`,
      })

      const uploadedUrls: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Create a FormData object
        const formDataUpload = new FormData()
        formDataUpload.append("file", file)

        // Upload the file using the bulk-upload endpoint which handles WebP conversion
        const response = await fetch("/api/bulk-upload", {
          method: "POST",
          body: formDataUpload,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to upload file")
        }

        const result = await response.json()
        console.log("Upload result:", result)

        if (result.success) {
          uploadedUrls.push(result.publicUrl)
        } else {
          throw new Error(result.error || "Unknown error during upload")
        }
      }

      // Call the onMediaSelect with all uploaded URLs
      if (uploadedUrls.length > 0) {
        onMediaSelect(uploadedUrls)

        toast({
          title: "Upload successful",
          description: `${files.length} file(s) uploaded successfully`,
        })
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      })
    }
  }

  const handleVideoUrlSubmit = () => {
    if (videoUrl.trim() && onVideoUrlSubmit) {
      onVideoUrlSubmit(videoUrl)
      setVideoUrl("")
    }
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium mb-2 text-gray-400">{title}</h2>

      <div
        className={`rounded-xl bg-[#070a10] p-4 relative min-h-[180px]`}
        onDragEnter={handleDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Normal UI - hidden when dragging */}
        {!isLocalDrag && (
          <div className="space-y-2">
            {/* Media Selector */}
            <MediaSelector
              onSelect={onMediaSelect}
              mediaType={mediaType}
              multiple={true}
              buttonLabel="Browse Media Library"
            />

            {/* URL input - only show if onVideoUrlSubmit is provided */}
            {onVideoUrlSubmit && (
              <div className="relative">
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && videoUrl.trim()) {
                      e.preventDefault()
                      handleVideoUrlSubmit()
                    }
                  }}
                  placeholder="Enter video URL..."
                  className="w-full py-2 px-3 pr-10 rounded-lg bg-[#0f1520] text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700 text-sm"
                />
                <button
                  type="button"
                  onClick={handleVideoUrlSubmit}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  <Upload size={18} className="rotate-90" />
                </button>
              </div>
            )}

            {/* Browse Device button */}
            <label className="w-full py-2 rounded-lg bg-[#0f1520] hover:bg-[#131a2a] transition-colors text-gray-300 text-center text-sm cursor-pointer block">
              Browse Device
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={mediaType === "images" ? "image/*" : mediaType === "videos" ? "video/*" : "image/*,video/*"}
                multiple
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileUpload(e.target.files)
                    e.target.value = "" // Reset input
                  }
                }}
              />
            </label>
          </div>
        )}

        {/* Local drag overlay - replaces the normal UI */}
        {isLocalDrag && (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/90 to-blue-600/90 rounded-xl flex flex-col items-center justify-center z-10 transition-all duration-300 ease-in-out animate-pulse">
            <Music className="h-12 w-12 text-white mb-3 animate-bounce" />
            <h3 className="text-2xl font-bold text-white mb-1">Drop it like it's hot!</h3>
            <p className="text-white/80 text-center">Release to upload your files</p>
          </div>
        )}
      </div>

      {/* Global drag overlay - appears when dragging anywhere on the page */}
      {isDragging && !isLocalDrag && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="bg-gradient-to-br from-purple-600/90 to-blue-600/90 p-8 rounded-xl max-w-lg w-full animate-pulse">
            <div className="flex flex-col items-center">
              <Music className="h-16 w-16 text-white mb-4 animate-bounce" />
              <h3 className="text-3xl font-bold text-white mb-2">Drop it like it's hot!</h3>
              <p className="text-white/80 text-center">Release to upload your files</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
