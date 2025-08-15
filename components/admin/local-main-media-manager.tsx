"use client"

import React, { useState, useEffect } from 'react'
import { X, Eye, EyeOff, ImageIcon, Film } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface LocalMainMediaItem {
  url: string
  isVideo: boolean
  isHidden: boolean
  thumbnailUrl?: string
}

interface LocalMainMediaManagerProps {
  mainImages: string[]
  mainVideos: string[]
  onCoverImageSelect: (url: string) => void
  onRemoveImage: (index: number) => void
  onRemoveVideo: (index: number) => void
  coverImageUrl?: string
}

export default function LocalMainMediaManager({ 
  mainImages, 
  mainVideos, 
  onCoverImageSelect, 
  onRemoveImage,
  onRemoveVideo,
  coverImageUrl 
}: LocalMainMediaManagerProps) {
  const [hiddenThumbnails, setHiddenThumbnails] = useState<Set<string>>(new Set())

  // Create local media items from props
  const localMediaItems: LocalMainMediaItem[] = [
    ...mainImages.map(url => ({ url, isVideo: false, isHidden: hiddenThumbnails.has(url) })),
    ...mainVideos.map(url => ({ url, isVideo: true, isHidden: false })) // Videos are never hidden
  ]

  // Get video thumbnails - for YouTube and Vimeo we can extract thumbnails
  const getVideoThumbnail = (videoUrl: string): string | null => {
    if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
      const videoId = videoUrl.includes("youtube.com") 
        ? videoUrl.split("v=")[1]?.split("&")[0]
        : videoUrl.split("youtu.be/")[1]?.split("?")[0]
      return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null
    }
    // For Vimeo, we'd need to make an API call, so we'll show a placeholder
    return null
  }

  const toggleThumbnailVisibility = (url: string) => {
    setHiddenThumbnails(prev => {
      const newSet = new Set(prev)
      if (newSet.has(url)) {
        newSet.delete(url)
        toast({
          title: "Thumbnail shown",
          description: "Thumbnail will be visible in the project"
        })
      } else {
        newSet.add(url)
        toast({
          title: "Thumbnail hidden",
          description: "Thumbnail will be hidden in the project"
        })
      }
      return newSet
    })
  }

  const removeMediaItem = (item: LocalMainMediaItem) => {
    if (item.isVideo) {
      const videoIndex = mainVideos.indexOf(item.url)
      if (videoIndex !== -1) {
        onRemoveVideo(videoIndex)
      }
    } else {
      const imageIndex = mainImages.indexOf(item.url)
      if (imageIndex !== -1) {
        onRemoveImage(imageIndex)
      }
    }
  }

  // Separate visible and hidden items
  const visibleItems = localMediaItems.filter(item => !item.isHidden)
  const hiddenItems = localMediaItems.filter(item => item.isHidden)

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-300 border-b border-gray-800 pb-2">
        Main Media
      </h3>

      {/* Visible Media */}
      {visibleItems.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 text-gray-400">Visible Media</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {visibleItems.map((item, index) => (
                             <LocalMediaItemCard
                 key={`visible-${item.url}-${index}`}
                 item={item}
                 isSelected={coverImageUrl === item.url || (item.isVideo && coverImageUrl === getVideoThumbnail(item.url))}
                 onToggleVisibility={toggleThumbnailVisibility}
                 onRemove={removeMediaItem}
                 onSelectAsCover={onCoverImageSelect}
                 getVideoThumbnail={getVideoThumbnail}
               />
            ))}
          </div>
        </div>
      )}

      {/* Hidden Thumbnails */}
      {hiddenItems.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 text-gray-400 flex items-center gap-2">
            <EyeOff size={16} />
            Hidden Thumbnails
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {hiddenItems.map((item, index) => (
                             <LocalMediaItemCard
                 key={`hidden-${item.url}-${index}`}
                 item={item}
                 isSelected={coverImageUrl === item.url || (item.isVideo && coverImageUrl === getVideoThumbnail(item.url))}
                 onToggleVisibility={toggleThumbnailVisibility}
                 onRemove={removeMediaItem}
                 onSelectAsCover={onCoverImageSelect}
                 getVideoThumbnail={getVideoThumbnail}
                 isHidden={true}
               />
            ))}
          </div>
        </div>
      )}

      {localMediaItems.length === 0 && (
        <div className="text-center py-4 text-gray-400">
          <p>No main media added yet</p>
        </div>
      )}
    </div>
  )
}

interface LocalMediaItemCardProps {
  item: LocalMainMediaItem
  isSelected: boolean
  onToggleVisibility: (url: string) => void
  onRemove: (item: LocalMainMediaItem) => void
  onSelectAsCover: (url: string) => void
  getVideoThumbnail: (url: string) => string | null
  isHidden?: boolean
}

function LocalMediaItemCard({ 
  item, 
  isSelected, 
  onToggleVisibility, 
  onRemove, 
  onSelectAsCover,
  getVideoThumbnail,
  isHidden = false
}: LocalMediaItemCardProps) {
  const [vimeoThumbnail, setVimeoThumbnail] = useState<string | null>(null)

  // Load Vimeo thumbnail if it's a Vimeo video
  useEffect(() => {
    if (item.isVideo && item.url.includes("vimeo.com")) {
      const loadVimeoThumbnail = async () => {
        try {
          const videoId = item.url.match(/vimeo\.com\/(\d+)/)?.[1]
          if (videoId) {
            const response = await fetch(`https://vimeo.com/api/v2/video/${videoId}.json`)
            if (response.ok) {
              const data = await response.json()
              if (data[0]?.thumbnail_large) {
                setVimeoThumbnail(data[0].thumbnail_large)
              }
            }
          }
        } catch (error) {
          console.error("Error loading Vimeo thumbnail:", error)
        }
      }
      loadVimeoThumbnail()
    }
  }, [item.url, item.isVideo])

  const displayUrl = item.isVideo ? (getVideoThumbnail(item.url) || vimeoThumbnail) : item.url

  return (
    <div className={`relative group ${isHidden ? 'opacity-60' : ''}`}>
      <div
        className={`aspect-video bg-[#0f1520] rounded-md overflow-hidden ${
          isSelected ? "ring-2 ring-blue-500" : ""
        }`}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt={item.isVideo ? "Video thumbnail" : "Image"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            {item.isVideo ? <Film size={24} /> : <ImageIcon size={24} />}
          </div>
        )}
        
        {/* Video play icon overlay */}
        {item.isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/60 rounded-full p-2">
              <Film size={20} className="text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Hover controls */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        {/* Eye icon toggle - only show for images (thumbnails) */}
        {!item.isVideo && (
          <button
            type="button"
            onClick={() => onToggleVisibility(item.url)}
            className="p-1 bg-gray-600 rounded-full hover:bg-gray-700"
            title={isHidden ? "Show thumbnail" : "Hide thumbnail"}
          >
            {isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        )}
        
        {/* Set as cover button */}
        <button
          type="button"
          onClick={() => onSelectAsCover(item.isVideo ? (displayUrl || item.url) : item.url)}
          className="p-1 bg-blue-600 rounded-full hover:bg-blue-700"
          title="Set as cover image"
        >
          <ImageIcon size={14} />
        </button>
        
        {/* Remove button */}
        <button
          type="button"
          onClick={() => onRemove(item)}
          className="p-1 bg-red-600 rounded-full hover:bg-red-700"
          title="Remove"
        >
          <X size={14} />
        </button>
      </div>

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-sm">
          Cover
        </div>
      )}
      
      {/* Hidden indicator */}
      {isHidden && (
        <div className="absolute top-1 right-1 bg-gray-600 text-white text-xs px-1.5 py-0.5 rounded-sm">
          Hidden
        </div>
      )}
    </div>
  )
} 