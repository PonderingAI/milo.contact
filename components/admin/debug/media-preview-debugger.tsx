"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import Image from "next/image"

export default function MediaPreviewDebugger() {
  const [url, setUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const checkUrl = async () => {
    if (!url.trim()) {
      setError("Please enter a URL")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setImageLoaded(false)
    setImageError(false)

    try {
      const response = await fetch(`/api/debug/media-preview?url=${encodeURIComponent(url)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to check URL")
      }

      setResult(data)
    } catch (err) {
      console.error("Error checking URL:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Media Preview Debugger</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter media URL to check"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1"
              />
              <Button onClick={checkUrl} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Check"}
              </Button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">API Check Results</h3>
                    <div className="bg-gray-900 p-4 rounded-md">
                      <p className="mb-2">
                        <span className="font-medium">URL:</span> {result.url}
                      </p>
                      <p className="mb-2">
                        <span className="font-medium">Found in Media Table:</span> {result.mediaItem ? "Yes" : "No"}
                      </p>
                      <p className="mb-2 flex items-center gap-2">
                        <span className="font-medium">Image Accessible:</span>{" "}
                        {result.imageAccessible ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </p>
                      {!result.imageAccessible && result.imageError && (
                        <p className="text-red-400 text-sm">{result.imageError}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Image Preview Test</h3>
                    <div className="bg-gray-900 p-4 rounded-md h-40 relative">
                      {!imageLoaded && !imageError && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                      )}
                      {imageError && (
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
                          <p className="text-red-400 text-sm">Failed to load image</p>
                        </div>
                      )}
                      <Image
                        src={url || "/placeholder.svg"}
                        alt="Preview"
                        fill
                        className={`object-contain ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageError(true)}
                        unoptimized
                      />
                    </div>
                  </div>
                </div>

                {result.mediaItem && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Media Item Details</h3>
                    <pre className="bg-gray-900 p-4 rounded-md overflow-auto text-xs">
                      {JSON.stringify(result.mediaItem, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
