"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Search, Film, X } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import Image from "next/image"

interface MediaSelectorProps {
  onSelect: (media: any) => void
  currentValue?: string
  mediaType?: "all" | "images" | "videos"
  buttonLabel?: string
  showPreview?: boolean
}

export default function MediaSelector({
  onSelect,
  currentValue = "",
  mediaType = "all",
  buttonLabel = "Select Media",
  showPreview = true,
}: MediaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mediaItems, setMediaItems] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMediaType, setSelectedMediaType] = useState<"all" | "images" | "videos">(mediaType)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const supabase = createClientComponentClient()

  // Load the current media item if there's a currentValue
  useEffect(() => {
    if (currentValue) {
      loadCurrentMedia()
    }
  }, [currentValue])

  // Load media items when the dialog opens
  useEffect(() => {
    if (isOpen) {
      loadMediaItems()
    }
  }, [isOpen, searchQuery, selectedMediaType])

  const loadCurrentMedia = async () => {
    try {
      // First try to find by URL
      const { data, error } = await supabase.from("media").select("*").eq("public_url", currentValue).maybeSingle()

      if (error) {
        console.error("Error loading current media:", error)
        return
      }

      // If not found by URL, it might be a local path
      if (!data) {
        // Just create a placeholder object
        setSelectedItem({
          id: "local",
          name: currentValue.split("/").pop() || "Current media",
          public_url: currentValue,
          content_type: currentValue.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? "image/unknown" : "video/unknown",
        })
        return
      }

      setSelectedItem(data)
    } catch (err) {
      console.error("Error loading current media:", err)
    }
  }

  const loadMediaItems = async () => {
    try {
      setIsLoading(true)

      let query = supabase.from("media").select("*")

      // Filter by media type if selected
      if (selectedMediaType === "images") {
        query = query.ilike("filetype", "image/%")
      } else if (selectedMediaType === "videos") {
        query = query.or("filetype.eq.vimeo,filetype.eq.youtube,filetype.eq.linkedin")
      }

      // Apply search query if provided
      if (searchQuery) {
        query = query.or(`filename.ilike.%${searchQuery}%,tags.ilike.%${searchQuery}%`)
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
    setSelectedItem(item)
    onSelect(item.public_url)
    setIsOpen(false)

    toast({
      title: "Media selected",
      description: `${item.filename} has been selected`,
    })
  }

  const clearSelection = () => {
    setSelectedItem(null)
    onSelect(null)

    toast({
      title: "Selection cleared",
      description: "Media selection has been cleared",
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" onClick={() => setIsOpen(true)} className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          {buttonLabel}
        </Button>

        {selectedItem && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            className="flex items-center gap-1 text-red-500 hover:text-red-700 hover:bg-red-100"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {showPreview && selectedItem && (
        <div className="mt-2">
          <p className="text-xs text-gray-400 mb-1">Selected media:</p>
          <div className="relative bg-gray-900/50 rounded-lg p-2 w-full max-w-xs">
            {selectedItem.content_type.startsWith("image/") ? (
              <Image
                src={selectedItem.public_url || "/placeholder.svg"}
                alt={selectedItem.name}
                fill
                className="w-full h-auto object-contain"
                sizes="100%"
              />
            ) : (
              <div className="aspect-video bg-gray-900 flex items-center justify-center rounded">
                <Film className="h-12 w-12 text-gray-400" />
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gray-900/80 text-xs truncate">
                  {selectedItem.name}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Media Library Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Media Library</DialogTitle>
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
                    className="relative border rounded-md overflow-hidden cursor-pointer hover:border-primary transition-colors"
                    onClick={() => selectMediaItem(item)}
                  >
                    {item.content_type.startsWith("image/") ? (
                      <div className="aspect-square bg-gray-100">
                        <Image
                          src={item.public_url || "/placeholder.svg"}
                          alt={item.filename}
                          fill
                          className="w-full h-full object-cover"
                          sizes="100%"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-gray-900 flex items-center justify-center">
                        <Film className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    <div className="p-2 bg-gray-900/80 absolute bottom-0 left-0 right-0 text-xs truncate">
                      {item.filename}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
