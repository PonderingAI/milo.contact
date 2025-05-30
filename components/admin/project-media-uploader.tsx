"use client"

import { useState, useRef, useCallback } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { UploadCloud, Loader2, X, Film, Search, Info } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import UnifiedMediaLibrary from "./unified-media-library"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface ProjectMediaUploaderProps {
  title: string
  onMediaSelect: (url: string | string[]) => void
  onVideoUrlSubmit?: (url: string) => void
  mediaType?: "image" | "video" | "all"
  folder?: string
  isLoading?: boolean
}

export default function ProjectMediaUploader({
  title,
  onMediaSelect,
  onVideoUrlSubmit,
  mediaType = "all",
  folder = "projects",
  isLoading = false,
}: ProjectMediaUploaderProps) {
  const supabase = createClientComponentClient()
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [videoUrl, setVideoUrl] = useState("")
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false)
  const [duplicateWarning, setDuplicateWarning] = useState<{
    show: boolean
    message: string
    existingItem?: any
  }>({ show: false, message: "" })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const files = e.dataTransfer.files
      if (files && files.length > 0) {
        await handleFileUpload(Array.from(files))
      }
    },
    [onMediaSelect],
  )

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    await handleFileUpload(Array.from(files))

    // Reset the input
    e.target.value = ""
  }

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return

    // Filter files based on mediaType
    const filteredFiles = files.filter((file) => {
      const fileType = file.type.split("/")[0]
      if (mediaType === "image") return fileType === "image"
      if (mediaType === "video") return fileType === "video"
      return true // "all" type
    })

    if (filteredFiles.length === 0) {
      toast({
        title: "Invalid file type",
        description: `Please upload ${mediaType === "image" ? "images" : mediaType === "video" ? "videos" : "media files"}`,
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Process each file
      for (let i = 0; i < filteredFiles.length; i++) {
        const file = filteredFiles[i]

        // Check for duplicates before uploading
        const fileHash = await calculateFileHash(file)
        const duplicateCheckResponse = await fetch("/api/check-media-duplicate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileHash,
            filename: file.name,
          }),
        })

        const duplicateCheckResult = await duplicateCheckResponse.json()

        if (duplicateCheckResult.isDuplicate) {
          // If it's a duplicate, use the existing file instead of uploading again
          setDuplicateWarning({
            show: true,
            message: duplicateCheckResult.reason || `File "${file.name}" already exists in the media library.`,
            existingItem: duplicateCheckResult.existingItem,
          })

          // Add the existing file URL to the selected media
          if (duplicateCheckResult.existingItem?.public_url) {
            onMediaSelect(duplicateCheckResult.existingItem.public_url)
          }

          // Update progress
          setUploadProgress(((i + 1) / filteredFiles.length) * 100)
          continue
        }

        // Create a FormData object
        const formData = new FormData()
        formData.append("file", file)
        formData.append("folder", folder)

        // Upload the file
        const response = await fetch("/api/bulk-upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to upload file")
        }

        const result = await response.json()

        // If it's a duplicate, show a warning but still use the file
        if (result.duplicate) {
          setDuplicateWarning({
            show: true,
            message: result.message || `File "${file.name}" already exists in the media library.`,
            existingItem: result.existingFile,
          })

          // Add the existing file URL to the selected media
          if (result.existingFile?.public_url) {
            onMediaSelect(result.existingFile.public_url)
          }
        } else {
          // Add the new file URL to the selected media
          onMediaSelect(result.publicUrl)
        }

        // Update progress
        setUploadProgress(((i + 1) / filteredFiles.length) * 100)
      }

      toast({
        title: "Upload complete",
        description: `${filteredFiles.length} file${filteredFiles.length !== 1 ? "s" : ""} uploaded successfully`,
      })
    } catch (error) {
      console.error("Error uploading files:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const calculateFileHash = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        if (!e.target?.result) {
          resolve("")
          return
        }

        const arrayBuffer = e.target.result as ArrayBuffer
        const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
        resolve(hashHex)
      }
      reader.readAsArrayBuffer(file)
    })
  }

  const handleVideoUrlSubmit = async () => {
    if (!videoUrl.trim() || !onVideoUrlSubmit) return

    // Check for duplicates before processing
    const duplicateCheckResponse = await fetch("/api/check-media-duplicate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: videoUrl.trim(),
      }),
    })

    const duplicateCheckResult = await duplicateCheckResponse.json()

    if (duplicateCheckResult.isDuplicate) {
      // If it's a duplicate, use the existing video instead of processing again
      setDuplicateWarning({
        show: true,
        message: duplicateCheckResult.reason || `Video already exists in the media library.`,
        existingItem: duplicateCheckResult.existingItem,
      })

      // Add the existing video URL to the selected media
      if (duplicateCheckResult.existingItem?.public_url) {
        onMediaSelect(duplicateCheckResult.existingItem.public_url)
      }

      // Clear the input
      setVideoUrl("")
      return
    }

    // Process the video URL
    onVideoUrlSubmit(videoUrl.trim())
    setVideoUrl("")
  }

  const handleMediaLibrarySelect = (urls: string[]) => {
    if (urls.length > 0) {
      onMediaSelect(urls)
      setIsMediaLibraryOpen(false)
    }
  }

  const closeDuplicateWarning = () => {
    setDuplicateWarning({ show: false, message: "" })
  }

  return (
    <Card className="border-gray-800 bg-[#070a10]">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-gray-200">{title} Media</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="upload">
          <TabsList className="bg-gray-800">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="library">Media Library</TabsTrigger>
            {mediaType !== "image" && <TabsTrigger value="video">Video URL</TabsTrigger>}
          </TabsList>

          <TabsContent value="upload" className="pt-4">
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging ? "border-blue-500 bg-blue-500/10" : "border-gray-700 hover:border-gray-500"
              }`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center justify-center gap-2">
                <UploadCloud className="h-8 w-8 text-gray-400" />
                <p className="text-sm font-medium">{isDragging ? "Drop files here" : "Drag & drop files here"}</p>
                <p className="text-xs text-gray-400">
                  or <span className="text-blue-500 cursor-pointer">browse</span> to upload
                </p>
                {isUploading && (
                  <div className="w-full mt-2">
                    <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Uploading... {Math.round(uploadProgress)}%</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                accept={
                  mediaType === "image"
                    ? "image/*"
                    : mediaType === "video"
                      ? "video/*"
                      : "image/*,video/*,audio/*,application/pdf"
                }
              />
            </div>
          </TabsContent>

          <TabsContent value="library" className="pt-4">
            <div className="text-center">
              <Button
                onClick={() => setIsMediaLibraryOpen(true)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-200"
              >
                <Search className="h-4 w-4 mr-2" />
                Browse Media Library
              </Button>
            </div>
          </TabsContent>

          {mediaType !== "image" && (
            <TabsContent value="video" className="pt-4">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste YouTube, Vimeo, or LinkedIn video URL"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-gray-200"
                  />
                  <Button
                    onClick={handleVideoUrlSubmit}
                    disabled={!videoUrl.trim() || isUploading}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-200"
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Film className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-gray-400">Supported formats: YouTube, Vimeo, and LinkedIn video URLs</p>
              </div>
            </TabsContent>
          )}
        </Tabs>

        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400 mr-2" />
            <span className="text-sm text-gray-400">Loading media...</span>
          </div>
        )}

        {duplicateWarning.show && (
          <Alert className="bg-yellow-900/20 border-yellow-800">
            <Info className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="flex justify-between items-center">
              <span>{duplicateWarning.message}</span>
              <Button variant="ghost" size="sm" onClick={closeDuplicateWarning} className="h-6 w-6 p-0">
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {/* Preview of selected media */}
        {(mediaType === "all" || mediaType === "image") && (
          <div className="mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {/* This will be populated by the parent component's state management */}
            </div>
          </div>
        )}
      </CardContent>

      {/* Media Library Dialog */}
      <Dialog open={isMediaLibraryOpen} onOpenChange={setIsMediaLibraryOpen}>
        <DialogContent className="max-w-6xl w-[95vw]">
          <DialogHeader>
            <DialogTitle>Media Library</DialogTitle>
            <DialogDescription>Select media to add to your project</DialogDescription>
          </DialogHeader>
          <div className="h-[70vh] overflow-y-auto">
            <UnifiedMediaLibrary
              selectionMode="multiple"
              onSelect={handleMediaLibrarySelect}
              mediaTypeFilter={mediaType}
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
