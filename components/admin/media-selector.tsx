"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Search, ImageIcon, Film, X } from "lucide-react"
import { formatFileSize } from "@/lib/utils"

interface MediaItem {
  id: string
  filename: string
  filepath: string
  filesize: number
  filetype: string
  public_url: string
  thumbnail_url: string | null
  tags: string[]
  created_at: string
}

interface MediaSelectorProps {
  onSelect: (url: string) => void
  type?: "image" | "video" | "all"
  buttonLabel?: string
  currentUrl?: string
}

export default function MediaSelector({
  onSelect,
  type = "all",
  buttonLabel = "Select from Media Library",
  currentUrl,
}: MediaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [filteredItems, setFilteredItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState(type === "all" ? "all" : type === "image" ? "image" : "video")
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    if (isOpen) {
      fetchMedia()
    }
  }, [isOpen])

  useEffect(() => {
    filterMedia()
  }, [mediaItems, searchTerm, activeTab])

  const fetchMedia = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("media").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching media:", error)
        return
      }

      setMediaItems(data || [])
    } catch (error) {
      console.error("Error in fetchMedia:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterMedia = () => {
    let filtered = [...mediaItems]

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    // Filter by type
    if (activeTab !== "all") {
      if (activeTab === "image") {
        filtered = filtered.filter((item) => item.filetype === "image")
      } else if (activeTab === "video") {
        filtered = filtered.filter((item) => ["vimeo", "youtube", "linkedin", "video"].includes(item.filetype))
      } else if (["vimeo", "youtube", "linkedin"].includes(activeTab)) {
        filtered = filtered.filter((item) => item.filetype === activeTab)
      }
    }

    setFilteredItems(filtered)
  }

  const handleSelect = (url: string) => {
    onSelect(url)
    setIsOpen(false)
  }

  const renderMediaGrid = () => {
    if (loading) {
      return <div className="text-center py-12">Loading media...</div>
    }

    if (filteredItems.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-900 rounded-lg">
          <p className="text-gray-400">No media found</p>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`bg-gray-900 rounded-lg overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-blue-500 ${
              currentUrl === item.public_url ? "ring-2 ring-green-500" : ""
            }`}
            onClick={() => handleSelect(item.public_url)}
          >
            <div className="relative h-32">
              {item.thumbnail_url ? (
                <Image
                  src={item.thumbnail_url || "/placeholder.svg"}
                  alt={item.filename}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  {item.filetype === "image" ? (
                    <ImageIcon className="h-8 w-8 text-gray-500" />
                  ) : (
                    <Film className="h-8 w-8 text-gray-500" />
                  )}
                </div>
              )}
              {["vimeo", "youtube", "linkedin"].includes(item.filetype) && (
                <div
                  className={`absolute top-2 right-2 text-white text-xs px-2 py-1 rounded ${
                    item.filetype === "vimeo"
                      ? "bg-blue-600"
                      : item.filetype === "youtube"
                        ? "bg-red-600"
                        : "bg-blue-800"
                  }`}
                >
                  {item.filetype.charAt(0).toUpperCase() + item.filetype.slice(1)}
                </div>
              )}
            </div>
            <div className="p-2">
              <p className="text-sm truncate" title={item.filename}>
                {item.filename}
              </p>
              <p className="text-xs text-gray-500">
                {item.filesize ? formatFileSize(item.filesize) : "External Media"}
              </p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center gap-2">
        {currentUrl && (
          <div className="relative h-10 w-10 rounded overflow-hidden bg-gray-800 flex-shrink-0">
            {currentUrl.includes("vimeo") || currentUrl.includes("youtube") || currentUrl.includes("linkedin") ? (
              <Film className="h-5 w-5 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-400" />
            ) : (
              <Image src={currentUrl || "/placeholder.svg"} alt="Selected media" fill className="object-cover" />
            )}
          </div>
        )}
        <DialogTrigger asChild>
          <Button variant="outline" className="flex-grow">
            {buttonLabel}
          </Button>
        </DialogTrigger>
        {currentUrl && (
          <Button
            variant="ghost"
            size="icon"
            className="text-red-500 hover:text-red-600 hover:bg-red-100/10"
            onClick={() => onSelect("")}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear selection</span>
          </Button>
        )}
      </div>

      <DialogContent className="max-w-4xl w-full">
        <DialogHeader>
          <DialogTitle>Select Media</DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search media..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-800 border-gray-700 pl-10"
            />
          </div>
        </div>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-800">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="image">Images</TabsTrigger>
            <TabsTrigger value="video">Videos</TabsTrigger>
            <TabsTrigger value="vimeo">Vimeo</TabsTrigger>
            <TabsTrigger value="youtube">YouTube</TabsTrigger>
            <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {renderMediaGrid()}
          </TabsContent>

          <TabsContent value="image" className="mt-4">
            {renderMediaGrid()}
          </TabsContent>

          <TabsContent value="video" className="mt-4">
            {renderMediaGrid()}
          </TabsContent>

          <TabsContent value="vimeo" className="mt-4">
            {renderMediaGrid()}
          </TabsContent>

          <TabsContent value="youtube" className="mt-4">
            {renderMediaGrid()}
          </TabsContent>

          <TabsContent value="linkedin" className="mt-4">
            {renderMediaGrid()}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
