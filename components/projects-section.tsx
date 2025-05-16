"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import TagFilter from "@/components/tag-filter"
import OffsetProjectGrid from "@/components/offset-project-grid"

interface Project {
  id: string
  title: string
  description?: string
  image: string
  category: string
  role: string
  thumbnail_url?: string
}

interface ProjectsSectionProps {
  projects: Project[]
}

export default function ProjectsSection({ projects }: ProjectsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [filteredProjects, setFilteredProjects] = useState(projects)

  // Extract unique tags from projects
  const allTags = Array.from(
    new Set(
      projects
        .flatMap((project) => {
          // Split by comma and trim each tag
          return project.role.split(",").map((tag) => tag.trim())
        })
        .filter(Boolean),
    ),
  ).sort()

  // Filter projects based on search query and selected tags
  useEffect(() => {
    let filtered = projects

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (project) =>
          project.title.toLowerCase().includes(query) ||
          (project.description && project.description.toLowerCase().includes(query)) ||
          project.category.toLowerCase().includes(query) ||
          project.role.toLowerCase().includes(query),
      )
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((project) => {
        const projectTags = project.role.split(",").map((tag) => tag.trim())
        // Project matches if it has ANY of the selected tags
        return selectedTags.some((tag) => projectTags.includes(tag))
      })
    }

    setFilteredProjects(filtered)
  }, [searchQuery, selectedTags, projects])

  return (
    <section id="projects" className="py-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h2 className="text-3xl font-bold mb-4 md:mb-0">Projects</h2>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="search"
            placeholder="Search projects..."
            className="pl-10 bg-gray-900 border-gray-700"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <TagFilter tags={allTags} onFilterChange={setSelectedTags} className="mb-8" />

      <OffsetProjectGrid projects={filteredProjects} />
    </section>
  )
}
