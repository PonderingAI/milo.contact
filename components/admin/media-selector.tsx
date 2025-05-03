"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Loader2, Search, Film, X, Check } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface MediaSelectorProps {
  onSelect: (media: string | string[]) => void
  currentValue?: string | string[]
  mediaType?: "all" | "images" | "videos"
  buttonLabel?: string
  showPreview?: boolean
  multiple?: boolean
}

export default function MediaSelector({
  onSelect,
  currentValue = "",
  mediaType = "all",
  buttonLabel = "Select Media",
  showPreview = true,
  multiple = false,
}: MediaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mediaItems, setMediaItems] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMediaType, setSelectedMediaType] = useState<"all" | "images" | "videos">(mediaType)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [selectedItems, setSelectedItems] = useState<any[]>([])
  const supabase = createClientComponentClient()

  // Load the current media item if there's a currentValue
  useEffect(() => {
    if (currentValue) {
      if (multiple && Array.isArray(currentValue)) {
        // Handle multiple values
        Promise.all(currentValue.map((url) => loadMediaItem(url))).then((items) => {
          setSelectedItems(items.filter(Boolean))
        })
      } else if (!multiple && typeof currentValue === "string") {
        // Handle single value
        loadCurrentMedia(currentValue)
      }
    }
  }, [currentValue])

  // Load media items when the dialog opens
  useEffect(() => {
    if (isOpen) {
      loadMediaItems()
    }
  }, [isOpen, searchQuery, selectedMediaType])

  const loadMediaItem = async (url: string) => {
    try {
      if (!url) return null

      // Check if it's a URL or a local path
      if (url.startsWith("http")) {
        // Try to find by public_url
        const { data, error } = await supabase.from("media").select("*").eq("public_url", url).maybeSingle()

        if (error) {
          console.error("Error loading media item:", error)
          return null
        }

        if (data) {
          return data
        }
      }

      // If not found or it's a local path, create a placeholder
      return {
        id: `local-${url}`,
        filename: url.split("/").pop() || "Media item",
        public_url: url,
        filetype: url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? "image" : "video",
      }
    } catch (err) {
      console.error("Error loading media item:", err)
      return null
    }
  }

  const loadCurrentMedia = async (url: string) => {
    try {
      const item = await loadMediaItem(url)
      if (item) {
        setSelectedItem(item)
      }
    } catch (err) {
      console.error("Error loading current media:", err)
    }
  }

  const loadMediaItems = async () => {
    try {
      setIsLoading(true)

      // First check if the media table exists
      const { error: checkError } = await supabase.from("media").select("count").limit(1)

      if (checkError && checkError.code === "42P01") {
        // Table doesn't exist
        toast({
          title: "Media table not found",
          description: "The media table doesn't exist in your database. Please set up your database first.",
          variant: "destructive",
        })
        setMediaItems([])
        setIsLoading(false)
        return
      }

      let query = supabase.from("media").select("*")

      // Filter by media type if selected
      if (selectedMediaType === "images") {
        query = query.eq("filetype", "image")
      } else if (selectedMediaType === "videos") {
        query = query.in("filetype", ["vimeo", "youtube", "linkedin"])
      }

      // Apply search query if provided
      if (searchQuery) {
        query = query.or(`filename.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`)
      }

      // Order by most recent first
      query = query.order("created_at", { ascending: false })

      const { data, error } = await query

      if (error) {
        throw error
      }

      setMediaItems(data || [])
    } catch (error: any) {
      console.error("Error loading media items:", error)
      toast({
        title: "Error loading media",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectMediaItem = (item: any) => {
    if (multiple) {
      // For multiple selection, toggle the item in the selectedItems array
      const isAlreadySelected = selectedItems.some((selectedItem) => selectedItem.id === item.id)

      if (isAlreadySelected) {
        setSelectedItems(selectedItems.filter((selectedItem) => selectedItem.id !== item.id))
      } else {
        setSelectedItems([...selectedItems, item])
      }
    } else {
      // For single selection, set the item and close the dialog
      setSelectedItem(item)
      onSelect(item.public_url)
      setIsOpen(false)

      toast({
        title: "Media selected",
        description: `${item.filename} has been selected`,
      })
    }
  }

  const confirmMultipleSelection = () => {
    const urls = selectedItems.map((item) => item.public_url)
    onSelect(urls)
    setIsOpen(false)

    toast({
      title: "Media selected",
      description: `${selectedItems.length} items have been selected`,
    })
  }

  const clearSelection = () => {
    if (multiple) {
      setSelectedItems([])
      onSelect([])
    } else {
      setSelectedItem(null)
      onSelect("")
    }

    toast({
      title: "Selection cleared",
      description: "Media selection has been cleared",
    })
  }

  const isItemSelected = (item: any) => {
    if (multiple) {
      return selectedItems.some((selectedItem) => selectedItem.id === item.id)
    }
    return selectedItem?.id === item.id
  }

  const isImageType = (item: any) => {
    return item?.filetype === "image"
  }

  const isVideoType = (item: any) => {
    return ["vimeo", "youtube", "linkedin"].includes(item?.filetype)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" onClick={() => setIsOpen(true)} className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          {buttonLabel}
        </Button>

        {((multiple && selectedItems.length > 0) || (!multiple && selectedItem)) && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            className="flex items-center gap-1 text-red-500 hover:text-red-700 hover:bg-red-100/10"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {showPreview && !multiple && selectedItem && (
        <div className="mt-2">
          <p className="text-xs text-gray-400 mb-1">Selected media:</p>
          <div className="relative bg-gray-900/50 rounded-lg p-2 w-full max-w-xs">
            {isImageType(selectedItem) ? (
              <img
                src={selectedItem.public_url || "/placeholder.svg"}
                alt={selectedItem.filename}
                className="w-full h-auto rounded"
              />
            ) : (
              <div className="aspect-video bg-gray-900 flex items-center justify-center rounded">
                <Film className="h-12 w-12 text-gray-400" />
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gray-900/80 text-xs truncate">
                  {selectedItem.filename}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showPreview && multiple && selectedItems.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-400 mb-1">Selected media ({selectedItems.length}):</p>
          <div className="grid grid-cols-3 gap-2">
            {selectedItems.map((item) => (
              <div key={item.id} className="relative bg-gray-900/50 rounded-lg p-1">
                {isImageType(item) ? (
                  <img
                    src={item.public_url || "/placeholder.svg"}
                    alt={item.filename}
                    className="w-full h-auto aspect-square object-cover rounded"
                  />
                ) : (
                  <div className="aspect-square bg-gray-900 flex items-center justify-center rounded">
                    <Film className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <button
                  className="absolute top-0 right-0 bg-red-500 rounded-full p-0.5 m-1"
                  onClick={() => selectMediaItem(item)}
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Media Library Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Media Library</DialogTitle>
            <DialogDescription>{multiple ? "Select multiple media items" : "Select a media item"}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search media..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedMediaType === "all" ? "default" : "outline"}
                  onClick={() => setSelectedMediaType("all")}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={selectedMediaType === "images" ? "default" : "outline"}
                  onClick={() => setSelectedMediaType("images")}
                  size="sm"
                >
                  Images
                </Button>
                <Button
                  variant={selectedMediaType === "videos" ? "default" : "outline"}
                  onClick={() => setSelectedMediaType("videos")}
                  size="sm"
                >
                  Videos
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : mediaItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No media found. Upload some media first.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {mediaItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "relative border rounded-md overflow-hidden cursor-pointer transition-colors",
                      isItemSelected(item)
                        ? "border-blue-500 ring-2 ring-blue-500"
                        : "border-gray-800 hover:border-blue-500",
                    )}
                    onClick={() => selectMediaItem(item)}
                  >
                    <div className="aspect-square bg-gray-900 flex items-center justify-center">
                      {item.thumbnail_url ? (
                        <img
                          src={item.thumbnail_url || "/placeholder.svg"}
                          alt={item.filename}
                          className="w-full h-full object-cover"
                        />
                      ) : isImageType(item) ? (
                        <div className="relative w-full h-full">
                          <img
                            src={item.public_url || "/placeholder.svg"}
                            alt={item.filename}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <Film className="h-12 w-12 text-gray-400" />
                      )}

                      {isVideoType(item) && (
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

                      {isItemSelected(item) && (
                        <div className="absolute top-2 left-2 bg-blue-500 rounded-full p-1">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="p-2 bg-gray-900 text-xs truncate">{item.filename}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {multiple && (
            <DialogFooter>
              <div className="flex justify-between w-full">
                <div className="text-sm text-gray-400">
                  {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""} selected
                </div>
                <Button onClick={confirmMultipleSelection} disabled={selectedItems.length === 0}>
                  Confirm Selection
                </Button>
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
