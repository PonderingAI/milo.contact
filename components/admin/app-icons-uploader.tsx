"use client"

import type React from "react"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import JSZip from "jszip"

export default function AppIconsUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [totalFiles, setTotalFiles] = useState(0)
  const [uploadedFiles, setUploadedFiles] = useState(0)
  const supabase = createClientComponentClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  // Function to ensure the bucket exists
  const ensureBucketExists = async () => {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()

      if (listError) {
        console.error("Error listing buckets:", listError)
        throw listError
      }

      const publicBucket = buckets?.find((bucket) => bucket.name === "public")

      if (!publicBucket) {
        // Create the bucket if it doesn't exist
        const { data, error: createError } = await supabase.storage.createBucket("public", {
          public: true,
          allowedMimeTypes: [
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/svg+xml",
            "image/x-icon",
            "image/vnd.microsoft.icon",
          ],
          fileSizeLimit: 5242880, // 5MB
        })

        if (createError) {
          console.error("Error creating bucket:", createError)
          throw createError
        }

        console.log("Created public bucket:", data)
      }

      return true
    } catch (error) {
      console.error("Error ensuring bucket exists:", error)
      return false
    }
  }

  const handleUpload = async () => {
    if (!file) return

    try {
      setUploading(true)
      setProgress(0)
      setTotalFiles(0)
      setUploadedFiles(0)

      // Ensure the bucket exists
      const bucketExists = await ensureBucketExists()
      if (!bucketExists) {
        toast({
          title: "Error",
          description: "Failed to create storage bucket. Please check your Supabase configuration.",
          variant: "destructive",
        })
        return
      }

      const zip = new JSZip()
      const contents = await zip.loadAsync(file)

      // Count total files for progress tracking
      let iconFiles = 0
      contents.forEach((path, file) => {
        if (!file.dir && (path.endsWith(".png") || path.endsWith(".ico") || path.endsWith(".svg"))) {
          iconFiles++
        }
      })

      setTotalFiles(iconFiles)

      // Process each file in the zip
      const uploadPromises = []
      let currentFile = 0

      for (const [path, zipEntry] of Object.entries(contents.files)) {
        if (!zipEntry.dir && (path.endsWith(".png") || path.endsWith(".ico") || path.endsWith(".svg"))) {
          const blob = await zipEntry.async("blob")
          const fileName = path.split("/").pop() || path

          // Upload to Supabase storage
          const { error } = await supabase.storage.from("public").upload(`icons/${fileName}`, blob, {
            cacheControl: "3600",
            upsert: true,
          })

          if (error) {
            console.error(`Failed to upload ${fileName}:`, error)
            toast({
              title: `Failed to upload ${fileName}`,
              description: error.message,
              variant: "destructive",
            })
          } else {
            currentFile++
            setUploadedFiles(currentFile)
            setProgress(Math.round((currentFile / iconFiles) * 100))
          }
        }
      }

      toast({
        title: "Upload complete",
        description: `Successfully uploaded ${uploadedFiles} app icons.`,
      })
    } catch (error: any) {
      console.error("Error uploading app icons:", error)
      toast({
        title: "Upload failed",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="app-icons">Upload App Icons Package</Label>
        <Input id="app-icons" type="file" accept=".zip" onChange={handleFileChange} disabled={uploading} />
        <p className="text-sm text-gray-500">Upload a .zip file containing app icons from favicon-generator.org</p>
      </div>

      <Button onClick={handleUpload} disabled={!file || uploading} className="w-full">
        {uploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading... {progress}%
          </>
        ) : (
          "Upload Icons"
        )}
      </Button>

      {uploading && totalFiles > 0 && (
        <div className="mt-4">
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-center mt-1">
            Uploaded {uploadedFiles} of {totalFiles} files
          </p>
        </div>
      )}
    </div>
  )
}
