"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Upload, ArrowRight, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import MediaSelector from "./media-selector"
import { Progress } from "@/components/ui/progress"

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
  const [videoUrl, setVideoUrl] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [totalFiles, setTotalFiles] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropAreaRef = useRef<HTMLDivElement>(null)

  // Listen for global drag events
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
    }

    document.addEventListener("dragover", handleDragOver)
    document.addEventListener("drop", handleDrop)

    return () => {
      document.removeEventListener("dragover", handleDragOver)
      document.removeEventListener("drop", handleDrop)
    }
  }, [])

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    // Check if we're leaving the actual drop target (not a child element)
    const relatedTarget = e.relatedTarget as Node
    if (dropAreaRef.current && !dropAreaRef.current.contains(relatedTarget)) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    // Set the drop effect
    e.dataTransfer.dropEffect = "copy"
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      await handleFileUpload(files)
    }
  }

  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return

    try {
      setIsUploading(true)
      setTotalFiles(files.length)
      setUploadedFiles(0)
      setUploadProgress(0)

      // Show upload in progress toast
      const toastId = toast({
        title: "Upload in progress",
        description: `Uploading ${files.length} file(s) to ${title}...`,
      }).id

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
          setUploadedFiles((prev) => prev + 1)
          setUploadProgress(Math.round(((i + 1) / files.length) * 100))
        } else {
          throw new Error(result.error || "Unknown error during upload")
        }
      }

      // Call the onMediaSelect with all uploaded URLs
      if (uploadedUrls.length > 0) {
        onMediaSelect(uploadedUrls)

        toast({
          id: toastId,
          title: "Upload successful",
          description: `${files.length} file(s) uploaded to ${title}`,
        })
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
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
        ref={dropAreaRef}
        className={`rounded-xl bg-[#070a10] p-4 relative min-h-[180px] ${
          isDragging ? "ring-2 ring-blue-500 bg-[#0a101e]" : ""
        } transition-all duration-200`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Normal UI - shown when not dragging and not uploading */}
        {!isDragging && !isUploading && (
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
                  <ArrowRight size={18} />
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

        {/* Upload Progress UI */}
        {isUploading && (
          <div className="absolute inset-0 rounded-xl bg-[#0a101e]/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-6">
            <Loader2 className="h-8 w-8 text-blue-400 mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-white mb-2">Uploading to {title}...</h3>
            <div className="w-full max-w-md mb-2">
              <Progress value={uploadProgress} className="h-2" />
            </div>
            <p className="text-gray-300 text-sm">
              {uploadedFiles} of {totalFiles} files ({uploadProgress}%)
            </p>
          </div>
        )}

        {/* Drop UI - shown when dragging */}
        {isDragging && (
          <div className="absolute inset-0 rounded-xl border-2 border-dashed border-blue-500 bg-[#0a101e]/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
            <div className="bg-[#131a2a] p-6 rounded-lg shadow-lg flex flex-col items-center">
              <Upload className="h-10 w-10 text-blue-400 mb-3" />
              <h3 className="text-xl font-bold text-white mb-1">Drop in {title}</h3>
              <p className="text-gray-300 text-center text-sm">
                Files will be added to the {title.toLowerCase()} section
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
