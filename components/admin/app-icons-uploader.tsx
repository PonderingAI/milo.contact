"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Upload, Check, AlertCircle, ExternalLink, Info } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import JSZip from "jszip"

interface ActiveIcon {
  key: string
  value: string
  displayName: string
}

export default function AppIconsUploader() {
  const [file, setFile] = useState<File | null>(null)
  const [previews, setPreviews] = useState<{ [key: string]: string }>({})
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [activeIcons, setActiveIcons] = useState<ActiveIcon[]>([])
  const [loadingIcons, setLoadingIcons] = useState(true)

  // Fetch current active icons on component mount
  useEffect(() => {
    async function fetchActiveIcons() {
      try {
        setLoadingIcons(true)
        const supabase = getSupabaseBrowserClient()
        const { data, error } = await supabase
          .from("site_settings")
          .select("key, value")
          .like("key", "icon_%")
          .order("key")

        if (error) {
          console.error("Error fetching active icons:", error)
          return
        }

        if (data && data.length > 0) {
          // Format the icons data for display
          const formattedIcons = data.map((item) => {
            // Extract the filename from the key (remove "icon_" prefix)
            const keyWithoutPrefix = item.key.replace("icon_", "")
            // Make it more readable by replacing underscores with spaces and capitalizing
            const displayName = keyWithoutPrefix
              .replace(/_/g, " ")
              .replace(/(\d+)x(\d+)/g, "$1×$2") // Replace "x" with "×" in dimensions
              .replace(/\b\w/g, (c) => c.toUpperCase()) // Capitalize first letter of each word

            return {
              key: item.key,
              value: item.value,
              displayName,
            }
          })

          // Sort icons by common types first
          const commonIcons = ["favicon.ico", "apple-touch-icon.png", "favicon-32x32.png", "favicon-16x16.png"]
          const sortedIcons = [...formattedIcons].sort((a, b) => {
            const aName = a.key.replace("icon_", "").replace(/_/g, "-")
            const bName = b.key.replace("icon_", "").replace(/_/g, "-")

            const aIndex = commonIcons.findIndex((name) => aName.includes(name))
            const bIndex = commonIcons.findIndex((name) => bName.includes(name))

            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
            if (aIndex !== -1) return -1
            if (bIndex !== -1) return 1
            return a.displayName.localeCompare(b.displayName)
          })

          setActiveIcons(sortedIcons)
        }
      } catch (err) {
        console.error("Error in fetchActiveIcons:", err)
      } finally {
        setLoadingIcons(false)
      }
    }

    fetchActiveIcons()
  }, [])

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
        // Let the browser set the Content-Type header automatically with boundary
      })

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = Math.min(prev + 10, 90)
          return newProgress
        })
      }, 300)

      const result = await response.json()

      clearInterval(progressInterval)

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

  // Group icons by type for better display
  const groupedIcons = activeIcons.reduce((groups: Record<string, ActiveIcon[]>, icon) => {
    const key = icon.key.toLowerCase()
    let group = "other"

    if (key.includes("favicon")) group = "favicon"
    else if (key.includes("apple")) group = "apple"
    else if (key.includes("android")) group = "android"
    else if (key.includes("ms")) group = "microsoft"

    if (!groups[group]) groups[group] = []
    groups[group].push(icon)
    return groups
  }, {})

  return (
    <div className="space-y-6">
      {/* Current Active Icons Section */}
      <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-medium mb-3 flex items-center">
          <Info className="h-5 w-5 mr-2 text-blue-400" />
          Currently Active App Icons
        </h3>

        {loadingIcons ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : activeIcons.length === 0 ? (
          <p className="text-gray-400 text-sm py-2">
            No custom app icons are currently active. Default icons are being used.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Display icons grouped by type */}
            {Object.entries(groupedIcons).map(([group, icons]) => (
              <div key={group} className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300 capitalize">{group} Icons</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {icons.map((icon) => (
                    <div key={icon.key} className="bg-gray-900/50 rounded p-2 flex items-center">
                      <div className="h-8 w-8 mr-2 flex-shrink-0 bg-gray-800 rounded overflow-hidden">
                        <img
                          src={icon.value || "/placeholder.svg"}
                          alt={icon.displayName}
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            // If image fails to load, show a placeholder
                            ;(e.target as HTMLImageElement).src = "/generic-icon.png"
                          }}
                        />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs text-gray-300 truncate" title={icon.displayName}>
                          {icon.displayName}
                        </p>
                        <p className="text-xs text-gray-500 truncate" title={icon.value}>
                          {new URL(icon.value).pathname.split("/").pop()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload New Icons Section */}
      <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-medium mb-2">Upload New App Icons</h3>
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
          <p className="text-sm text-gray-400 mb-2">Preview of new icons:</p>
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
