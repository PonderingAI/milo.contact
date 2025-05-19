"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

interface TagFilterProps {
  selectedTags: string[]
  onTagSelect: (tag: string) => void
}

export default function TagFilter({ selectedTags = [], onTagSelect }: TagFilterProps) {
  const [categories, setCategories] = useState<string[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTags() {
      try {
        setLoading(true)
        const supabase = getSupabaseBrowserClient()

        // Fetch tag order first
        const { data: orderData } = await supabase.from("tag_order").select("*").order("position", { ascending: true })

        // Create a map of tag to position for sorting
        const tagPositions: Record<string, number> = {}
        if (orderData) {
          orderData.forEach((item, index) => {
            if (item && item.tag) {
              tagPositions[item.tag] = item.position || index
            }
          })
        }

        // Fetch all projects to extract unique categories and roles
        const { data: projectsData, error } = await supabase.from("projects").select("category, role")

        if (error) {
          console.error("Error fetching tags:", error)
          return
        }

        // Extract unique categories and roles
        const uniqueCategories = new Set<string>()
        const uniqueRoles = new Set<string>()

        if (projectsData) {
          projectsData.forEach((project) => {
            if (project.category) uniqueCategories.add(project.category)
            if (project.role) uniqueRoles.add(project.role)
          })
        }

        // Convert to arrays and sort
        const categoriesArray = Array.from(uniqueCategories).filter(Boolean)
        const rolesArray = Array.from(uniqueRoles).filter(Boolean)

        // Sort by tag order if available, otherwise alphabetically
        categoriesArray.sort((a, b) => {
          if (tagPositions[a] !== undefined && tagPositions[b] !== undefined) {
            return tagPositions[a] - tagPositions[b]
          }
          return a.localeCompare(b)
        })

        rolesArray.sort((a, b) => {
          if (tagPositions[a] !== undefined && tagPositions[b] !== undefined) {
            return tagPositions[a] - tagPositions[b]
          }
          return a.localeCompare(b)
        })

        setCategories(categoriesArray)
        setRoles(rolesArray)
      } catch (err) {
        console.error("Error in fetchTags:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTags()
  }, [])

  if (loading) {
    return <div className="h-8"></div> // Placeholder height while loading
  }

  return (
    <div className="space-y-4">
      {categories.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Categories</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedTags.includes(category) ? "default" : "outline"}
                size="sm"
                onClick={() => onTagSelect(category)}
                className="rounded-full"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      )}

      {roles.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">Roles</h3>
          <div className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <Button
                key={role}
                variant={selectedTags.includes(role) ? "default" : "outline"}
                size="sm"
                onClick={() => onTagSelect(role)}
                className="rounded-full"
              >
                {role}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
