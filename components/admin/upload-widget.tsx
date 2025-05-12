"use client"

import type React from "react"

import { useState, useRef } from "react"
import { ArrowRight } from "lucide-react"
import MediaSelector from "@/components/admin/media-selector"
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
}

export default function UploadWidget({
  onMediaSelect,
  onUrlSubmit,
  acceptedFileTypes = "image/*,video/*",
  multiple = false,
  urlPlaceholder = "Enter video URL...",
  folder = "projects",
  compact = false,
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
    setShowMediaSelector(true)
  }

  const handleMediaSelect = (selectedUrl: string) => {
    onMediaSelect(selectedUrl)
    setShowMediaSelector(false)
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
    <>
      <div className={`rounded-xl bg-blue-950/30 p-4 ${compact ? "text-sm" : ""}`}>
        <div className="space-y-2">
          {/* Browse Media button */}
          <button
            onClick={openMediaBrowser}
            className={`w-full ${compact ? "py-2" : "py-3"} rounded-lg bg-blue-900/50 hover:bg-blue-800/50 transition-colors text-blue-100 text-center ${compact ? "text-sm" : "text-base"}`}
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
              className={`w-full ${compact ? "py-2" : "py-3"} px-3 pr-10 rounded-lg bg-blue-900/30 text-blue-100 placeholder-blue-300/50 focus:outline-none focus:ring-1 focus:ring-blue-500 ${compact ? "text-sm" : "text-base"}`}
            />
            <button
              onClick={handleUrlSubmit}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-300 hover:text-blue-100"
            >
              <ArrowRight size={compact ? 18 : 22} />
            </button>
          </div>

          {/* Browse Device button */}
          <button
            onClick={triggerFileInput}
            className={`w-full ${compact ? "py-2" : "py-3"} rounded-lg bg-blue-900/50 hover:bg-blue-800/50 transition-colors text-blue-100 text-center ${compact ? "text-sm" : "text-base"}`}
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

      {/* Media Selector Modal */}
      {showMediaSelector && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-blue-950 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-blue-800 flex justify-between items-center">
              <h2 className="text-xl font-medium">Select Media</h2>
              <button onClick={() => setShowMediaSelector(false)} className="text-blue-300 hover:text-blue-100">
                Close
              </button>
            </div>
            <div className="p-4">
              <MediaSelector onSelect={handleMediaSelect} mediaType="all" buttonLabel="Select" />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
