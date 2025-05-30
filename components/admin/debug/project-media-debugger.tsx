"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export default function ProjectMediaDebugger() {
  const [projectId, setProjectId] = useState("")
  const [loading, setLoading] = useState(false)
  const [projectData, setProjectData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchProjectData = async () => {
    if (!projectId.trim()) {
      setError("Please enter a project ID")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // First try the debug endpoint
      const response = await fetch(`/api/debug/project-detail/${projectId}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch project data: ${response.statusText}`)
      }

      const data = await response.json()
      setProjectData(data)
    } catch (err) {
      console.error("Error fetching project data:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Project Media Debugger</CardTitle>
        <CardDescription>Debug video and BTS image issues for a specific project</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Enter project ID"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="flex-1"
          />
          <Button onClick={fetchProjectData} disabled={loading}>
            {loading ? "Loading..." : "Debug Project"}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {projectData && (
          <div className="space-y-6">
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Project Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">ID:</div>
                <div>{projectData.id}</div>
                <div className="font-medium">Title:</div>
                <div>{projectData.title}</div>
                <div className="font-medium">Category:</div>
                <div>{projectData.category}</div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Video Fields</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium">url:</div>
                <div>{projectData.url || "Not set"}</div>
                <div className="font-medium">thumbnail_url:</div>
                <div>{projectData.thumbnail_url || "Not set"}</div>
                <div className="font-medium">video_url (derived):</div>
                <div>{projectData.video_url || "Not set"}</div>
                <div className="font-medium">video_platform (derived):</div>
                <div>{projectData.video_platform || "Not set"}</div>
                <div className="font-medium">video_id (derived):</div>
                <div>{projectData.video_id || "Not set"}</div>
              </div>

              <div className="mt-4">
                <h4 className="font-medium mb-2">Video Status:</h4>
                {projectData.thumbnail_url ? (
                  <div className="flex items-center text-green-500">
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    <span>Video URL found in thumbnail_url field</span>
                  </div>
                ) : (
                  <div className="flex items-center text-amber-500">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span>No video URL found in thumbnail_url field</span>
                  </div>
                )}

                {projectData.video_platform && projectData.video_id ? (
                  <div className="flex items-center text-green-500 mt-2">
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    <span>Video platform and ID successfully extracted</span>
                  </div>
                ) : projectData.thumbnail_url ? (
                  <div className="flex items-center text-red-500 mt-2">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span>Failed to extract video platform and ID from URL</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">BTS Images</h3>

              {projectData.bts_images && projectData.bts_images.length > 0 ? (
                <>
                  <div className="flex items-center text-green-500 mb-4">
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    <span>Found {projectData.bts_images.length} BTS images</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {projectData.bts_images.map((image: any, index: number) => (
                      <div key={image.id || index} className="border rounded p-2">
                        <div className="grid grid-cols-2 gap-1 text-sm">
                          <div className="font-medium">ID:</div>
                          <div>{image.id || "Not set"}</div>
                          <div className="font-medium">Image URL:</div>
                          <div className="truncate">{image.image_url || "Not set"}</div>
                          <div className="font-medium">Caption:</div>
                          <div>{image.caption || "Not set"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center text-amber-500">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span>No BTS images found for this project</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-gray-500">This tool helps diagnose issues with project videos and BTS images</div>
      </CardFooter>
    </Card>
  )
}
