"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Loader2, Search, X, Check, Film, ImageIcon } from "lucide-react"
import { extractVideoInfo } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"

interface MediaSelectorProps {
  onSelect: (url: string | string[]) => void
  currentValue?: string | string[]
  mediaType?: "images" | "videos" | "all"
  multiple?: boolean
  buttonLabel?: string
}

export default function MediaSelector({
  onSelect,
  currentValue = "",
  mediaType = "all",
  multiple = false,
  buttonLabel = "Browse Media Library",
}: MediaSelectorProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [media, setMedia] = useState<any[]>([])
  const [filteredMedia, setFilteredMedia] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<string>(mediaType === "videos" ? "videos" : "images")
  const [videoUrl, setVideoUrl] = useState("")
  const [uploadingVideo, setUploadingVideo] = useState(false)

  const supabase = createClientComponentClient()

  // Initialize selected items from currentValue
  useEffect(() => {
    if (currentValue) {
      if (Array.isArray(currentValue)) {
        setSelectedItems(currentValue)
      } else if (currentValue) {
        setSelectedItems([currentValue])
      }
    }
  }, [currentValue])

  // Load media when dialog opens
  useEffect(() => {
    if (open) {
      loadMedia()
    }
  }, [open, activeTab])

  // Filter media when search query changes
  useEffect(() => {
    if (searchQuery) {
      const filtered = media.filter((item) => {
        const searchLower = searchQuery.toLowerCase()
        return (
          item.filename?.toLowerCase().includes(searchLower) ||
          item.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower))
        )
      })
      setFilteredMedia(filtered)
    } else {
      setFilteredMedia(media)
    }
  }, [searchQuery, media])

  const loadMedia = async () => {
    try {
      setLoading(true)

      let query = supabase.from("media").select("*")

      // Filter by media type
      if (activeTab === "images") {
        query = query.eq("filetype", "image")
      } else if (activeTab === "videos") {
        query = query.in("filetype", ["vimeo", "youtube", "linkedin", "video"])
      }

      // Order by most recent first
      query = query.order("created_at", { ascending: false })

      const { data, error } = await query

      if (error) {
        throw error
      }

      setMedia(data || [])
      setFilteredMedia(data || [])
    } catch (error: any) {
      console.error("Error loading media:", error)
      toast({
        title: "Error loading media",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (url: string) => {
    if (multiple) {
      // For multiple selection, toggle the selection
      setSelectedItems((prev) => {
        if (prev.includes(url)) {
          return prev.filter((item) => item !== url)
        } else {
          return [...prev, url]
        }
      })
    } else {
      // For single selection, set the selection and close the dialog
      setSelectedItems([url])
      onSelect(url)
      setOpen(false)
    }
  }

  const handleConfirmSelection = () => {
    if (multiple) {
      onSelect(selectedItems)
    } else if (selectedItems.length > 0) {
      onSelect(selectedItems[0])
    }
    setOpen(false)
  }

  const handleAddVideoUrl = async () => {
    if (!videoUrl) {
      toast({
        title: "Missing URL",
        description: "Please enter a video URL",
        variant: "destructive",
      })
      return
    }

    try {
      setUploadingVideo(true)

      // Extract video info
      const videoInfo = extractVideoInfo(videoUrl)

      if (!videoInfo) {
        toast({
          title: "Invalid URL",
          description: "Please enter a valid Vimeo, YouTube, or LinkedIn video URL",
          variant: "destructive",
        })
        return
      }

      // Add to media table
      const { data, error } = await supabase
        .from("media")
        .insert({
          filename: `${videoInfo.platform} Video ${videoInfo.id}`,
          filepath: videoUrl,
          filesize: 0, // Size is not applicable for external videos
          filetype: videoInfo.platform,
          public_url: videoUrl,
          tags: ["video", videoInfo.platform],
        })
        .select()

      if (error) {
        throw error
      }

      // Refresh media list
      loadMedia()

      // Clear input
      setVideoUrl("")

      // Select the newly added video
      if (data && data.length > 0) {
        handleSelect(data[0].public_url)
      }

      toast({
        title: "Video added",
        description: "Video URL has been added to your media library",
      })
    } catch (error: any) {
      console.error("Error adding video URL:", error)
      toast({
        title: "Error adding video",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setUploadingVideo(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              {mediaType !== "videos" && <TabsTrigger value="images">Images</TabsTrigger>}
              {mediaType !== "images" && <TabsTrigger value="videos">Videos</TabsTrigger>}
            </TabsList>

            {multiple && (
              <Button onClick={handleConfirmSelection} disabled={selectedItems.length === 0}>
                Confirm Selection ({selectedItems.length})
              </Button>
            )}
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search media..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 w-7 p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="images" className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ImageIcon className="mx-auto h-12 w-12 mb-2 opacity-20" />
                <p>No images found</p>
                <p className="text-sm">Upload images or adjust your search</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredMedia.map((item) => (
                  <div
                    key={item.id}
                    className={`relative aspect-square rounded-md overflow-hidden border cursor-pointer transition-all ${
                      selectedItems.includes(item.public_url)
                        ? "ring-2 ring-primary border-primary"
                        : "hover:opacity-90"
                    }`}
                    onClick={() => handleSelect(item.public_url)}
                  >
                    <img
                      src={item.public_url || "/placeholder.svg"}
                      alt={item.filename}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg"
                      }}
                    />
                    {selectedItems.includes(item.public_url) && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-1 text-xs truncate">
                      {item.filename}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="videos" className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Enter Vimeo, YouTube, or LinkedIn video URL"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
              <Button onClick={handleAddVideoUrl} disabled={uploadingVideo}>
                {uploadingVideo ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Film className="h-4 w-4 mr-2" />}
                Add
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Film className="mx-auto h-12 w-12 mb-2 opacity-20" />
                <p>No videos found</p>
                <p className="text-sm">Add video URLs or adjust your search</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMedia.map((item) => (
                  <div
                    key={item.id}
                    className={`relative p-3 rounded-md border cursor-pointer transition-all ${
                      selectedItems.includes(item.public_url)
                        ? "bg-primary/10 ring-2 ring-primary border-primary"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => handleSelect(item.public_url)}
                  >
                    <div className="flex items-center gap-3">
                      <Film className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-grow min-w-0">
                        <p className="font-medium truncate">{item.filename}</p>
                        <p className="text-sm text-muted-foreground truncate">{item.public_url}</p>
                      </div>
                      {selectedItems.includes(item.public_url) && (
                        <div className="flex-shrink-0 bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
