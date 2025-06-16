"use client"

import { useState, useEffect } from "react"
import { Search, Filter, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

interface ProjectFiltersProps {
  onSearch: (query: string) => void
  onTagSelect: (tags: string[]) => void
  onPrivacyFilter: (filter: "all" | "public" | "private") => void
  selectedTags: string[]
  privacyFilter: "all" | "public" | "private"
}

interface TagOrder {
  tag_type: string
  tag_name: string
  display_order: number
}

export default function ProjectFilters({
  onSearch,
  onTagSelect,
  onPrivacyFilter,
  selectedTags,
  privacyFilter
}: ProjectFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("")
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
          if (item.role) {
            // Split roles by comma and add each one
            item.role.split(",").forEach((role: string) => {
              const trimmedRole = role.trim()
              if (trimmedRole) uniqueRoles.add(trimmedRole)
            })
          }
        })

        // Try to fetch custom tag order
        let orderedCategories: string[] = []
        let orderedRoles: string[] = []

        try {
          const response = await fetch("/api/tag-order")

          if (response.ok) {
            const orderData: TagOrder[] = await response.json()

            // Create maps for quick lookup
            const categoryOrderMap = new Map<string, number>()
            const roleOrderMap = new Map<string, number>()

            orderData.forEach((item) => {
              if (item.tag_type === "category") {
                categoryOrderMap.set(item.tag_name, item.display_order)
              } else if (item.tag_type === "role") {
                roleOrderMap.set(item.tag_name, item.display_order)
              }
            })

            // Sort categories based on saved order
            orderedCategories = Array.from(uniqueCategories).sort((a, b) => {
              if (categoryOrderMap.has(a) && categoryOrderMap.has(b)) {
                return categoryOrderMap.get(a)! - categoryOrderMap.get(b)!
              }
              if (categoryOrderMap.has(a)) return -1
              if (categoryOrderMap.has(b)) return 1
              return a.localeCompare(b)
            })

            // Sort roles based on saved order
            orderedRoles = Array.from(uniqueRoles).sort((a, b) => {
              if (roleOrderMap.has(a) && roleOrderMap.has(b)) {
                return roleOrderMap.get(a)! - roleOrderMap.get(b)!
              }
              if (roleOrderMap.has(a)) return -1
              if (roleOrderMap.has(b)) return 1
              return a.localeCompare(b)
            })
          } else {
            orderedCategories = Array.from(uniqueCategories).sort()
            orderedRoles = Array.from(uniqueRoles).sort()
          }
        } catch (error) {
          console.error("Error fetching tag order:", error)
          orderedCategories = Array.from(uniqueCategories).sort()
          orderedRoles = Array.from(uniqueRoles).sort()
        }

        setCategories(orderedCategories)
        setRoles(orderedRoles)
      } catch (error) {
        console.error("Error in fetchTags:", error)
        setCategories([])
        setRoles([])
      } finally {
        setLoading(false)
      }
    }

    fetchTags()
  }, [])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    onSearch(query)
  }

  const handleTagClick = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagSelect(selectedTags.filter((t) => t !== tag))
    } else {
      onTagSelect([...selectedTags, tag])
    }
  }

  const clearAllTags = () => {
    onTagSelect([])
  }

  return (
    <div className="space-y-4 mb-8">
      {/* Search Input - simplified without box */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Search projects..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-10 bg-transparent border-gray-800 focus:border-gray-700"
        />
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Privacy Filter Toggles */}
        <div className="flex items-center gap-2">
          <Button
            variant={privacyFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => onPrivacyFilter("all")}
          >
            All
          </Button>
          <Button
            variant={privacyFilter === "public" ? "default" : "outline"}
            size="sm"
            onClick={() => onPrivacyFilter("public")}
          >
            Public
          </Button>
          <Button
            variant={privacyFilter === "private" ? "default" : "outline"}
            size="sm"
            onClick={() => onPrivacyFilter("private")}
          >
            Private
          </Button>
        </div>

        {/* More Filters Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 max-h-80 overflow-y-auto">
            {/* Categories */}
            {categories.length > 0 && (
              <>
                <DropdownMenuLabel>Categories</DropdownMenuLabel>
                {categories.map((category) => (
                  <DropdownMenuCheckboxItem
                    key={category}
                    checked={selectedTags.includes(category)}
                    onCheckedChange={() => handleTagClick(category)}
                  >
                    {category}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
              </>
            )}

            {/* Roles */}
            {roles.length > 0 && (
              <>
                <DropdownMenuLabel>Roles</DropdownMenuLabel>
                {roles.map((role) => (
                  <DropdownMenuCheckboxItem
                    key={role}
                    checked={selectedTags.includes(role)}
                    onCheckedChange={() => handleTagClick(role)}
                  >
                    {role}
                  </DropdownMenuCheckboxItem>
                ))}
              </>
            )}

            {loading && (
              <div className="p-2 text-center text-gray-400">Loading filters...</div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Clear Filters Button */}
        {selectedTags.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllTags}>
            Clear Tags ({selectedTags.length})
          </Button>
        )}
      </div>

      {/* Selected Tags Display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer hover:bg-red-900/50"
              onClick={() => handleTagClick(tag)}
            >
              {tag} ×
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}