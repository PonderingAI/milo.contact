"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2, Film, ImageIcon, Plus } from "lucide-react"
import MediaSelector from "@/components/admin/media-selector"

interface UnifiedMediaInputProps {
  identifier: string
  onMediaAdded: (url: string | string[]) => void
  onVideoUrlSubmit?: (url: string) => void
  folder?: string
  isLoading?: boolean
  multiple?: boolean
  title?: string
  description?: string
}

export default function UnifiedMediaInput({
  identifier,
  onMediaAdded,
  onVideoUrlSubmit,
  folder = "media",
  isLoading = false,
  multiple = false,
  title,
  description,
}: UnifiedMediaInputProps) {
  const [videoUrl, setVideoUrl] = useState("")
  const [isMediaSelectorOpen, setIsMediaSelectorOpen] = useState(false)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const handleVideoUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (videoUrl.trim() && onVideoUrlSubmit) {
      onVideoUrlSubmit(videoUrl)
      setVideoUrl("")
    }
  }

  const defaultTitle = identifier === "main" ? "Main Media" : identifier === "bts" ? "Behind the Scenes" : "Media"
  const defaultDescription =
    identifier === "main"
      ? "Add main project images and videos"
      : identifier === "bts"
        ? "Add behind the scenes content"
        : "Select media from your library"

  return (
    <Card className="border-gray-800 bg-[#070a10]">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl text-gray-200">{title || defaultTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-400">{description || defaultDescription}</p>

        {/* Media Library Button */}
        <div className="grid grid-cols-1 gap-4">
          <Button
            variant="outline"
            className="w-full h-auto py-6 border-dashed border-gray-700 bg-[#0f1520] hover:bg-[#161f30]"
            onClick={() => setIsMediaSelectorOpen(true)}
            disabled={isLoading}
          >
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center justify-center mb-2">
                <ImageIcon className="h-6 w-6 mr-2 text-gray-400" />
                <Film className="h-6 w-6 text-gray-400" />
              </div>
              <span className="text-gray-300">Select from Media Library</span>
              <span className="text-xs text-gray-500 mt-1">Images, videos, and more</span>
            </div>
          </Button>

          {/* Media Selector Dialog */}
          <MediaSelector
            open={isMediaSelectorOpen}
            onOpenChange={setIsMediaSelectorOpen}
            onSelect={onMediaAdded}
            multiple={multiple}
          />
        </div>

        {/* Video URL Input */}
        {onVideoUrlSubmit && (
          <form onSubmit={handleVideoUrlSubmit} className="mt-4">
            <div className="flex items-center space-x-2">
              <Input
                ref={videoInputRef}
                type="url"
                placeholder="Paste YouTube, Vimeo, or LinkedIn video URL"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="flex-1 border-gray-800 bg-[#0f1520] text-gray-200"
                disabled={isLoading}
              />
              <Button
                type="submit"
                variant="outline"
                size="icon"
                disabled={!videoUrl.trim() || isLoading}
                className="border-gray-800 bg-[#0f1520] hover:bg-[#161f30]"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
