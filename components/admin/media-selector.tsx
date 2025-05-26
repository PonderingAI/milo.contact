"use client"

import { DialogTrigger } from "@/components/ui/dialog"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search, Film } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Loader2, X, Check, ImageIcon } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface MediaSelectorProps {
  onSelect: (url: string) => void
  mediaType?: "image" | "video" | "all"
  buttonLabel?: string
}

export default function MediaSelector({
  onSelect,
  mediaType = "all",
  buttonLabel = "Select Media",
}: MediaSelectorProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [media, setMedia] = useState<any[]>([])
  const [filteredMedia, setFilteredMedia] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<string>(mediaType === "video" ? "videos" : "images")
  const [videoUrl, setVideoUrl] = useState("")
  const [uploadingVideo, setUploadingVideo] = useState(false)

  const supabase = getSupabaseBrowserClient()

  // Initialize selected items from currentValue
  useEffect(() => {
    // if (currentValue) {
    //   if (Array.isArray(currentValue)) {
    //     setSelectedItems(currentValue)
    //   } else if (currentValue) {
    //     setSelectedItems([currentValue])
    //   }
    // }
  }, [])

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
    // if (multiple) {
    //   // For multiple selection, toggle the selection
    //   setSelectedItems((prev) => {
    //     if (prev.includes(url)) {
    //       return prev.filter((item) => item !== url)
    //     } else {
    //       return [...prev, url]
    //     }
    //   })
    // } else {
    // For single selection, set the selection and close the dialog
    setSelectedItems([url])
    onSelect(url)
    setOpen(false)
    // }
  }

  const handleConfirmSelection = () => {
    // if (multiple) {
    //   onSelect(selectedItems)
    // } else if (selectedItems.length > 0) {
    //   onSelect(selectedItems[0])
    // }
    setOpen(false)
  }

  const handleAddVideoUrl = async () => {
    // if (!videoUrl) {
    //   toast({
    //     title: "Missing URL",
    //     description: "Please enter a video URL",
    //     variant: "destructive",
    //   })
    //   return
    // }
    // try {
    //   setUploadingVideo(true)
    //   // Extract video info
    //   const videoInfo = extractVideoInfo(videoUrl)
    //   if (!videoInfo) {
    //     toast({
    //       title: "Invalid URL",
    //       description: "Please enter a valid Vimeo, YouTube, or LinkedIn video URL",
    //       variant: "destructive",
    //     })
    //     return
    //   }
    //   // Add to media table
    //   const { data, error } = await supabase
    //     .from("media")
    //     .insert({
    //       filename: `${videoInfo.platform} Video ${videoInfo.id}`,
    //       filepath: videoUrl,
    //       filesize: 0, // Size is not applicable for external videos
    //       filetype: videoInfo.platform,
    //       public_url: videoUrl,
    //       tags: ["video", videoInfo.platform],
    //     })
    //     .select()
    //   if (error) {
    //     throw error
    //   }
    //   // Refresh media list
    //   loadMedia()
    //   // Clear input
    //   setVideoUrl("")
    //   // Select the newly added video
    //   if (data && data.length > 0) {
    //     handleSelect(data[0].public_url)
    //   }
    //   toast({
    //     title: "Video added",
    //     description: "Video URL has been added to your media library",
    //   })
    // } catch (error: any) {
    //   console.error("Error adding video URL:", error)
    //   toast({
    //     title: "Error adding video",
    //     description: error.message,
    //     variant: "destructive",
    //   })
    // } finally {
    //   setUploadingVideo(false)
    // }
  }

  // Function to get video thumbnail URL
  const getVideoThumbnail = (item: any) => {
    // First check if there's a thumbnail_url in the item
    if (item.thumbnail_url) {
      return item.thumbnail_url
    }

    // If not, try to generate one based on the video platform
    const url = item.public_url

    if (url.includes("youtube.com")) {
      const videoId = url.split("v=")[1]?.split("&")[0]
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      }
    } else if (url.includes("youtu.be")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0]
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      }
    }

    // Default placeholder for videos without thumbnails
    return null
  }

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        {/* @ts-expect-error */}
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
                {mediaType !== "video" && <TabsTrigger value="images">Images</TabsTrigger>}
                {mediaType !== "image" && <TabsTrigger value="videos">Videos</TabsTrigger>}
              </TabsList>

              {/* {multiple && (
                <Button onClick={handleConfirmSelection} disabled={selectedItems.length === 0}>
                  Confirm Selection ({selectedItems.length})
                </Button>
              )} */}
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
                      <ImageIcon
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
              {/* <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Enter Vimeo, YouTube, or LinkedIn video URL"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
                <Button onClick={handleAddVideoUrl} disabled={uploadingVideo}>
                  {uploadingVideo ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Film className="h-4 w-4 mr-2" />}
                  Add
                </Button>
              </div> */}

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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredMedia.map((item) => {
                    const thumbnailUrl = getVideoThumbnail(item)
                    return (
                      <div
                        key={item.id}
                        className={`relative aspect-video rounded-md overflow-hidden border cursor-pointer transition-all ${
                          selectedItems.includes(item.public_url)
                            ? "ring-2 ring-primary border-primary"
                            : "hover:opacity-90"
                        }`}
                        onClick={() => handleSelect(item.public_url)}
                      >
                        {thumbnailUrl ? (
                          <img
                            src={thumbnailUrl || "/placeholder.svg"}
                            alt={item.filename}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/placeholder.svg"
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-800">
                            <Film className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        {selectedItems.includes(item.public_url) && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-1 text-xs">
                          <div className="truncate">{item.filename}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Add named export without changing anything else
export { MediaSelector }
