"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Upload, Check, AlertCircle } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function FaviconUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Check if file is an image and not too large
    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    if (selectedFile.size > 1024 * 1024) {
      setError("File size should be less than 1MB")
      return
    }

    setFile(selectedFile)
    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(selectedFile)
  }

  const uploadFavicon = async () => {
    if (!file) return

    try {
      setUploading(true)
      setError(null)

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from("public")
        .upload(`favicon.${file.name.split(".").pop()}`, file, {
          cacheControl: "3600",
          upsert: true,
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("public").getPublicUrl(data.path)

      // Update site settings
      const { error: updateError } = await supabase.from("site_settings").upsert({
        key: "favicon",
        value: publicUrl,
      })

      if (updateError) {
        throw new Error(updateError.message)
      }

      setSuccess(true)

      // Reload the page after 2 seconds to show the new favicon
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err: any) {
      console.error("Error uploading favicon:", err)
      setError(err.message || "Failed to upload favicon")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            type="file"
            accept="image/png,image/x-icon,image/jpeg,image/svg+xml"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <p className="text-xs text-gray-400 mt-1">Recommended: 32x32 or 64x64 PNG, ICO, or SVG file</p>
        </div>

        <Button onClick={uploadFavicon} disabled={!file || uploading}>
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 flex items-center">
          <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-900/20 border border-green-800 rounded-lg p-3 flex items-center">
          <Check className="h-4 w-4 text-green-400 mr-2" />
          <p className="text-green-400 text-sm">Favicon uploaded successfully!</p>
        </div>
      )}

      {preview && (
        <div className="mt-4">
          <p className="text-sm text-gray-400 mb-2">Preview:</p>
          <div className="flex gap-4 items-center">
            <img src={preview || "/placeholder.svg"} alt="Favicon preview" className="w-8 h-8" />
            <img src={preview || "/placeholder.svg"} alt="Favicon preview" className="w-16 h-16" />
            <img src={preview || "/placeholder.svg"} alt="Favicon preview" className="w-32 h-32" />
          </div>
        </div>
      )}
    </div>
  )
}
