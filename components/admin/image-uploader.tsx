"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

interface ImageUploaderProps {
  currentImage?: string
  onImageUploaded: (url: string) => void
  folder: string
}

export default function ImageUploader({ currentImage, onImageUploaded, folder }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = getSupabaseBrowserClient()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size should be less than 5MB")
      return
    }

    setIsUploading(true)
    setUploadError(null)

    try {
      // Create a preview
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)

      // Generate a unique filename
      const fileExt = file.name.split(".").pop()
      const fileName = `${uuidv4()}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage.from("media").upload(filePath, file)

      if (error) throw error

      // Get the public URL
      const { data: publicUrlData } = supabase.storage.from("media").getPublicUrl(filePath)

      // Call the callback with the new URL
      onImageUploaded(publicUrlData.publicUrl)
    } catch (error: any) {
      console.error("Error uploading image:", error)
      setUploadError(error.message || "Failed to upload image")
      // Reset preview if upload failed
      if (currentImage) {
        setPreviewUrl(currentImage)
      } else {
        setPreviewUrl(null)
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setPreviewUrl(null)
    onImageUploaded("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      {previewUrl ? (
        <div className="relative w-full h-48 rounded-lg overflow-hidden">
          <Image src={previewUrl || "/placeholder.svg"} alt="Preview" fill className="object-cover" />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemoveImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center cursor-pointer hover:border-gray-500 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-400">Click to upload an image</p>
          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />

      {!previewUrl && (
        <Button type="button" variant="outline" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
          {isUploading ? "Uploading..." : "Select Image"}
        </Button>
      )}

      {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
    </div>
  )
}
