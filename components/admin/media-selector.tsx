"use client"

import { useState, useEffect, useMemo } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, X, Check, Film, ImageIcon, SlidersHorizontal } from "lucide-react"
import { extractVideoInfo } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface MediaSelectorProps {
  onSelect: (url: string | string[]) => void
  currentValue?: string | string[]
  showImages?: boolean
  showVideos?: boolean
  multiple?: boolean
  buttonLabel?: string
  maxSelections?: number
  className?: string
}

export function MediaSelector({
  onSelect,
  currentValue = "",
  showImages = true,
  showVideos = true,
  multiple = false,
  buttonLabel = "Browse Media Library",
  maxSelections = 100,
  className = "",
}: MediaSelectorProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [media, setMedia] = useState<any[]>([])
  const [filteredMedia, setFilteredMedia] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [videoUrl, setVideoUrl] = useState("")
  const [uploadingVideo, setUploadingVideo] = useState(false)

  // Filtering state
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string[]>(
    showImages && showVideos ? [] : showImages ? ["image"] : ["video"],
  )
  const [tagFilters, setTagFilters] = useState<string[]>([])
  const [sourceFilters, setSourceFilters] = useState<string[]>([])
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [availableSources, setAvailableSources] = useState<string[]>([])

  const supabase = createClientComponentClient()

  // Initialize selected items from currentValue
  useEffect(() => {
    if (currentValue) {
      if (Array.isArray(currentValue)) {
        setSelectedItems(currentValue)
      } else if (currentValue) {
        setSelectedItems([currentValue])
      }
    } else {
      setSelectedItems([])
    }
  }, [currentValue])

  // Load media when dialog opens
  useEffect(() => {
    if (open) {
      loadMedia()
    }
  }, [open])

  // Extract available tags and sources from media
  useEffect(() => {
    if (media.length > 0) {
      // Extract unique tags
      const tags = new Set<string>()
      media.forEach((item) => {
        if (Array.isArray(item.tags)) {
          item.tags.forEach((tag: string) => tags.add(tag))
        }
      })
      setAvailableTags(Array.from(tags).sort())

      // Extract unique sources (filetypes)
      const sources = new Set<string>()
      media.forEach((item) => {
        if (item.filetype) {
          sources.add(item.filetype)
        }
      })
      setAvailableSources(Array.from(sources).sort())
    }
  }, [media])

  // Apply filters and search
  useEffect(() => {
    let filtered = [...media]

    // Apply media type filter
    if (mediaTypeFilter.length > 0) {
      if (mediaTypeFilter.includes("image") && !mediaTypeFilter.includes("video")) {
        filtered = filtered.filter((item) => item.filetype === "image")
      } else if (mediaTypeFilter.includes("video") && !mediaTypeFilter.includes("image")) {
        filtered = filtered.filter(
          (item) =>
            item.filetype === "vimeo" ||
            item.filetype === "youtube" ||
            item.filetype === "linkedin" ||
            item.filetype === "video",
        )
      }
    }

    // Apply tag filters
    if (tagFilters.length > 0) {
      filtered = filtered.filter((item) => {
        if (!Array.isArray(item.tags)) return false
        return tagFilters.some((tag) => item.tags.includes(tag))
      })
    }

    // Apply source filters
    if (sourceFilters.length > 0) {
      filtered = filtered.filter((item) => sourceFilters.includes(item.filetype))
    }

    // Apply search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      filtered = filtered.filter((item) => {
        return (
          item.filename?.toLowerCase().includes(searchLower) ||
          (Array.isArray(item.tags) && item.tags.some((tag: string) => tag.toLowerCase().includes(searchLower)))
        )
      })
    }

    setFilteredMedia(filtered)
  }, [media, searchQuery, mediaTypeFilter, tagFilters, sourceFilters])

  const loadMedia = async () => {
    try {
      setLoading(true)

      let query = supabase.from("media").select("*")

      // Only apply initial type filter if we're not showing both
      if (!showImages && showVideos) {
        query = query.in("filetype", ["vimeo", "youtube", "linkedin", "video"])
      } else if (showImages && !showVideos) {
        query = query.eq("filetype", "image")
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
          // Check if we've reached the maximum number of selections
          if (prev.length >= maxSelections) {
            toast({
              title: "Selection limit reached",
              description: `You can only select up to ${maxSelections} items`,
              variant: "destructive",
            })
            return prev
          }
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

  // Determine if an item is a video
  const isVideo = (item: any) => {
    return (
      item.filetype === "vimeo" ||
      item.filetype === "youtube" ||
      item.filetype === "linkedin" ||
      item.filetype === "video"
    )
  }

  // Toggle a filter value
  const toggleFilter = (type: "mediaType" | "tag" | "source", value: string) => {
    if (type === "mediaType") {
      setMediaTypeFilter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
    } else if (type === "tag") {
      setTagFilters((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
    } else if (type === "source") {
      setSourceFilters((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setMediaTypeFilter([])
    setTagFilters([])
    setSourceFilters([])
    setSearchQuery("")
  }

  // Count active filters
  const activeFilterCount = useMemo(() => {
    return mediaTypeFilter.length + tagFilters.length + sourceFilters.length
  }, [mediaTypeFilter, tagFilters, sourceFilters])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={`justify-start ${className}`}>
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and filter bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
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

            {/* Filters */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <h4 className="font-medium">Filter Media</h4>

                  {/* Media Type Filter */}
                  {showImages && showVideos && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Media Type</h5>
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="filter-images"
                            checked={mediaTypeFilter.includes("image")}
                            onCheckedChange={() => toggleFilter("mediaType", "image")}
                          />
                          <Label htmlFor="filter-images">Images</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="filter-videos"
                            checked={mediaTypeFilter.includes("video")}
                            onCheckedChange={() => toggleFilter("mediaType", "video")}
                          />
                          <Label htmlFor="filter-videos">Videos</Label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tags Filter */}
                  {availableTags.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Tags</h5>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {availableTags.map((tag) => (
                          <Badge
                            key={tag}
                            variant={tagFilters.includes(tag) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleFilter("tag", tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Source Filter */}
                  {availableSources.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Source</h5>
                      <div className="flex flex-wrap gap-2">
                        {availableSources.map((source) => (
                          <Badge
                            key={source}
                            variant={sourceFilters.includes(source) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleFilter("source", source)}
                          >
                            {source}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Clear Filters */}
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full mt-2">
                      Clear All Filters
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Add Video URL (only if videos are enabled) */}
            {showVideos && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Film className="h-4 w-4 mr-2" />
                    Add Video
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <h4 className="font-medium">Add Video URL</h4>
                    <div className="flex flex-col gap-2">
                      <Input
                        placeholder="Enter Vimeo, YouTube, or LinkedIn video URL"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                      />
                      <Button onClick={handleAddVideoUrl} disabled={uploadingVideo} className="w-full">
                        {uploadingVideo ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Film className="h-4 w-4 mr-2" />
                        )}
                        Add Video
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter a Vimeo, YouTube, or LinkedIn video URL to add it to your media library.
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {/* Confirm Selection (only for multiple selection) */}
            {multiple && (
              <Button onClick={handleConfirmSelection} disabled={selectedItems.length === 0} size="sm">
                Confirm ({selectedItems.length})
              </Button>
            )}
          </div>

          {/* Active filters display */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-1 items-center">
              <span className="text-xs text-muted-foreground">Active filters:</span>
              {mediaTypeFilter.map((filter) => (
                <Badge key={filter} variant="secondary" className="text-xs">
                  {filter}
                  <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => toggleFilter("mediaType", filter)} />
                </Badge>
              ))}
              {tagFilters.map((filter) => (
                <Badge key={filter} variant="secondary" className="text-xs">
                  {filter}
                  <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => toggleFilter("tag", filter)} />
                </Badge>
              ))}
              {sourceFilters.map((filter) => (
                <Badge key={filter} variant="secondary" className="text-xs">
                  {filter}
                  <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => toggleFilter("source", filter)} />
                </Badge>
              ))}
              <Button variant="ghost" size="sm" className="h-5 text-xs px-1.5" onClick={clearFilters}>
                Clear all
              </Button>
            </div>
          )}

          {/* Media Grid */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="mx-auto h-12 w-12 mb-2 opacity-20 flex justify-center">
                  {mediaTypeFilter.includes("video") && !mediaTypeFilter.includes("image") ? (
                    <Film className="h-12 w-12" />
                  ) : (
                    <ImageIcon className="h-12 w-12" />
                  )}
                </div>
                <p>No media found</p>
                <p className="text-sm">Try adjusting your filters or search</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredMedia.map((item) => {
                  const itemIsVideo = isVideo(item)
                  const thumbnailUrl = itemIsVideo ? getVideoThumbnail(item) : null

                  return (
                    <div
                      key={item.id}
                      className={`relative ${itemIsVideo ? "aspect-video" : "aspect-square"} rounded-md overflow-hidden border cursor-pointer transition-all ${
                        selectedItems.includes(item.public_url)
                          ? "ring-2 ring-primary border-primary"
                          : "hover:opacity-90"
                      }`}
                      onClick={() => handleSelect(item.public_url)}
                    >
                      {itemIsVideo ? (
                        thumbnailUrl ? (
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
                        )
                      ) : (
                        <img
                          src={item.public_url || "/placeholder.svg"}
                          alt={item.filename}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg"
                          }}
                        />
                      )}

                      {selectedItems.includes(item.public_url) && (
                        <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="h-4 w-4" />
                        </div>
                      )}

                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-1 text-xs">
                        <div className="truncate">{item.filename}</div>
                        {item.filetype && (
                          <div className="flex items-center gap-1 mt-0.5">
                            {itemIsVideo ? <Film className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}
                            <span className="text-[10px] opacity-80">{item.filetype}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Default export for backward compatibility
export default MediaSelector
