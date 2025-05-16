"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

interface TagFilterProps {
  onTagSelect: (tag: string | null) => void
  selectedTag: string | null
}

export default function TagFilter({ onTagSelect, selectedTag }: TagFilterProps) {
  const [tags, setTags] = useState<{ name: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTags() {
      try {
        setLoading(true)
        const supabase = getSupabaseBrowserClient()

        // Get all projects
        const { data: projects, error } = await supabase.from("projects").select("category, role")

        if (error) {
          console.error("Error fetching projects for tags:", error)
          return
        }

        // Extract and count tags
        const tagCounts: Record<string, number> = {}

        projects?.forEach((project) => {
          if (project.category) {
            tagCounts[project.category] = (tagCounts[project.category] || 0) + 1
          }
          if (project.role) {
            tagCounts[project.role] = (tagCounts[project.role] || 0) + 1
          }
        })

        // Convert to array and sort by count (descending)
        const sortedTags = Object.entries(tagCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)

        setTags(sortedTags)
      } catch (err) {
        console.error("Error in fetchTags:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTags()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-wrap gap-2 mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-6 w-16 bg-gray-800 rounded-full animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <Badge
        variant={selectedTag === null ? "default" : "outline"}
        className="cursor-pointer"
        onClick={() => onTagSelect(null)}
      >
        All
      </Badge>

      {tags.map((tag) => (
        <Badge
          key={tag.name}
          variant={selectedTag === tag.name ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => onTagSelect(tag.name)}
        >
          {tag.name} ({tag.count})
        </Badge>
      ))}
    </div>
  )
}
