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
  const [categories, setCategories] = useState<string[]>([])
  const [roles, setRoles] = useState<string[]>([])
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

        // Extract unique categories
        const uniqueCategories = new Set<string>()
        categoryData?.forEach((item) => {
          if (item.category) uniqueCategories.add(item.category)
        })

        // Extract unique roles
        const uniqueRoles = new Set<string>()
        roleData?.forEach((item) => {
          if (item.role) uniqueRoles.add(item.role)
        })

        setCategories(Array.from(uniqueCategories).sort())
        setRoles(Array.from(uniqueRoles).sort())
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
      <div className="space-y-4 mb-8">
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((i) => (
            <div key={`cat-${i}`} className="h-8 w-20 bg-gray-800 animate-pulse rounded-full"></div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={`role-${i}`} className="h-8 w-20 bg-gray-800 animate-pulse rounded-full"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mb-8 space-y-4">
      {/* Categories row */}
      <div>
        <div className="text-sm text-gray-400 mb-2">Categories</div>
        <div className="flex flex-wrap gap-2 items-center">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedTags.includes(category) ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => handleTagClick(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Roles row */}
      <div>
        <div className="text-sm text-gray-400 mb-2">Roles</div>
        <div className="flex flex-wrap gap-2 items-center">
          {roles.map((role) => (
            <Button
              key={role}
              variant={selectedTags.includes(role) ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => handleTagClick(role)}
            >
              {role}
            </Button>
          ))}

          {selectedTags.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-400 hover:text-white">
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {selectedTags.length > 0 && (
        <div className="text-sm text-gray-400">Showing projects matching any of: {selectedTags.join(", ")}</div>
      )}
    </div>
  )
}
