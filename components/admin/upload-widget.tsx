"use client"

import type React from "react"

import { useState, useRef } from "react"
import { ArrowRight } from "lucide-react"

interface UploadWidgetProps {
  onMediaBrowse: () => void
  onDeviceBrowse: () => void
  onUrlSubmit: (url: string) => void
  acceptedFileTypes?: string
  multiple?: boolean
  urlPlaceholder?: string
}

export default function UploadWidget({
  onMediaBrowse,
  onDeviceBrowse,
  onUrlSubmit,
  acceptedFileTypes = "image/*,video/*",
  multiple = false,
  urlPlaceholder = "Enter video URL...",
}: UploadWidgetProps) {
  const [url, setUrl] = useState("")
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

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      // This would normally handle file upload
      // For now, we'll just log the files
      console.log("Files selected:", files)

      // Reset the input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="rounded-2xl bg-[#121212] p-6">
      <div className="space-y-4">
        {/* Browse Media button */}
        <button
          onClick={onMediaBrowse}
          className="w-full py-4 rounded-xl bg-[#1a1a1a] hover:bg-[#222222] transition-colors text-gray-300 text-center text-lg"
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
            className="w-full py-4 px-4 pr-12 rounded-xl bg-[#1a1a1a] text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-700"
          />
          <button
            onClick={handleUrlSubmit}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
          >
            <ArrowRight size={24} />
          </button>
        </div>

        {/* Browse Device button */}
        <button
          onClick={triggerFileInput}
          className="w-full py-4 rounded-xl bg-[#1a1a1a] hover:bg-[#222222] transition-colors text-gray-300 text-center text-lg"
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
