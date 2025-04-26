"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Trash2 } from "lucide-react"
import ImageUploader from "@/components/admin/image-uploader"

interface MediaFile {
  name: string
  id: string
  metadata: {
    size: number
    mimetype: string
  }
  created_at: string
}

export default function MediaPage() {
  const [projectImages, setProjectImages] = useState<MediaFile[]>([])
  const [btsImages, setBtsImages] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("projects")
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const fetchMedia = async () => {
      setLoading(true)
      try {
        // Fetch project images
        const { data: projectData, error: projectError } = await supabase.storage.from("media").list("projects", {
          sortBy: { column: "created_at", order: "desc" },
        })

        if (projectError) throw projectError

        // Fetch BTS images
        const { data: btsData, error: btsError } = await supabase.storage.from("media").list("bts-images", {
          sortBy: { column: "created_at", order: "desc" },
        })

        if (btsError) throw btsError

        setProjectImages(projectData || [])
        setBtsImages(btsData || [])
      } catch (error) {
        console.error("Error fetching media:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMedia()
  }, [supabase])

  const handleCopyUrl = (path: string, folder: string) => {
    const { data } = supabase.storage.from("media").getPublicUrl(`${folder}/${path}`)

    navigator.clipboard.writeText(data.publicUrl)
    alert("URL copied to clipboard!")
  }

  const handleDeleteFile = async (path: string, folder: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return

    try {
      const { error } = await supabase.storage.from("media").remove([`${folder}/${path}`])

      if (error) throw error

      // Update the state
      if (folder === "projects") {
        setProjectImages(projectImages.filter((file) => file.name !== path))
      } else {
        setBtsImages(btsImages.filter((file) => file.name !== path))
      }
    } catch (error) {
      console.error("Error deleting file:", error)
      alert("Failed to delete file")
    }
  }

  const filteredProjectImages = projectImages.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredBtsImages = btsImages.filter((file) => file.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleImageUploaded = () => {
    // Refresh the media list
    if (activeTab === "projects") {
      supabase.storage
        .from("media")
        .list("projects", {
          sortBy: { column: "created_at", order: "desc" },
        })
        .then(({ data }) => {
          if (data) setProjectImages(data)
        })
    } else {
      supabase.storage
        .from("media")
        .list("bts-images", {
          sortBy: { column: "created_at", order: "desc" },
        })
        .then(({ data }) => {
          if (data) setBtsImages(data)
        })
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-serif mb-8">Media Library</h1>

      <div className="mb-8">
        <Input
          placeholder="Search media files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-gray-800 border-gray-700"
        />
      </div>

      <Tabs defaultValue="projects" onValueChange={setActiveTab}>
        <TabsList className="bg-gray-800">
          <TabsTrigger value="projects">Project Images</TabsTrigger>
          <TabsTrigger value="bts">BTS Images</TabsTrigger>
        </TabsList>

        <div className="mt-6 mb-8">
          <h2 className="text-xl mb-4">Upload New Image</h2>
          <ImageUploader
            folder={activeTab === "projects" ? "projects" : "bts-images"}
            onImageUploaded={(url) => {
              handleImageUploaded()
              // Clear the uploader by forcing a re-render with a key change
              return url
            }}
          />
        </div>

        <TabsContent value="projects">
          <h2 className="text-xl mb-4">Project Images ({filteredProjectImages.length})</h2>

          {loading ? (
            <div className="text-center py-8">Loading images...</div>
          ) : filteredProjectImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProjectImages.map((file) => {
                const { data } = supabase.storage.from("media").getPublicUrl(`projects/${file.name}`)

                return (
                  <div key={file.id} className="bg-gray-900 rounded-lg overflow-hidden">
                    <div className="relative h-40">
                      <Image src={data.publicUrl || "/placeholder.svg"} alt={file.name} fill className="object-cover" />
                    </div>
                    <div className="p-3">
                      <p className="text-sm truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">{(file.metadata.size / 1024).toFixed(2)} KB</p>
                      <div className="flex justify-end gap-2 mt-2">
                        <Button variant="ghost" size="icon" onClick={() => handleCopyUrl(file.name, "projects")}>
                          <Copy className="h-4 w-4" />
                          <span className="sr-only">Copy URL</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteFile(file.name, "projects")}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-900 rounded-lg">
              <p className="text-gray-400">No project images found</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="bts">
          <h2 className="text-xl mb-4">BTS Images ({filteredBtsImages.length})</h2>

          {loading ? (
            <div className="text-center py-8">Loading images...</div>
          ) : filteredBtsImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredBtsImages.map((file) => {
                const { data } = supabase.storage.from("media").getPublicUrl(`bts-images/${file.name}`)

                return (
                  <div key={file.id} className="bg-gray-900 rounded-lg overflow-hidden">
                    <div className="relative h-40">
                      <Image src={data.publicUrl || "/placeholder.svg"} alt={file.name} fill className="object-cover" />
                    </div>
                    <div className="p-3">
                      <p className="text-sm truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">{(file.metadata.size / 1024).toFixed(2)} KB</p>
                      <div className="flex justify-end gap-2 mt-2">
                        <Button variant="ghost" size="icon" onClick={() => handleCopyUrl(file.name, "bts-images")}>
                          <Copy className="h-4 w-4" />
                          <span className="sr-only">Copy URL</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteFile(file.name, "bts-images")}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-900 rounded-lg">
              <p className="text-gray-400">No BTS images found</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
