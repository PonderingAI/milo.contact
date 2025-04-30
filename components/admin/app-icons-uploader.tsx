"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Upload, Check, AlertCircle, ExternalLink } from "lucide-react"
import JSZip from "jszip"

export default function AppIconsUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [previews, setPreviews] = useState<{ [key: string]: string }>({})
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Check if file is a zip
    if (selectedFile.type !== "application/zip" && !selectedFile.name.endsWith(".zip")) {
      setError("Please select a zip file")
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size should be less than 10MB")
      return
    }

    setFile(selectedFile)
    setError(null)

    try {
      // Read the zip file
      const zip = new JSZip()
      const contents = await zip.loadAsync(selectedFile)

      // Create previews for some of the icons
      const previewFiles = ["favicon-32x32.png", "apple-icon-180x180.png", "android-icon-192x192.png", "favicon.ico"]
      const newPreviews: { [key: string]: string } = {}

      for (const filename of previewFiles) {
        const zipFile = contents.file(filename)
        if (zipFile) {
          const blob = await zipFile.async("blob")
          const url = URL.createObjectURL(blob)
          newPreviews[filename] = url
        }
      }

      setPreviews(newPreviews)
    } catch (err) {
      console.error("Error reading zip file:", err)
      setError("Failed to read zip file")
    }
  }

  const uploadIcons = async () => {
    if (!file) return

    try {
      setUploading(true)
      setError(null)
      setProgress(0)
      setSuccess(false)

      // Create FormData to send the file
      const formData = new FormData()
      formData.append("zipFile", file)

      // Upload using the server-side API
      const response = await fetch("/api/upload-app-icons", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Failed to upload app icons")
      }

      setSuccess(true)
      setProgress(100)
      toast({
        title: "Success",
        description: "App icons uploaded successfully!",
      })

      // Reload the page after 2 seconds to show the new icons
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err: any) {
      console.error("Error uploading app icons:", err)
      setError(err.message || "Failed to upload app icons")
      toast({
        title: "Error",
        description: err.message || "Failed to upload app icons",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-medium mb-2">App Icons Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
          <li>
            Visit{" "}
            <a
              href="https://www.favicon-generator.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline inline-flex items-center"
            >
              favicon-generator.org <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </li>
          <li>Upload your image (at least 260x260 pixels for best results)</li>
          <li>Generate your favicon package and download the zip file</li>
          <li>Upload the zip file below</li>
        </ol>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input type="file" accept=".zip,application/zip" onChange={handleFileChange} disabled={uploading} />
          <p className="text-xs text-gray-400 mt-1">Upload the favicon package zip file from favicon-generator.org</p>
        </div>

        <Button onClick={uploadIcons} disabled={!file || uploading}>
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
          <p className="text-green-400 text-sm">App icons uploaded successfully!</p>
        </div>
      )}

      {uploading && (
        <div className="mt-4">
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-center mt-1">{progress}% complete</p>
        </div>
      )}

      {Object.keys(previews).length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-gray-400 mb-2">Preview:</p>
          <div className="flex gap-4 items-end flex-wrap">
            {previews["favicon.ico"] && (
              <div className="text-center">
                <img
                  src={previews["favicon.ico"] || "/placeholder.svg"}
                  alt="Favicon preview"
                  className="w-8 h-8 mx-auto"
                />
                <p className="text-xs text-gray-500 mt-1">favicon.ico</p>
              </div>
            )}
            {previews["favicon-32x32.png"] && (
              <div className="text-center">
                <img
                  src={previews["favicon-32x32.png"] || "/placeholder.svg"}
                  alt="Favicon preview"
                  className="w-8 h-8 mx-auto"
                />
                <p className="text-xs text-gray-500 mt-1">32x32</p>
              </div>
            )}
            {previews["apple-icon-180x180.png"] && (
              <div className="text-center">
                <img
                  src={previews["apple-icon-180x180.png"] || "/placeholder.svg"}
                  alt="Apple icon preview"
                  className="w-16 h-16 mx-auto"
                />
                <p className="text-xs text-gray-500 mt-1">180x180</p>
              </div>
            )}
            {previews["android-icon-192x192.png"] && (
              <div className="text-center">
                <img
                  src={previews["android-icon-192x192.png"] || "/placeholder.svg"}
                  alt="Android icon preview"
                  className="w-20 h-20 mx-auto"
                />
                <p className="text-xs text-gray-500 mt-1">192x192</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
