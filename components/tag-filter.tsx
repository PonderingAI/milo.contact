"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import type { Project } from "@/lib/project-data"

interface TagFilterProps {
  projects: Project[]
  selectedTag: string | null
  onSelectTag: (tag: string | null) => void
}

export default function TagFilter({ projects, selectedTag, onSelectTag }: TagFilterProps) {
  const [tags, setTags] = useState<{ name: string; count: number }[]>([])

  useEffect(() => {
    // Extract all tags from projects
    const tagCounts: Record<string, number> = {}

    projects.forEach((project) => {
      // Add category as tag
      if (project.category) {
        tagCounts[project.category] = (tagCounts[project.category] || 0) + 1
      }

      // Add role as tag(s) - split by commas
      if (project.role) {
        const roleTags = project.role.split(",").map((tag) => tag.trim())
        roleTags.forEach((tag) => {
          if (tag) tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      }

      // Add explicit tags
      if (project.tags && Array.isArray(project.tags)) {
        project.tags.forEach((tag) => {
          if (tag) tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      }
    })

    // Convert to array and sort by count (descending)
    const sortedTags = Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    setTags(sortedTags)
  }, [projects])

  if (tags.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={selectedTag === null ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => onSelectTag(null)}
        >
          All
        </Badge>

        {tags.map((tag) => (
          <Badge
            key={tag.name}
            variant={selectedTag === tag.name ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => onSelectTag(tag.name)}
          >
            {tag.name} ({tag.count})
          </Badge>
        ))}
      </div>
    </div>
  )
}
