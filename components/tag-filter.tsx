"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

interface TagFilterProps {
  onTagSelect: (tag: string | null) => void
  selectedTag: string | null
}

export default function TagFilter({ onTagSelect, selectedTag }: TagFilterProps) {
  const [tags, setTags] = useState<{ name: string; count: number }[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadTags() {
      try {
        setIsLoading(true)
        const supabase = getSupabaseBrowserClient()

        // First try to get tags from the database
        const { data: projectsData, error: projectsError } = await supabase.from("projects").select("category, role")

        if (projectsError) {
          console.error("Error loading projects for tags:", projectsError)
          setTags([
            { name: "All", count: 0 },
            { name: "Short Film", count: 0 },
            { name: "Music Video", count: 0 },
            { name: "Feature Film", count: 0 },
            { name: "Director", count: 0 },
            { name: "Photographer", count: 0 },
          ])
          return
        }

        // Extract unique tags and count occurrences
        const tagCounts: Record<string, number> = {}

        projectsData.forEach((project) => {
          // Add category as tag
          if (project.category) {
            tagCounts[project.category] = (tagCounts[project.category] || 0) + 1
          }

          // Add role as tag
          if (project.role) {
            tagCounts[project.role] = (tagCounts[project.role] || 0) + 1
          }
        })

        // Convert to array and sort by count (descending)
        const sortedTags = Object.entries(tagCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)

        // Add "All" tag at the beginning
        setTags([{ name: "All", count: projectsData.length }, ...sortedTags])
      } catch (err) {
        console.error("Error in loadTags:", err)
        setTags([
          { name: "All", count: 0 },
          { name: "Short Film", count: 0 },
          { name: "Music Video", count: 0 },
          { name: "Feature Film", count: 0 },
          { name: "Director", count: 0 },
          { name: "Photographer", count: 0 },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    loadTags()
  }, [])

  return (
    <div className="flex flex-wrap gap-3 mb-12">
      {tags.map((tag) => (
        <button
          key={tag.name}
          onClick={() => onTagSelect(tag.name === "All" ? null : tag.name)}
          className={`px-4 py-2 rounded-full text-sm transition-colors ${
            (selectedTag === tag.name) || (selectedTag === null && tag.name === "All")
              ? "bg-white text-black"
              : "bg-gray-900 text-gray-300 hover:bg-gray-800"
          }`}
        >
          {tag.name} {tag.count > 0 && <span className="text-xs">({tag.count})</span>}
        </button>
      ))}
    </div>
  )
}
