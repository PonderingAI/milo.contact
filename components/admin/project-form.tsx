"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/router"
import { useMutation, useQuery } from "react-query"
import { toast } from "react-hot-toast"
import { useSession } from "next-auth/react"
import { createProject, getProject, updateProject } from "@/lib/api"
import type { Media } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { UnifiedMediaInput } from "@/components/ui/unified-media-input"

interface ProjectFormProps {
  projectId?: string
}

const ProjectForm: React.FC<ProjectFormProps> = ({ projectId }) => {
  const router = useRouter()
  const { data: session } = useSession()
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [mainMedia, setMainMedia] = useState<Media[]>([])
  const [btsMedia, setBtsMedia] = useState<Media[]>([])
  const [isFeatured, setIsFeatured] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [videoUrl, setVideoUrl] = useState("")
  const [btsVideoUrl, setBtsVideoUrl] = useState("")
  const [isProcessingVideo, setIsProcessingVideo] = useState(false)
  const [isLoadingBtsImages, setIsLoadingBtsImages] = useState(false)

  const { data: projectData, isLoading: isLoadingProject } = useQuery(
    ["project", projectId],
    () => (projectId ? getProject(projectId) : null),
    {
      enabled: !!projectId,
      onSuccess: (data) => {
        if (data) {
          setTitle(data.title)
          setSlug(data.slug)
          setDescription(data.description)
          setMainMedia(data.mainMedia || [])
          setBtsMedia(data.btsMedia || [])
          setIsFeatured(data.isFeatured || false)
          setIsPublished(data.isPublished || false)
          setVideoUrl(data.videoUrl || "")
          setBtsVideoUrl(data.btsVideoUrl || "")
        }
      },
    },
  )

  const mutation = useMutation(projectId ? updateProject : createProject, {
    onSuccess: () => {
      toast.success(`Project ${projectId ? "updated" : "created"} successfully!`)
      router.push("/admin/projects")
    },
    onError: (error: any) => {
      toast.error(`Failed to ${projectId ? "update" : "create"} project: ${error?.message || "Unknown error"}`)
    },
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!session?.user?.email) {
      toast.error("You must be logged in to create a project.")
      return
    }

    setIsSubmitting(true)

    const projectData = {
      title,
      slug,
      description,
      mainMedia,
      btsMedia,
      isFeatured,
      isPublished,
      videoUrl,
      btsVideoUrl,
      authorEmail: session.user.email,
    }

    try {
      if (projectId) {
        await mutation.mutateAsync({ id: projectId, ...projectData })
      } else {
        await mutation.mutateAsync(projectData)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMainMediaSelect = (newMedia: Media[]) => {
    setMainMedia(newMedia)
  }

  const handleBtsMediaSelect = (newMedia: Media[]) => {
    setBtsMedia(newMedia)
  }

  const addMainVideoUrl = (url: string) => {
    setVideoUrl(url)
  }

  const addBtsVideoUrl = (url: string) => {
    setBtsVideoUrl(url)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Project Title"
          disabled={isSubmitting}
        />
      </div>
      <div>
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Project Slug"
          disabled={isSubmitting}
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Project Description"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Main upload area with label */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">Main Media</h3>
            <UnifiedMediaInput
              identifier="main"
              onMediaAdded={handleMainMediaSelect}
              onVideoUrlSubmit={addMainVideoUrl}
              folder="projects"
              isLoading={isProcessingVideo || isSubmitting}
              className="h-[160px]"
            />
            <p className="text-xs text-gray-500 mt-1">Upload or select main project images and videos</p>
          </div>

          {/* BTS upload area with label */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-2">Behind the Scenes</h3>
            <UnifiedMediaInput
              identifier="bts"
              onMediaAdded={handleBtsMediaSelect}
              onVideoUrlSubmit={addBtsVideoUrl}
              folder="bts"
              isLoading={isLoadingBtsImages || isSubmitting}
              className="h-[160px]"
            />
            <p className="text-xs text-gray-500 mt-1">Upload or select behind-the-scenes content</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="isFeatured">Featured</Label>
            <Switch
              id="isFeatured"
              checked={isFeatured}
              onCheckedChange={(checked) => setIsFeatured(checked)}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="isPublished">Published</Label>
            <Switch
              id="isPublished"
              checked={isPublished}
              onCheckedChange={(checked) => setIsPublished(checked)}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      <div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? `Submitting...` : projectId ? "Update Project" : "Create Project"}
        </Button>
      </div>
    </form>
  )
}

export default ProjectForm
