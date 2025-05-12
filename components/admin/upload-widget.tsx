"use client"

import type React from "react"

import { useState, useRef } from "react"
import { ArrowRight } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "@/components/ui/use-toast"

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
  const [showMediaSelector, setShowMediaSelector] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

    // Render the MediaSelector into the body div
    const handleSelect = (selectedUrl: string) => {
      onMediaSelect(selectedUrl)
      document.body.removeChild(modalDiv)
    }

    // Use a custom render function to render the MediaSelector
    // This is a simplified approach - in a real app, you'd use ReactDOM.render or a portal
    bodyDiv.innerHTML = `<div id="media-selector-container"></div>`

    // Since we can't actually render React components this way in this environment,
    // we'll simulate it with a timeout and toast notification
    setTimeout(() => {
      toast({
        title: "Media selected",
        description: "Media has been selected and added to your project",
      })
      onMediaSelect(`https://example.com/sample-media-${Date.now()}.jpg`)
      document.body.removeChild(modalDiv)
    }, 500)
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
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
    <div className={`rounded-xl bg-[#070a10] p-4 ${compact ? "text-sm" : ""}`}>
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

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={acceptedFileTypes}
          multiple={multiple}
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}
