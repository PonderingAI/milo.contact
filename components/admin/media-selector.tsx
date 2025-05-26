"use client"

/**
 * Universal Media Selector Component
 *
 * This component provides a flexible media selection interface with filtering, search,
 * and multiple selection capabilities.
 *
 * IMPLEMENTATION OPTIONS:
 *
 * 1. Direct usage (one-click open):
 *    <MediaSelector
 *      open={isOpen}
 *      onOpenChange={setIsOpen}
 *      onSelect={handleMediaSelect}
 *    />
 *
 * 2. With a trigger button:
 *    <MediaSelector
 *      buttonLabel="Select Media"
 *      onSelect={handleMediaSelect}
 *    />
 *
 * 3. Inside another component:
 *    <Button onClick={() => setIsOpen(true)}>Open Media</Button>
 *    <MediaSelector
 *      open={isOpen}
 *      onOpenChange={setIsOpen}
 *      onSelect={handleMediaSelect}
 *    />
 *
 * COMMON PROPS:
 * - onSelect: (url: string | string[]) => void - Required callback when media is selected
 * - multiple: boolean - Allow selecting multiple items (default: false)
 * - showImages: boolean - Show image media (default: true)
 * - showVideos: boolean - Show video media (default: true)
 * - squareVideos: boolean - Crop videos to square aspect ratio (default: false)
 * - maxSelections: number - Maximum number of items that can be selected (default: 100)
 *
 * ADVANCED PROPS:
 * - currentValue: string | string[] - Pre-selected media items
 * - className: string - Additional CSS classes for the trigger button
 * - buttonLabel: string - Text for the trigger button (if using option 2)
 * - open: boolean - Controlled open state (if using option 1 or 3)
 * - onOpenChange: (open: boolean) => void - Controlled state handler
 * - initialGridSize: number - Initial size of grid items (50-150, default: 100)
 */

import { useState, useEffect, useMemo } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Loader2, Search, X, Check, Film, ImageIcon, Grid3X3 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"

interface MediaSelectorProps {
  onSelect: (url: string | string[]) => void
  currentValue?: string | string[]
  showImages?: boolean
  showVideos?: boolean
  multiple?: boolean
  squareVideos?: boolean
  buttonLabel?: string
  maxSelections?: number
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  initialGridSize?: number
}

export function MediaSelector({
  onSelect,
  currentValue = "",
  showImages = true,
  showVideos = true,
  multiple = false,
  squareVideos = false,
  buttonLabel,
  maxSelections = 100,
  className = "",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  initialGridSize = 100,
}: MediaSelectorProps) {
  // Use controlled state if provided, otherwise use internal state
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen

  const [loading, setLoading] = useState(false)
  const [media, setMedia] = useState<any[]>([])
  const [filteredMedia, setFilteredMedia] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [gridSize, setGridSize] = useState(initialGridSize)

  // Filtering state
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string[]>([])
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

  // Calculate grid columns based on grid size
  const gridColumns = useMemo(() => {
    // Smaller grid size = more columns
    if (gridSize <= 60) return "grid-cols-8 md:grid-cols-10 lg:grid-cols-12"
    if (gridSize <= 80) return "grid-cols-6 md:grid-cols-8 lg:grid-cols-10"
    if (gridSize <= 100) return "grid-cols-4 md:grid-cols-6 lg:grid-cols-8"
    if (gridSize <= 120) return "grid-cols-3 md:grid-cols-5 lg:grid-cols-6"
    return "grid-cols-2 md:grid-cols-4 lg:grid-cols-5"
  }, [gridSize])

  // If we have a button label, render with trigger
  if (controlledOpen === undefined && buttonLabel) {
    return (
      <>
        <Button variant="outline" className={`justify-start ${className}`} onClick={() => setOpen(true)}>
          {buttonLabel}
        </Button>
        <MediaSelectorDialog />
      </>
    )
  }

  // Otherwise just render the dialog
  return <MediaSelectorDialog />

  function MediaSelectorDialog() {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[90vw] w-[1200px] h-[85vh] p-0 overflow-hidden">
          <div className="flex flex-col h-full">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle>Media Library</DialogTitle>
              <DialogDescription>
                Select media items from your library. {multiple ? "You can select multiple items." : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar with filters */}
              <div className="w-64 border-r p-4 overflow-y-auto">
                <div className="space-y-6">
                  {/* Search */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search media..."
                        className="pl-8 h-9"
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

                  {/* Grid Size Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-medium">Grid Size</Label>
                      <div className="flex items-center gap-2">
                        <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{gridSize}px</span>
                      </div>
                    </div>
                    <Slider
                      value={[gridSize]}
                      min={50}
                      max={150}
                      step={10}
                      onValueChange={(value) => setGridSize(value[0])}
                      className="w-full"
                    />
                  </div>

                  {/* Media Type Filter */}
                  {showImages && showVideos && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Media Type</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="filter-images"
                            checked={mediaTypeFilter.includes("image")}
                            onCheckedChange={() => toggleFilter("mediaType", "image")}
                          />
                          <Label htmlFor="filter-images" className="text-sm font-normal cursor-pointer">
                            Images
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="filter-videos"
                            checked={mediaTypeFilter.includes("video")}
                            onCheckedChange={() => toggleFilter("mediaType", "video")}
                          />
                          <Label htmlFor="filter-videos" className="text-sm font-normal cursor-pointer">
                            Videos
                          </Label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Source Filter */}
                  {availableSources.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Source</Label>
                      <div className="space-y-2">
                        {availableSources.map((source) => (
                          <div key={source} className="flex items-center space-x-2">
                            <Checkbox
                              id={`source-${source}`}
                              checked={sourceFilters.includes(source)}
                              onCheckedChange={() => toggleFilter("source", source)}
                            />
                            <Label htmlFor={`source-${source}`} className="text-sm font-normal cursor-pointer">
                              {source.charAt(0).toUpperCase() + source.slice(1)}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags Filter */}
                  {availableTags.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Tags</Label>
                      <ScrollArea className="h-48">
                        <div className="space-y-2">
                          {availableTags.map((tag) => (
                            <div key={tag} className="flex items-center space-x-2">
                              <Checkbox
                                id={`tag-${tag}`}
                                checked={tagFilters.includes(tag)}
                                onCheckedChange={() => toggleFilter("tag", tag)}
                              />
                              <Label htmlFor={`tag-${tag}`} className="text-sm font-normal cursor-pointer">
                                {tag}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}

                  {/* Clear Filters */}
                  {activeFilterCount > 0 && (
                    <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
                      Clear All Filters ({activeFilterCount})
                    </Button>
                  )}
                </div>
              </div>

              {/* Main content area */}
              <div className="flex-1 flex flex-col">
                {/* Header with selection info */}
                <div className="px-6 py-3 border-b flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {loading ? "Loading..." : `${filteredMedia.length} items`}
                    {selectedItems.length > 0 && ` • ${selectedItems.length} selected`}
                  </div>

                  {/* Confirm Selection (only for multiple selection) */}
                  {multiple && (
                    <Button onClick={handleConfirmSelection} disabled={selectedItems.length === 0} size="sm">
                      Confirm Selection ({selectedItems.length})
                    </Button>
                  )}
                </div>

                {/* Media Grid */}
                <ScrollArea className="flex-1 p-6">
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
                    <div className={`grid ${gridColumns} gap-4`}>
                      {filteredMedia.map((item) => {
                        const itemIsVideo = isVideo(item)
                        const thumbnailUrl = itemIsVideo ? getVideoThumbnail(item) : null

                        return (
                          <div
                            key={item.id}
                            className={`relative aspect-square rounded-md overflow-hidden border cursor-pointer transition-all ${
                              selectedItems.includes(item.public_url)
                                ? "ring-2 ring-primary border-primary"
                                : "hover:opacity-90"
                            }`}
                            style={{ width: `${gridSize}px`, height: `${gridSize}px` }}
                            onClick={() => handleSelect(item.public_url)}
                          >
                            {itemIsVideo ? (
                              thumbnailUrl ? (
                                <div className="w-full h-full relative">
                                  <img
                                    src={thumbnailUrl || "/placeholder.svg"}
                                    alt={item.filename}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = "/placeholder.svg"
                                    }}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-black/30 rounded-full p-2">
                                      <Film className="h-5 w-5 text-white" />
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                                  <Film className="h-8 w-8 text-gray-400" />
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

                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-1">
                              <div className="truncate text-xs">{item.filename}</div>
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
                </ScrollArea>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }
}

// Default export for backward compatibility
export default MediaSelector
