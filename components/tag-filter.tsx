"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { getSupabaseBrowserClient } from "@/lib/supabase"

interface TagFilterProps {
  onTagSelect: (tags: string[] | null) => void
  selectedTags: string[] | null
}

export default function TagFilter({ onTagSelect, selectedTags }: TagFilterProps) {
  const [tags, setTags] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchTags() {
      setIsLoading(true)
      try {
        const supabase = getSupabaseBrowserClient()
        const { data } = await supabase.from("projects").select("role")

        if (data) {
          // Extract all tags from the role field (comma-separated)
          const allTags = data
            .flatMap((project) => project.role?.split(",").map((tag) => tag.trim()) || [])
            .filter(Boolean)

          // Count occurrences of each tag
          const tagCounts: Record<string, number> = {}
          allTags.forEach((tag) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1
          })

          // Sort tags by frequency (most common first)
          const sortedTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a])
          setTags(sortedTags)
        }
      } catch (error) {
        console.error("Error fetching tags:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTags()
  }, [])

  const handleTagClick = (tag: string) => {
    if (!selectedTags) {
      // If no tags are selected, select this one
      onTagSelect([tag])
    } else if (selectedTags.includes(tag)) {
      // If this tag is already selected, remove it
      const newTags = selectedTags.filter((t) => t !== tag)
      onTagSelect(newTags.length > 0 ? newTags : null)
    } else {
      // Add this tag to the selection
      onTagSelect([...selectedTags, tag])
    }
  }

  const clearFilters = () => {
    onTagSelect(null)
  }

  if (isLoading) {
    return (
      <div className="flex gap-2 mb-8 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-6 w-16 bg-gray-700 rounded-full"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-2 items-center">
        <Badge variant={!selectedTags ? "default" : "outline"} className="cursor-pointer" onClick={clearFilters}>
          All
        </Badge>

        {tags.map((tag) => (
          <Badge
            key={tag}
            variant={selectedTags?.includes(tag) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => handleTagClick(tag)}
          >
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  )
}
