"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { SimpleAutocomplete } from "@/components/ui/simple-autocomplete"
import { ProjectMediaUploader } from "./project-media-uploader"
import { BtsImageManager } from "./bts-image-manager"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface ProjectEditorProps {
  project?: any
  mode: "create" | "edit"
  categories?: string[]
  tags?: string[]
}

export function ProjectEditor({ project, mode, categories = [], tags = [] }: ProjectEditorProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingBts, setIsSavingBts] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(project?.categories || [])
  const [selectedTags, setSelectedTags] = useState<string[]>(project?.tags || [])
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(project?.thumbnail_url || "")
  const [videoUrl, setVideoUrl] = useState<string>(project?.video_url || "")
  const [btsImages, setBtsImages] = useState<{ url: string; is_video?: boolean }[]>([])
  const [btsVideos, setBtsVideos] = useState<{ url: string; is_video?: boolean }[]>([])
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (project?.id) {
      // Fetch BTS images for this project
      fetch(`/api/projects/bts-images/${project.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.images) {
            const images = data.images.filter((img: any) => !img.is_video)
            const videos = data.images.filter((img: any) => img.is_video)
            setBtsImages(images)
            setBtsVideos(videos)
          }
        })
        .catch((err) => {
          console.error("Error fetching BTS images:", err)
        })
    }
  }, [project?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (!formRef.current) return

    const formData = new FormData(formRef.current)
    const projectData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      client: formData.get("client") as string,
      date: formData.get("date") as string,
      categories: selectedCategories,
      tags: selectedTags,
      featured: formData.get("featured") === "on",
      thumbnail_url: thumbnailUrl,
      video_url: videoUrl,
    }

    try {
      let response
      let projectId

      if (mode === "create") {
        response = await fetch("/api/projects/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(projectData),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to create project")
        }

        projectId = data.id
        toast({
          title: "Project created",
          description: "Your project has been created successfully.",
        })
      } else {
        response = await fetch(`/api/projects/update/${project.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(projectData),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to update project")
        }

        projectId = project.id
        toast({
          title: "Project updated",
          description: "Your project has been updated successfully.",
        })
      }

      // Save BTS images
      if ((btsImages.length > 0 || btsVideos.length > 0) && projectId) {
        setIsSavingBts(true)
        toast({
          title: "Saving BTS media",
          description: "Please wait while we save your behind-the-scenes media...",
        })

        const allBtsMedia = [
          ...btsImages.map((img) => ({ ...img, is_video: false })),
          ...btsVideos.map((video) => ({ ...video, is_video: true })),
        ]

        try {
          const btsResponse = await fetch("/api/projects/bts-images", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              projectId,
              images: allBtsMedia,
            }),
          })

          const btsData = await btsResponse.json()

          if (!btsResponse.ok) {
            throw new Error(btsData.error || "Failed to save BTS images")
          }

          toast({
            title: "BTS media saved",
            description: "Your behind-the-scenes media has been saved successfully.",
          })
        } catch (error) {
          console.error("Error saving BTS media:", error)
          toast({
            title: "Error saving BTS media",
            description: "There was an error saving your behind-the-scenes media. Please try again.",
            variant: "destructive",
          })
        } finally {
          setIsSavingBts(false)
        }
      }

      // Redirect to projects page
      router.push("/admin/projects")
      router.refresh()
    } catch (error) {
      console.error("Error saving project:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const handleThumbnailChange = (url: string) => {
    setThumbnailUrl(url)
  }

  const handleVideoChange = (url: string) => {
    setVideoUrl(url)
  }

  const handleBtsImagesChange = (images: { url: string; is_video?: boolean }[]) => {
    setBtsImages(images)
  }

  const handleBtsVideosChange = (videos: { url: string; is_video?: boolean }[]) => {
    setBtsVideos(videos)
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" defaultValue={project?.title || ""} required />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={5}
                defaultValue={project?.description || ""}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client">Client</Label>
                <Input id="client" name="client" defaultValue={project?.client || ""} />
              </div>

              <div>
                <Label htmlFor="date">Date</Label>
                <Input id="date" name="date" type="date" defaultValue={project?.date || ""} />
              </div>
            </div>

            <div>
              <Label>Categories</Label>
              <SimpleAutocomplete
                suggestions={categories}
                selectedItems={selectedCategories}
                onSelectionChange={setSelectedCategories}
                placeholder="Select categories"
              />
            </div>

            <div>
              <Label>Tags</Label>
              <SimpleAutocomplete
                suggestions={tags}
                selectedItems={selectedTags}
                onSelectionChange={setSelectedTags}
                placeholder="Select tags"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="featured" name="featured" defaultChecked={project?.featured || false} />
              <Label htmlFor="featured">Featured Project</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Media</h3>

          <div className="space-y-6">
            <div>
              <Label>Thumbnail Image</Label>
              <ProjectMediaUploader
                onMediaSelected={handleThumbnailChange}
                initialValue={thumbnailUrl}
                mediaType="image"
              />
            </div>

            <div>
              <Label>Video URL</Label>
              <ProjectMediaUploader onMediaSelected={handleVideoChange} initialValue={videoUrl} mediaType="video" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Behind The Scenes</h3>

          <div className="space-y-6">
            <div>
              <Label>BTS Images</Label>
              <BtsImageManager images={btsImages} onChange={handleBtsImagesChange} type="image" />
            </div>

            <div>
              <Label>BTS Videos</Label>
              <BtsImageManager images={btsVideos} onChange={handleBtsVideosChange} type="video" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/projects")}
          disabled={isLoading || isSavingBts}
        >
          Cancel
        </Button>

        <Button type="submit" disabled={isLoading || isSavingBts}>
          {(isLoading || isSavingBts) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Create Project" : "Update Project"}
        </Button>
      </div>
    </form>
  )
}
