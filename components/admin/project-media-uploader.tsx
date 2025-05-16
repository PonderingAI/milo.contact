"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Film, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import MediaSelector from "@/components/admin/media-selector"
import { getSupabaseBrowserClient } from "@/lib/supabase"

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
  const [videoUrl, setVideoUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = getSupabaseBrowserClient()

  // Fetch existing media URLs on component mount
  useEffect(() => {
    async function fetchExistingMedia() {
      try {
        const { data } = await supabase.from("media").select("public_url")
        if (data) {
          setExistingMediaUrls(data.map((item) => item.public_url).filter(Boolean))
        }
      } catch (error) {
        console.error("Error fetching existing media:", error)
      }
    }

    // Only run in browser
    if (typeof window !== "undefined") {
      fetchExistingMedia()
    }
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    // Check if we're only accepting certain types
    if (mediaType === "image") {
      const validFiles = files.filter((file) => file.type.startsWith("image/"))
      if (validFiles.length !== files.length) {
        toast({
          title: "Invalid file type",
          description: "Only image files are allowed",
          variant: "destructive",
        })
        return
      }
    } else if (mediaType === "video") {
      const validFiles = files.filter((file) => file.type.startsWith("video/"))
      if (validFiles.length !== files.length) {
        toast({
          title: "Invalid file type",
          description: "Only video files are allowed",
          variant: "destructive",
        })
        return
      }
    }

    // Check for duplicates before uploading
    const duplicates = await checkForDuplicates(files)
    if (duplicates.length > 0) {
      const duplicateNames = duplicates.map((file) => file.name).join(", ")
      toast({
        title: "Duplicate files detected",
        description: `The following files already exist: ${duplicateNames}`,
        variant: "destructive",
      })

      // Filter out duplicates
      const uniqueFiles = files.filter((file) => !duplicates.includes(file))
      if (uniqueFiles.length === 0) return

      // Proceed with unique files only
      handleFileUpload(uniqueFiles)
    } else {
      // No duplicates, proceed with all files
      handleFileUpload(files)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)

    // Check for duplicates before uploading
    const duplicates = await checkForDuplicates(fileArray)
    if (duplicates.length > 0) {
      const duplicateNames = duplicates.map((file) => file.name).join(", ")
      toast({
        title: "Duplicate files detected",
        description: `The following files already exist: ${duplicateNames}`,
        variant: "destructive",
      })

      // Filter out duplicates
      const uniqueFiles = fileArray.filter((file) => !duplicates.includes(file))
      if (uniqueFiles.length === 0) {
        // Reset the input
        if (fileInputRef.current) fileInputRef.current.value = ""
        return
      }

      // Proceed with unique files only
      handleFileUpload(uniqueFiles)
    } else {
      // No duplicates, proceed with all files
      handleFileUpload(fileArray)
    }

    // Reset the input
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // Check if files already exist in the media library
  const checkForDuplicates = async (files: File[]): Promise<File[]> => {
    const duplicates: File[] = []

    for (const file of files) {
      // Check by filename first
      const { data } = await supabase.from("media").select("filename").eq("filename", file.name).limit(1)

      if (data && data.length > 0) {
        duplicates.push(file)
        continue
      }

      // Additional checks could be added here:
      // - File hash comparison
      // - Content-based comparison
      // - Size + partial content comparison
    }

    return duplicates
  }

  const handleFileUpload = async (files: File[]) => {
    setIsSubmitting(true)
    const uploadedUrls: string[] = []
    const failedUploads: string[] = []

    try {
      for (const file of files) {
        const fileExt = file.name.split(".").pop()
        const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`
        const filePath = `${folder}/${fileName}`

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage.from("media").upload(filePath, file)

        if (error) {
          console.error("Error uploading file:", error)
          failedUploads.push(file.name)
          continue
        }

        // Get public URL
        const { data: publicUrlData } = supabase.storage.from("media").getPublicUrl(filePath)
        const publicUrl = publicUrlData.publicUrl

        // Add to media table
        const { error: dbError } = await supabase.from("media").insert({
          filename: file.name,
          filepath: filePath,
          filesize: file.size,
          filetype: file.type,
          public_url: publicUrl,
          tags: [folder],
        })

        if (dbError) {
          console.error("Error adding to media table:", dbError)
          failedUploads.push(file.name)
          continue
        }

        uploadedUrls.push(publicUrl)

        // Add to existing media URLs for future duplicate checks
        setExistingMediaUrls((prev) => [...prev, publicUrl])
      }

      // Call the onMediaSelect callback with all uploaded URLs
      if (uploadedUrls.length > 0) {
        onMediaSelect(uploadedUrls)
        toast({
          title: "Upload successful",
          description: `${uploadedUrls.length} file(s) uploaded successfully`,
        })
      }

      // Show errors if any
      if (failedUploads.length > 0) {
        toast({
          title: "Some uploads failed",
          description: `Failed to upload: ${failedUploads.join(", ")}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error in file upload:", error)
      toast({
        title: "Upload failed",
        description: "An unexpected error occurred during upload",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVideoUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!videoUrl.trim()) return

    // Check if this URL already exists in the media library
    const urlExists = existingMediaUrls.includes(videoUrl.trim())

    if (urlExists) {
      // If URL exists, just pass it to the callback without showing an error
      if (onVideoUrlSubmit) {
        onVideoUrlSubmit(videoUrl.trim())
        setVideoUrl("")
      }
    } else {
      // If URL is new, pass it to the callback
      if (onVideoUrlSubmit) {
        onVideoUrlSubmit(videoUrl.trim())
        setVideoUrl("")

        // Add to existing media URLs for future duplicate checks
        setExistingMediaUrls((prev) => [...prev, videoUrl.trim()])
      }
    }
  }

  return (
    <Card className={`border-gray-800 bg-[#070a10] ${isDragging ? "border-blue-500 border-dashed" : ""}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-gray-200">{title} Media</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* Drag & Drop Area */}
            <div
              className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
                isDragging ? "border-blue-500 bg-blue-500/10" : "border-gray-700 hover:border-gray-500"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
                accept={mediaType === "image" ? "image/*" : mediaType === "video" ? "video/*" : "image/*,video/*"}
              />
              <div className="flex flex-col items-center">
                <Upload className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-400 mb-1">Drag & drop files here or click to browse</p>
                <p className="text-xs text-gray-500">
                  {mediaType === "image"
                    ? "Supports: JPG, PNG, WebP, etc."
                    : mediaType === "video"
                      ? "Supports: MP4, WebM, etc."
                      : "Supports: Images and Videos"}
                </p>
              </div>
            </div>

            {/* Media Library Button */}
            <div className="flex justify-center">
              <MediaSelector
                type={mediaType}
                onSelect={onMediaSelect}
                buttonLabel={`Select from Media Library`}
                allowMultiple={true}
              />
            </div>

            {/* Video URL Input (only show if mediaType includes video) */}
            {(mediaType === "video" || mediaType === "all") && onVideoUrlSubmit && (
              <form onSubmit={handleVideoUrlSubmit} className="mt-4">
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <Input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="Enter YouTube, Vimeo, or other video URL"
                      className="pl-9 bg-[#0f1520] border-gray-700"
                    />
                    <Film className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  <Button
                    type="submit"
                    disabled={!videoUrl.trim() || isSubmitting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
