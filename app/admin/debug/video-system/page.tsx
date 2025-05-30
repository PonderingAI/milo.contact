"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import VideoPlayer from "@/components/video-player"

export default function VideoSystemDebugPage() {
  const [videoUrl, setVideoUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoInfo, setVideoInfo] = useState<any>(null)
  const [videoError, setVideoError] = useState(false)

  const handleVideoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoUrl(e.target.value)
    setError(null)
    setVideoInfo(null)
    setVideoError(false)
  }

  const handleAnalyzeVideo = async () => {
    if (!videoUrl.trim()) {
      setError("Please enter a video URL")
      return
    }

    setLoading(true)
    setError(null)
    setVideoInfo(null)
    setVideoError(false)

    try {
      const response = await fetch(`/api/debug/video-info?url=${encodeURIComponent(videoUrl)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze video URL")
      }

      if (!data.success) {
        setError(data.message || "Could not extract video information from the provided URL")
        return
      }

      setVideoInfo(data)
    } catch (error) {
      console.error("Error analyzing video:", error)
      setError(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleVideoPlayerError = () => {
    setVideoError(true)
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Video System Debug</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Video URL Analyzer</CardTitle>
          <CardDescription>Enter a video URL to analyze and test the video player</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Enter YouTube, Vimeo, or LinkedIn video URL"
              value={videoUrl}
              onChange={handleVideoUrlChange}
              className="flex-1"
            />
            <Button onClick={handleAnalyzeVideo} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "Analyze"}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {videoInfo && (
            <Tabs defaultValue="info">
              <TabsList>
                <TabsTrigger value="info">Video Info</TabsTrigger>
                <TabsTrigger value="player">Video Player</TabsTrigger>
                <TabsTrigger value="raw">Raw Data</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="mt-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Video Information</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Platform:</span> {videoInfo.info.platform}
                        </div>
                        <div>
                          <span className="font-medium">Video ID:</span> {videoInfo.info.id}
                        </div>
                        {videoInfo.title && (
                          <div>
                            <span className="font-medium">Title:</span> {videoInfo.title}
                          </div>
                        )}
                        {videoInfo.embedUrl && (
                          <div>
                            <span className="font-medium">Embed URL:</span>{" "}
                            <code className="bg-gray-800 px-1 py-0.5 rounded text-sm">{videoInfo.embedUrl}</code>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Database Storage</h3>
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium">Store in:</span>{" "}
                          <code className="bg-gray-800 px-1 py-0.5 rounded text-sm">thumbnail_url</code>
                        </div>
                        <div>
                          <span className="font-medium">Example:</span>
                          <pre className="bg-gray-800 p-2 rounded text-sm mt-1 overflow-x-auto">
                            {`{
  "thumbnail_url": "${videoUrl}",
  "video_platform": "${videoInfo.info.platform}",
  "video_id": "${videoInfo.info.id}"
}`}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Alert className="bg-blue-900/20 border-blue-800">
                    <AlertTitle className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-blue-500" />
                      Video URL Analysis
                    </AlertTitle>
                    <AlertDescription>
                      This URL was successfully parsed and can be used in the video system.
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>

              <TabsContent value="player" className="mt-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium mb-2">Video Player Test</h3>

                  {videoError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        The video player encountered an error. Please check the video URL and try again.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="max-w-3xl mx-auto">
                      <VideoPlayer
                        platform={videoInfo.info.platform}
                        videoId={videoInfo.info.id}
                        onError={handleVideoPlayerError}
                      />
                    </div>
                  )}

                  <div className="mt-4">
                    <h4 className="text-md font-medium mb-2">Player Component Usage</h4>
                    <pre className="bg-gray-800 p-3 rounded text-sm overflow-x-auto">
                      {`<VideoPlayer
  platform="${videoInfo.info.platform}"
  videoId="${videoInfo.info.id}"
  onError={() => console.error("Video failed to load")}
/>`}
                    </pre>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="raw" className="mt-4">
                <h3 className="text-lg font-medium mb-2">Raw Response Data</h3>
                <pre className="bg-gray-800 p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(videoInfo, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Video System Documentation</CardTitle>
          <CardDescription>How the video system works in the portfolio website</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Database Schema</h3>
              <p className="mb-2">The project database schema includes these relevant fields for videos:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <code className="bg-gray-800 px-1 py-0.5 rounded text-sm">thumbnail_url</code> - Field used to store
                  video URLs (despite the name suggesting it's for thumbnails)
                </li>
                <li>
                  <code className="bg-gray-800 px-1 py-0.5 rounded text-sm">video_platform</code> - Optional field to
                  store the video platform (YouTube, Vimeo, etc.)
                </li>
                <li>
                  <code className="bg-gray-800 px-1 py-0.5 rounded text-sm">video_id</code> - Optional field to store
                  the video ID
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Video Flow</h3>
              <ol className="list-decimal pl-6 space-y-2">
                <li>
                  <strong>Project Creation/Editing</strong>
                  <p>
                    When a user adds a video to a project, the video URL is saved in the{" "}
                    <code className="bg-gray-800 px-1 py-0.5 rounded text-sm">thumbnail_url</code> field.
                  </p>
                </li>
                <li>
                  <strong>Data Retrieval</strong>
                  <p>
                    When project data is retrieved, the system extracts video information from{" "}
                    <code className="bg-gray-800 px-1 py-0.5 rounded text-sm">thumbnail_url</code> using the{" "}
                    <code className="bg-gray-800 px-1 py-0.5 rounded text-sm">extractVideoInfo</code> function.
                  </p>
                </li>
                <li>
                  <strong>Video Display</strong>
                  <p>
                    The <code className="bg-gray-800 px-1 py-0.5 rounded text-sm">VideoPlayer</code> component uses the
                    extracted platform and ID to display the video.
                  </p>
                </li>
              </ol>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-2">Supported URL Formats</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium">YouTube</h4>
                  <ul className="list-disc pl-6">
                    <li>
                      <code className="bg-gray-800 px-1 py-0.5 rounded text-sm">
                        https://www.youtube.com/watch?v=VIDEO_ID
                      </code>
                    </li>
                    <li>
                      <code className="bg-gray-800 px-1 py-0.5 rounded text-sm">
                        https://www.youtube.com/embed/VIDEO_ID
                      </code>
                    </li>
                    <li>
                      <code className="bg-gray-800 px-1 py-0.5 rounded text-sm">https://youtu.be/VIDEO_ID</code>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium">Vimeo</h4>
                  <ul className="list-disc pl-6">
                    <li>
                      <code className="bg-gray-800 px-1 py-0.5 rounded text-sm">https://vimeo.com/VIDEO_ID</code>
                    </li>
                    <li>
                      <code className="bg-gray-800 px-1 py-0.5 rounded text-sm">
                        https://player.vimeo.com/video/VIDEO_ID
                      </code>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium">LinkedIn</h4>
                  <ul className="list-disc pl-6">
                    <li>
                      <code className="bg-gray-800 px-1 py-0.5 rounded text-sm">
                        https://www.linkedin.com/feed/update/urn:li:activity:ACTIVITY_ID
                      </code>
                    </li>
                    <li>
                      <code className="bg-gray-800 px-1 py-0.5 rounded text-sm">
                        https://www.linkedin.com/posts/PROFILE_ID-POST_ID
                      </code>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
