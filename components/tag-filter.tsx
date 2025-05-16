"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TagFilterProps {
  tags: string[]
  onFilterChange: (selectedTags: string[]) => void
  className?: string
}

export default function TagFilter({ tags, onFilterChange, className }: TagFilterProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const handleTagClick = (tag: string) => {
    let newSelectedTags: string[]

    if (tag === "all") {
      // Clear all filters
      newSelectedTags = []
    } else {
      // Toggle the selected tag
      if (selectedTags.includes(tag)) {
        newSelectedTags = selectedTags.filter((t) => t !== tag)
      } else {
        newSelectedTags = [...selectedTags, tag]
      }
    }

    setSelectedTags(newSelectedTags)
    onFilterChange(newSelectedTags)
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleTagClick("all")}
        className={cn(
          "text-sm rounded-full px-4 py-1 h-auto bg-transparent hover:bg-gray-800 border border-gray-700",
          selectedTags.length === 0 ? "bg-white text-black hover:bg-gray-200 hover:text-black" : "text-gray-400",
        )}
      >
        All
      </Button>

      {tags.map((tag) => (
        <Button
          key={tag}
          variant="outline"
          size="sm"
          onClick={() => handleTagClick(tag)}
          className={cn(
            "text-sm rounded-full px-4 py-1 h-auto bg-transparent hover:bg-gray-800 border border-gray-700",
            selectedTags.includes(tag) ? "bg-white text-black hover:bg-gray-200 hover:text-black" : "text-gray-400",
          )}
        >
          {tag}
        </Button>
      ))}
    </div>
  )
}
