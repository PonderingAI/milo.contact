"use client"

import type React from "react"

import { useState, useRef } from "react"
import { ArrowRight } from "lucide-react"
import MediaSelector from "@/components/admin/media-selector"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent } from "@/components/ui/dialog"

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
      <div className={`rounded-xl bg-[#070a10] p-4 ${compact ? "text-sm" : ""}`}>
        <div className="space-y-2">
          {/* Browse Media button */}
          <button
            onClick={() => setShowMediaSelector(true)}
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

      {/* Media Selector Dialog */}
      <Dialog open={showMediaSelector} onOpenChange={setShowMediaSelector}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto bg-[#070a10] border-[#1a2030]">
          <MediaSelector onSelect={handleMediaSelect} mediaType={mediaType} buttonLabel="" currentValue="" />
        </DialogContent>
      </Dialog>
    </>
  )
}
