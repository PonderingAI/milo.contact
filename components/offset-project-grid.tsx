"use client"

import { useState, useEffect } from "react"
import ProjectCard from "@/components/project-card"
import type { Project } from "@/lib/project-data"

interface OffsetProjectGridProps {
  projects: Project[]
  searchQuery: string
  selectedTags: string[] | null
}

export default function OffsetProjectGrid({ projects, searchQuery, selectedTags }: OffsetProjectGridProps) {
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(projects)

  useEffect(() => {
    let result = [...projects]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (project) =>
          project.title.toLowerCase().includes(query) ||
          project.category.toLowerCase().includes(query) ||
          project.role.toLowerCase().includes(query) ||
          (project.description && project.description.toLowerCase().includes(query)),
      )
    }

    // Filter by selected tags
    if (selectedTags && selectedTags.length > 0) {
      result = result.filter((project) => {
        const projectTags = project.role.split(",").map((tag) => tag.trim())
        // Check if any of the selected tags match any of the project's tags
        return selectedTags.some((tag) => projectTags.includes(tag))
      })
    }

    setFilteredProjects(result)
  }, [projects, searchQuery, selectedTags])

  if (filteredProjects.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No projects found matching your criteria.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
      {filteredProjects.map((project, index) => (
        <div key={project.id} className={`${index % 3 === 1 ? "md:mt-12" : index % 3 === 2 ? "md:mt-24" : ""}`}>
          <ProjectCard project={project} />
        </div>
      ))}
    </div>
  )
}
