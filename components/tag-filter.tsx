"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import { X } from "lucide-react"

interface TagFilterProps {
  onTagSelect: (tags: string[]) => void
  selectedTags: string[]
}

export default function TagFilter({ onTagSelect, selectedTags }: TagFilterProps) {
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTags() {
      try {
        setLoading(true)
        const supabase = getSupabaseBrowserClient()

        // Get unique categories
        const { data: categoryData, error: categoryError } = await supabase
          .from("projects")
          .select("category")
          .not("category", "is", null)

        // Get unique roles
        const { data: roleData, error: roleError } = await supabase
          .from("projects")
          .select("role")
          .not("role", "is", null)

        if (categoryError || roleError) {
          console.error("Error fetching tags:", categoryError || roleError)
          return
        }

        // Extract unique tags
        const uniqueTags = new Set<string>()

        categoryData?.forEach((item) => {
          if (item.category) uniqueTags.add(item.category)
        })

        roleData?.forEach((item) => {
          if (item.role) uniqueTags.add(item.role)
        })

        setTags(Array.from(uniqueTags).sort())
      } catch (error) {
        console.error("Error in fetchTags:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTags()
  }, [])

  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      // Remove tag if already selected
      onTagSelect(selectedTags.filter((t) => t !== tag))
    } else {
      // Add tag to selection
      onTagSelect([...selectedTags, tag])
    }
  }

  const clearFilters = () => {
    onTagSelect([])
  }

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2 mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 w-20 bg-gray-800 animate-pulse rounded-full"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-2 items-center">
        {tags.map((tag) => (
          <Button
            key={tag}
            variant={selectedTags.includes(tag) ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => handleTagClick(tag)}
          >
            {tag}
          </Button>
        ))}

        {selectedTags.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-400 hover:text-white">
            <X className="h-4 w-4 mr-1" />
            Clear filters
          </Button>
        )}
      </div>

      {selectedTags.length > 0 && (
        <div className="mt-2 text-sm text-gray-400">Filtering by: {selectedTags.join(", ")}</div>
      )}
    </div>
  )
}
