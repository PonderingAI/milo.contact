"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UploadCloud, ArrowRight } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import MediaSelector from "./media-selector" // Import the correct component for media browsing

interface UnifiedMediaInputProps {
  identifier: string
  onMediaAdded: (urls: string[]) => void
  onVideoUrlSubmit: (url: string) => void
  isLoading?: boolean
  className?: string
  folder?: string
}

async function calculateFileHashClient(file: File): Promise<string> {
  const subtle = window.crypto.subtle
  const buffer = await file.arrayBuffer()
  const digest = await subtle.digest("SHA-256", buffer)

  // Convert the ArrayBuffer to a string
  const hashArray = Array.from(new Uint8Array(digest))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return hashHex
}

export default function UnifiedMediaInput({
  identifier,
  onMediaAdded,
  onVideoUrlSubmit,
  isLoading = false,
  className = "",
  folder = "default-folder",
}: UnifiedMediaInputProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [videoUrlInput, setVideoUrlInput] = useState("")
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(true)
  }

  const processFilesForUpload = async (files: FileList | File[]) => {
    const validFiles = Array.from(files)
    if (validFiles.length === 0) return

    setIsUploading(true)
    const processedUrls: string[] = []
    let filesProcessedCount = 0
    let filesFailedCount = 0

    try {
      for (const file of validFiles) {
        try {
          // 1. Calculate SHA-256 hash
          const fileHash = await calculateFileHashClient(file)

          // 2. Check for client-side duplicate
          const checkDupResponse = await fetch("/api/check-media-duplicate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fileHash, filename: file.name, folder }),
          })

          if (checkDupResponse.ok) {
            const dupData = await checkDupResponse.json()
            if (dupData.isDuplicate && dupData.existingItem?.public_url) {
              processedUrls.push(dupData.existingItem.public_url)
              toast({
                title: "File Exists",
                description: `${file.name} already exists. Using existing version.`,
              })
              filesProcessedCount++
              continue
            }
          }

          // 3. If not a duplicate, proceed to upload
          const formData = new FormData()
          formData.append("file", file)
          formData.append("folder", folder)

          const uploadResponse = await fetch("/api/bulk-upload", {
            method: "POST",
            body: formData,
          })

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({ error: "Upload failed with no details" }))
            throw new Error(errorData.error || `Failed to upload ${file.name}`)
          }

          const result = await uploadResponse.json()

          if (result.duplicate && result.existingFile?.public_url) {
            processedUrls.push(result.existingFile.public_url)
            toast({
              title: "Duplicate File",
              description: `${file.name} already exists (server check). Using existing.`,
            })
            filesProcessedCount++
          } else if (result.success && result.publicUrl) {
            processedUrls.push(result.publicUrl)
            filesProcessedCount++
          } else {
            throw new Error(result.error || `Upload failed for ${file.name}: Unexpected response format.`)
          }
        } catch (fileError) {
          filesFailedCount++
          console.error(`Error processing file ${file.name}:`, fileError)
          toast({
            title: `Upload Error for ${file.name}`,
            description: fileError instanceof Error ? fileError.message : "An unknown error occurred.",
            variant: "destructive",
          })
        }
      }

      if (processedUrls.length > 0) {
        onMediaAdded(processedUrls)
      }

      if (filesProcessedCount > 0 && filesFailedCount === 0) {
        toast({ title: "Upload Successful", description: `${filesProcessedCount} file(s) processed successfully.` })
      } else if (filesProcessedCount > 0 && filesFailedCount > 0) {
        toast({
          title: "Partial Upload",
          description: `${filesProcessedCount} file(s) processed, ${filesFailedCount} failed.`,
        })
      } else if (filesFailedCount > 0 && filesProcessedCount === 0) {
        toast({
          title: "Upload Failed",
          description: `All ${filesFailedCount} file(s) failed to process.`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Outer error during file processing:", error)
      toast({
        title: "Overall Upload Error",
        description: "An unexpected error occurred during the upload process.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFilesForUpload(e.dataTransfer.files)
      e.dataTransfer.clearData()
    }
  }

  const handleDeviceFileBrowse = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFilesForUpload(e.target.files)
    }
    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleVideoUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoUrlInput(e.target.value)
  }

  const handleSubmitVideoUrl = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const urls = videoUrlInput
      .split(/[\n,\s]+/)
      .map((url) => url.trim())
      .filter((url) => url)

    if (urls.length > 0) {
      urls.forEach((url) => onVideoUrlSubmit(url))
      setVideoUrlInput("")
      toast({ title: "Video Links Added", description: `${urls.length} link(s) submitted for processing.` })
    } else {
      toast({ title: "No Links Entered", description: "Please enter valid video URLs.", variant: "default" })
    }
  }

  const handleMediaSelect = (urls: string | string[]) => {
    // Handle both single and multiple selections
    const selectedUrls = Array.isArray(urls) ? urls : [urls]
    if (selectedUrls.length > 0) {
      onMediaAdded(selectedUrls)
      toast({ title: "Media Selected", description: `${selectedUrls.length} media item(s) added from library.` })
    }
  }

  const handleBrowseMediaClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsMediaLibraryOpen(true)
  }

  const handleBrowseDeviceClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    fileInputRef.current?.click()
  }

  // Material You inspired design
  return (
    <div
      className={`border border-gray-800 rounded-lg p-4 text-center transition-all duration-150 ease-in-out relative ${isDraggingOver ? "border-blue-600/70 bg-slate-800/60 scale-105" : "hover:border-gray-700/80"} ${className}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {(isUploading || isLoading) && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20 rounded-lg">
          <UploadCloud className="h-12 w-12 text-blue-400 animate-pulse mb-2" />
          <p className="text-lg font-semibold text-white">{isUploading ? "Uploading..." : "Processing..."}</p>
        </div>
      )}

      {isDraggingOver ? (
        <div className="pointer-events-none flex flex-col items-center justify-center h-40">
          <UploadCloud className="h-16 w-16 text-blue-400 mb-2" />
          <p className="text-xl font-semibold text-blue-300">Drop files to upload</p>
        </div>
      ) : (
        <div className="space-y-0">
          {/* Material You inspired layout with two lines splitting the component */}
          <div className="flex flex-col items-center space-y-4">
            {/* Top section - Browse Media Library */}
            <Button
              type="button"
              variant="ghost"
              onClick={handleBrowseMediaClick}
              className="w-full text-sm text-gray-300 hover:bg-slate-800/50 rounded-md py-2"
            >
              Browse Media Library
            </Button>

            {/* Divider line */}
            <div className="w-full h-px bg-gray-800"></div>

            {/* Middle section - URL input */}
            <div className="w-full flex items-center space-x-2">
              <Input
                type="text"
                value={videoUrlInput}
                onChange={handleVideoUrlInputChange}
                placeholder="Paste video URL..."
                className="flex-grow bg-transparent border-gray-800 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    if (videoUrlInput.trim()) {
                      handleSubmitVideoUrl(e as unknown as React.MouseEvent)
                    }
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleSubmitVideoUrl}
                size="sm"
                className="bg-blue-600/80 hover:bg-blue-600 text-white"
              >
                <ArrowRight size={16} />
              </Button>
            </div>

            {/* Divider line */}
            <div className="w-full h-px bg-gray-800"></div>

            {/* Bottom section - Browse Device */}
            <Button
              type="button"
              variant="ghost"
              onClick={handleBrowseDeviceClick}
              className="w-full text-sm text-gray-300 hover:bg-slate-800/50 rounded-md py-2"
            >
              Browse Device
            </Button>

            <input
              type="file"
              multiple
              onChange={handleDeviceFileBrowse}
              className="hidden"
              accept="image/*,video/*"
              ref={fileInputRef}
              data-testid="hidden-device-file-input"
            />
          </div>
        </div>
      )}

      {/* Media Selector - Using the one-click open solution with multiple selection */}
      <MediaSelector
        open={isMediaLibraryOpen}
        onOpenChange={setIsMediaLibraryOpen}
        onSelect={handleMediaSelect}
        multiple={true}
      />
    </div>
  )
}
