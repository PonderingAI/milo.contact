"use client"

import React, { useState, useEffect } from 'react'
import { X, Eye, EyeOff, ImageIcon, Film } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface MainMediaItem {
  id: string
  image_url: string
  caption?: string
  is_video: boolean
  video_url?: string
  video_platform?: string
  video_id?: string
  display_order: number
  is_thumbnail_hidden?: boolean
}

interface MainMediaManagerProps {
  projectId: string
  onCoverImageSelect: (url: string) => void
  coverImageUrl?: string
}

export default function MainMediaManager({ 
  projectId, 
  onCoverImageSelect, 
  coverImageUrl 
}: MainMediaManagerProps) {
  const [mainMedia, setMainMedia] = useState<MainMediaItem[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch main media from database
  useEffect(() => {
    if (projectId) {
      fetchMainMedia()
    }
  }, [projectId])

  const fetchMainMedia = async () => {
    try {
      const response = await fetch(`/api/projects/main-media/${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setMainMedia(data.data || [])
      } else {
        console.error('Failed to fetch main media')
      }
    } catch (error) {
      console.error('Error fetching main media:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleThumbnailVisibility = async (mediaId: string, currentlyHidden: boolean) => {
    try {
      const response = await fetch('/api/projects/main-media/toggle-visibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaId,
          isHidden: !currentlyHidden
        })
      })

      if (response.ok) {
        // Update local state
        setMainMedia(prev => prev.map(item => 
          item.id === mediaId 
            ? { ...item, is_thumbnail_hidden: !currentlyHidden }
            : item
        ))
        
        toast({
          title: "Success",
          description: `Thumbnail ${!currentlyHidden ? 'hidden' : 'shown'} successfully`
        })
      } else {
        throw new Error('Failed to update thumbnail visibility')
      }
    } catch (error) {
      console.error('Error toggling thumbnail visibility:', error)
      toast({
        title: "Error",
        description: "Failed to update thumbnail visibility",
        variant: "destructive"
      })
    }
  }

  const removeMediaItem = async (mediaId: string) => {
    try {
      const response = await fetch(`/api/projects/main-media/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mediaId })
      })

      if (response.ok) {
        setMainMedia(prev => prev.filter(item => item.id !== mediaId))
        toast({
          title: "Success",
          description: "Media item removed successfully"
        })
      } else {
        throw new Error('Failed to remove media item')
      }
    } catch (error) {
      console.error('Error removing media item:', error)
      toast({
        title: "Error",
        description: "Failed to remove media item",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-300 border-b border-gray-800 pb-2">
          Main Media
        </h3>
        <div className="text-center py-4 text-gray-400">
          Loading media...
        </div>
      </div>
    )
  }

  // Separate visible and hidden items
  const visibleItems = mainMedia.filter(item => !item.is_thumbnail_hidden)
  const hiddenItems = mainMedia.filter(item => item.is_thumbnail_hidden)

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
            {visibleItems.map((item) => (
              <MediaItemCard
                key={item.id}
                item={item}
                isSelected={coverImageUrl === item.image_url}
                onToggleVisibility={toggleThumbnailVisibility}
                onRemove={removeMediaItem}
                onSelectAsCover={onCoverImageSelect}
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
            {hiddenItems.map((item) => (
              <MediaItemCard
                key={item.id}
                item={item}
                isSelected={coverImageUrl === item.image_url}
                onToggleVisibility={toggleThumbnailVisibility}
                onRemove={removeMediaItem}
                onSelectAsCover={onCoverImageSelect}
                isHidden={true}
              />
            ))}
          </div>
        </div>
      )}

      {mainMedia.length === 0 && (
        <div className="text-center py-4 text-gray-400">
          <p>No main media added yet</p>
        </div>
      )}
    </div>
  )
}

interface MediaItemCardProps {
  item: MainMediaItem
  isSelected: boolean
  onToggleVisibility: (mediaId: string, currentlyHidden: boolean) => void
  onRemove: (mediaId: string) => void
  onSelectAsCover: (url: string) => void
  isHidden?: boolean
}

function MediaItemCard({ 
  item, 
  isSelected, 
  onToggleVisibility, 
  onRemove, 
  onSelectAsCover,
  isHidden = false
}: MediaItemCardProps) {
  return (
    <div className={`relative group ${isHidden ? 'opacity-60' : ''}`}>
      <div
        className={`aspect-video bg-[#0f1520] rounded-md overflow-hidden ${
          isSelected ? "ring-2 ring-blue-500" : ""
        }`}
      >
        {item.is_video ? (
          <div className="w-full h-full flex items-center justify-center relative">
            <img
              src={item.image_url || "/placeholder.svg"}
              alt={item.caption || "Video thumbnail"}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/50 rounded-full p-2">
                <Film size={20} className="text-white" />
              </div>
            </div>
          </div>
        ) : (
          <img
            src={item.image_url || "/placeholder.svg"}
            alt={item.caption || "Media item"}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
        {/* Eye toggle button - only show for non-video items (thumbnails) */}
        {!item.is_video && (
          <button
            type="button"
            onClick={() => onToggleVisibility(item.id, item.is_thumbnail_hidden || false)}
            className="p-1 bg-gray-600 rounded-full hover:bg-gray-700"
            title={item.is_thumbnail_hidden ? "Show thumbnail" : "Hide thumbnail"}
          >
            {item.is_thumbnail_hidden ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
        )}
        
        {/* Set as cover button */}
        <button
          type="button"
          onClick={() => onSelectAsCover(item.image_url)}
          className="p-1 bg-blue-600 rounded-full hover:bg-blue-700"
          title="Set as cover image"
        >
          <ImageIcon size={12} />
        </button>
        
        {/* Remove button */}
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          className="p-1 bg-red-600 rounded-full hover:bg-red-700"
          title="Remove media"
        >
          <X size={12} />
        </button>
      </div>
      
      {isSelected && (
        <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-sm">
          Cover
        </div>
      )}
      
      {item.is_video && (
        <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded-sm">
          Video
        </div>
      )}
    </div>
  )
} 