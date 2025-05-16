"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import { extractTagsFromRole } from "@/lib/project-data"

interface TagFilterProps {
  onTagSelect: (tag: string | null) => void
  selectedTag: string | null
}

export default function TagFilter({ onTagSelect, selectedTag }: TagFilterProps) {
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTags() {
      try {
        setLoading(true)
        const supabase = getSupabaseBrowserClient()

        // Fetch all projects to extract unique categories and roles
        const { data, error } = await supabase.from("projects").select("category, role")

        if (error) {
          console.error("Error fetching tags:", error)
          return
        }

        // Extract unique categories
        const categories = [...new Set(data.map((project) => project.category).filter(Boolean))]

        // Extract unique roles from comma-separated values
        const allRoles: string[] = []
        data.forEach((project) => {
          if (project.role) {
            const roleTags = extractTagsFromRole(project.role)
            allRoles.push(...roleTags)
          }
        })
        const roles = [...new Set(allRoles)]

        // Combine categories and roles, remove duplicates
        const uniqueTags = [...new Set([...categories, ...roles])].sort()
        setTags(uniqueTags)
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
          <div key={i} className="h-6 w-16 bg-gray-800 animate-pulse rounded-full"></div>
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
          key={tag}
          variant={selectedTag === tag ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => onTagSelect(tag)}
        >
          {tag}
        </Badge>
      ))}
    </div>
  )
}
