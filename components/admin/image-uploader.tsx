"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Loader2, Upload, X } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface ImageUploaderProps {
  currentImage?: string
  onImageUploaded: (url: string) => void
  folder?: string
  maxSizeMB?: number
}

export default function ImageUploader({
  currentImage,
  onImageUploaded,
  folder = "uploads",
  maxSizeMB = 5,
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = getSupabaseBrowserClient()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > maxSizeMB) {
      toast({
        title: "File too large",
        description: `Maximum file size is ${maxSizeMB}MB. Your file is ${fileSizeMB.toFixed(2)}MB.`,
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Create a unique file name
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage.from("media").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) throw uploadError

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("media").getPublicUrl(filePath)

      // Add to media table
      const { error: dbError } = await supabase.from("media").insert({
        filename: file.name,
        filepath: filePath,
        filesize: file.size,
        filetype: "image",
        public_url: publicUrl,
        thumbnail_url: publicUrl,
        tags: ["image", folder],
        metadata: {
          contentType: file.type,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      })

      if (dbError) throw dbError

      // Return the URL to the parent component
      onImageUploaded(publicUrl)

      toast({
        title: "Image uploaded",
        description: "Your image has been uploaded successfully.",
      })
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleClearImage = () => {
    onImageUploaded("")
  }

  return (
    <div className="space-y-4">
      {currentImage ? (
        <div className="relative aspect-video rounded-md overflow-hidden border border-gray-700">
          <Image src={currentImage || "/placeholder.svg"} alt="Uploaded image" fill className="object-cover" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full"
            onClick={handleClearImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="aspect-video bg-gray-900 rounded-md flex items-center justify-center border border-dashed border-gray-700">
          <div className="text-center p-4">
            <Upload className="h-10 w-10 text-gray-500 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No image selected</p>
          </div>
        </div>
      )}

      <div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full"
        >
          {isUploading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
            </span>
          ) : (
            <>Upload Image</>
          )}
        </Button>
      </div>
    </div>
  )
}
