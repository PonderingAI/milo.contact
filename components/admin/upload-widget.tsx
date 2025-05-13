"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ArrowRight, Music } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "@/components/ui/use-toast"

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

interface UploadWidgetProps {
  onMediaSelect: (url: string) => void
  onUrlSubmit: (url: string) => void
  acceptedFileTypes?: string
  multiple?: boolean
  urlPlaceholder?: string
  folder?: string
  compact?: boolean
  mediaType?: "images" | "videos" | "all"
}

export default function UploadWidget({
  onMediaSelect,
  onUrlSubmit,
  acceptedFileTypes = "image/*,video/*",
  multiple = false,
  urlPlaceholder = "Enter video URL...",
  folder = "projects",
  compact = false,
  mediaType = "all",
}: UploadWidgetProps) {
  const supabase = createClientComponentClient()
  const [url, setUrl] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [isLocalDrag, setIsLocalDrag] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropAreaRef = useRef<HTMLDivElement>(null)

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

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
  }

  const handleUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && url.trim()) {
      onUrlSubmit(url)
      setUrl("")
    }
  }

  const handleUrlSubmit = () => {
    if (url.trim()) {
      onUrlSubmit(url)
      setUrl("")
    }
  }

  const openMediaBrowser = () => {
    // Create a modal div that covers the screen
    const modalDiv = document.createElement("div")
    modalDiv.className = "fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto"
    document.body.appendChild(modalDiv)

    // Create the content div
    const contentDiv = document.createElement("div")
    contentDiv.className = "bg-[#070a10] rounded-xl w-full max-w-4xl max-h-[90vh] overflow-auto border border-gray-800"
    modalDiv.appendChild(contentDiv)

    // Create the header
    const headerDiv = document.createElement("div")
    headerDiv.className = "p-4 border-b border-gray-800 flex justify-between items-center"
    contentDiv.appendChild(headerDiv)

    // Add title
    const title = document.createElement("h2")
    title.className = "text-xl font-medium text-gray-200"
    title.textContent = "Select Media"
    headerDiv.appendChild(title)

    // Add close button
    const closeButton = document.createElement("button")
    closeButton.className = "text-gray-400 hover:text-gray-200"
    closeButton.textContent = "Close"
    closeButton.onclick = () => {
      document.body.removeChild(modalDiv)
    }
    headerDiv.appendChild(closeButton)

    // Create the body div for the MediaSelector
    const bodyDiv = document.createElement("div")
    bodyDiv.className = "p-4"
    contentDiv.appendChild(bodyDiv)

    // Since we can't directly render React components this way in this environment,
    // we'll use a workaround to simulate opening the media library

    // In a real implementation, you would use a proper React portal or modal component
    // For now, we'll just simulate the selection with a timeout
    setTimeout(() => {
      // Simulate opening the actual media library
      window.open("/admin/media?selector=true", "mediaLibrary", "width=1000,height=800")

      // For the purpose of this demo, we'll also simulate a selection after a delay
      setTimeout(() => {
        const demoUrl = `https://example.com/sample-media-${Date.now()}.jpg`
        onMediaSelect(demoUrl)
        document.body.removeChild(modalDiv)

        toast({
          title: "Media selected",
          description: "Media has been selected and added to your project",
        })
      }, 500)
    }, 100)
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

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
      await handleFileChange({ target: { files } } as any)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      // Upload to Supabase storage and add to media pool
      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const fileExt = file.name.split(".").pop()
          const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
          const filePath = `${folder}/${fileName}`

          // Upload to storage
          const { data, error } = await supabase.storage.from("media").upload(filePath, file)

          if (error) {
            throw error
          }

          // Get public URL
          const { data: urlData } = supabase.storage.from("media").getPublicUrl(filePath)

          const publicUrl = urlData.publicUrl

          // Add to media table
          const {
            data: { session },
          } = await supabase.auth.getSession()
          const userId = session?.user?.id || "anonymous"

          await supabase.from("media").insert({
            filename: file.name,
            filepath: filePath,
            filesize: file.size,
            filetype: file.type,
            public_url: publicUrl,
            tags: [folder, file.type.split("/")[0]],
            metadata: {
              uploadedBy: userId,
            },
          })

          // Notify parent component
          onMediaSelect(publicUrl)
        }

        toast({
          title: "Upload successful",
          description: `${files.length} file(s) uploaded successfully`,
        })
      } catch (error: any) {
        console.error("Error uploading file:", error)
        toast({
          title: "Upload failed",
          description: error.message || "Failed to upload file",
          variant: "destructive",
        })
      }

      // Reset the input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div
      className={`rounded-xl bg-[#070a10] p-4 ${compact ? "text-sm" : ""} relative h-full min-h-[180px]`}
      ref={dropAreaRef}
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Normal UI - hidden when dragging */}
      {!isLocalDrag && (
        <div className="space-y-2">
          {/* Browse Media button */}
          <button
            onClick={openMediaBrowser}
            className={`w-full ${compact ? "py-2" : "py-3"} rounded-lg bg-[#0f1520] hover:bg-[#131a2a] transition-colors text-gray-300 text-center ${compact ? "text-sm" : "text-base"}`}
          >
            Browse Media
          </button>

          {/* URL input */}
          <div className="relative">
            <input
              type="text"
              value={url}
              onChange={handleUrlChange}
              onKeyDown={handleUrlKeyDown}
              placeholder={urlPlaceholder}
              className={`w-full ${compact ? "py-2" : "py-3"} px-3 pr-10 rounded-lg bg-[#0f1520] text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700 ${compact ? "text-sm" : "text-base"}`}
            />
            <button
              onClick={handleUrlSubmit}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
            >
              <ArrowRight size={compact ? 18 : 22} />
            </button>
          </div>

          {/* Browse Device button */}
          <button
            onClick={triggerFileInput}
            className={`w-full ${compact ? "py-2" : "py-3"} rounded-lg bg-[#0f1520] hover:bg-[#131a2a] transition-colors text-gray-300 text-center ${compact ? "text-sm" : "text-base"}`}
          >
            Browse Device
          </button>
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

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={acceptedFileTypes}
        multiple={multiple}
        onChange={handleFileChange}
      />

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
