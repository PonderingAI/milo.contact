"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MediaSelector } from "@/components/admin/media-selector"
import { extractVideoInfo } from "@/lib/utils"
import { X, Upload, Link, ImageIcon } from "lucide-react"

interface UnifiedMediaInputProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  accept?: string
  maxSize?: number
  label?: string
  description?: string
  className?: string
  showImages?: boolean
  showVideos?: boolean
  multiple?: boolean
}

export function UnifiedMediaInput({
  value,
  onChange,
  onBlur,
  placeholder = "Enter URL or upload file",
  accept = "image/*,video/*",
  maxSize = 10 * 1024 * 1024, // 10MB default
  label = "Media",
  description = "Upload an image or video, or enter a URL",
  className = "",
  showImages = true,
  showVideos = true,
  multiple = false,
}: UnifiedMediaInputProps) {
  const [urlInput, setUrlInput] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      handleFileUpload(file)
    }
  }, [])

  const handleFileUpload = async (file: File) => {
    if (file.size > maxSize) {
      alert(`File size exceeds the maximum allowed size of ${maxSize / (1024 * 1024)}MB`)
      return
    }

    // In a real implementation, you would upload the file to your server or storage
    // For now, we'll just create a local URL for the file
    const localUrl = URL.createObjectURL(file)
    onChange(localUrl)

    if (onBlur) onBlur()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0])
    }
  }

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      // Check if it's a video URL
      const videoInfo = extractVideoInfo(urlInput)
      if (videoInfo) {
        onChange(videoInfo.url)
      } else {
        onChange(urlInput)
      }
      setUrlInput("")
    }

    if (onBlur) onBlur()
  }

  const handleUrlInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleUrlSubmit()
    }
  }

  const handleMediaSelect = (mediaUrl: string | string[]) => {
    // Handle both single and multiple selections
    if (Array.isArray(mediaUrl)) {
      if (mediaUrl.length > 0) {
        onChange(mediaUrl[0]) // For now, just use the first one
      }
    } else {
      onChange(mediaUrl)
    }

    setIsDialogOpen(false)
    if (onBlur) onBlur()
  }

  const clearValue = () => {
    onChange("")
    if (onBlur) onBlur()
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <div className="text-sm font-medium">{label}</div>}

      <div
        className={`border rounded-md p-4 h-[140px] flex flex-col justify-between transition-colors ${
          isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20" : "border-gray-200 dark:border-gray-800"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Top section - Current value or upload prompt */}
        <div className="flex items-center justify-between">
          {value ? (
            <div className="flex items-center gap-2 text-sm truncate max-w-full">
              <ImageIcon className="h-4 w-4 text-gray-500" />
              <span className="truncate">{value}</span>
            </div>
          ) : (
            <span className="text-sm text-gray-500">Drag and drop or select a file</span>
          )}

          {value && (
            <Button variant="ghost" size="icon" onClick={clearValue} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Middle section - URL input */}
        <div className="flex items-center gap-2 my-2 relative">
          <div className="h-px bg-gray-200 dark:bg-gray-800 flex-grow" />
          <span className="text-xs text-gray-500">OR</span>
          <div className="h-px bg-gray-200 dark:bg-gray-800 flex-grow" />
        </div>

        <div className="flex gap-2">
          <Input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={handleUrlInputKeyDown}
            placeholder="Enter media URL"
            className="h-8 text-sm"
          />
          <Button onClick={handleUrlSubmit} size="sm" variant="outline" className="h-8 px-2">
            <Link className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">Add URL</span>
          </Button>
        </div>

        {/* Bottom section - Action buttons */}
        <div className="flex justify-between items-center mt-2">
          <input type="file" ref={fileInputRef} onChange={handleFileInputChange} accept={accept} className="hidden" />

          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-8 px-2">
            <Upload className="h-3.5 w-3.5 mr-1" />
            <span className="text-xs">Upload</span>
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" className="h-8 px-2">
                <ImageIcon className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">Browse Media</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Select Media</DialogTitle>
              </DialogHeader>
              <MediaSelector
                onSelect={handleMediaSelect}
                showImages={showImages}
                showVideos={showVideos}
                multiple={multiple}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {description && <p className="text-xs text-gray-500">{description}</p>}
    </div>
  )
}

export default UnifiedMediaInput
