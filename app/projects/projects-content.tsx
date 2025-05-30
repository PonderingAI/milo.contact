"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { OffsetProjectGrid } from "@/components/offset-project-grid"
import TagFilter from "@/components/tag-filter"
import ProjectSearchBar from "@/components/project-search-bar"
import type { Project } from "@/lib/project-data"

interface ProjectsContentProps {
  projects: Project[]
  categories: string[]
  roles: string[]
}

export default function ProjectsContent({ projects, categories, roles }: ProjectsContentProps) {
  const searchParams = useSearchParams()
  const initialCategory = searchParams?.get("category") || ""
  const initialRole = searchParams?.get("role") || ""

  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [selectedRole, setSelectedRole] = useState(initialRole)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredProjects, setFilteredProjects] = useState(projects)

  // Apply filters when dependencies change
  useEffect(() => {
    let result = projects

    // Apply category filter
    if (selectedCategory) {
      result = result.filter((project) => project.category?.toLowerCase() === selectedCategory.toLowerCase())
    }

    // Apply role filter
    if (selectedRole) {
      result = result.filter((project) => project.role?.toLowerCase().includes(selectedRole.toLowerCase()))
    }

    // Apply search filter
    if (searchQuery) {
      result = result.filter((project) => {
        const searchableText = [
          project.title,
          project.description,
          project.category,
          project.role,
          ...(project.tags || []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()

        return searchableText.includes(searchQuery.toLowerCase())
      })
    }

    setFilteredProjects(result)
  }, [projects, selectedCategory, selectedRole, searchQuery])

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === selectedCategory ? "" : category)
  }

  const handleRoleChange = (role: string) => {
    setSelectedRole(role === selectedRole ? "" : role)
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const clearFilters = () => {
    setSelectedCategory("")
    setSelectedRole("")
    setSearchQuery("")
  }

  return (
    <div>
      <div className="mb-8 space-y-4">
        <ProjectSearchBar onSearch={handleSearch} redirectToResults={false} className="max-w-xl mx-auto" />

        <TagFilter
          title="Categories"
          tags={categories}
          selectedTag={selectedCategory}
          onChange={handleCategoryChange}
        />

        <TagFilter title="Roles" tags={roles} selectedTag={selectedRole} onChange={handleRoleChange} />

        {(selectedCategory || selectedRole || searchQuery) && (
          <div className="flex justify-center">
            <button onClick={clearFilters} className="text-sm text-gray-400 hover:text-white underline">
              Clear filters
            </button>
          </div>
        )}
      </div>

      {filteredProjects.length > 0 ? (
        <OffsetProjectGrid projects={filteredProjects} />
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400">No projects found with the selected filters</p>
          <button onClick={clearFilters} className="mt-4 text-sm text-blue-400 hover:text-blue-300 underline">
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
