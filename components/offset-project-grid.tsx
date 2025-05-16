"use client"

import { useState, useEffect } from "react"
import ProjectCard from "@/components/project-card"
import type { Project } from "@/lib/project-data"

interface OffsetProjectGridProps {
  projects: Project[]
  searchQuery: string
  selectedTag: string | null
}

export default function OffsetProjectGrid({ projects, searchQuery, selectedTag }: OffsetProjectGridProps) {
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(projects)

  useEffect(() => {
    let filtered = [...projects]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (project) =>
          project.title.toLowerCase().includes(query) ||
          project.category.toLowerCase().includes(query) ||
          project.role.toLowerCase().includes(query) ||
          (project.description && project.description.toLowerCase().includes(query)) ||
          (project.tags && project.tags.some((tag) => tag.toLowerCase().includes(query))),
      )
    }

    // Filter by selected tag
    if (selectedTag) {
      filtered = filtered.filter(
        (project) =>
          project.category === selectedTag ||
          project.role === selectedTag ||
          (project.tags && project.tags.includes(selectedTag)),
      )
    }

    setFilteredProjects(filtered)
  }, [projects, searchQuery, selectedTag])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12 mb-24">
      {filteredProjects.map((project, index) => {
        // Calculate offset pattern
        // First row: no offset
        // Second row: middle item offset down
        // Third row: first and third items offset down
        let offsetClass = ""

        if (index >= 3 && index < 6) {
          // Second row
          if (index % 3 === 1) offsetClass = "md:mt-12"
        } else if (index >= 6 && index < 9) {
          // Third row
          if (index % 3 === 0 || index % 3 === 2) offsetClass = "md:mt-12"
        } else if (index >= 9) {
          // Fourth+ rows - repeat the pattern
          const rowIndex = Math.floor(index / 3) % 3
          const colIndex = index % 3

          if (rowIndex === 1 && colIndex === 1) offsetClass = "md:mt-12"
          else if (rowIndex === 2 && (colIndex === 0 || colIndex === 2)) offsetClass = "md:mt-12"
        }

        return (
          <div key={project.id} className={`${offsetClass} transition-all duration-300`}>
            <ProjectCard
              id={project.id}
              title={project.title}
              category={project.category}
              role={project.role}
              image={project.image}
              link={`/projects/${project.id}`}
            />
          </div>
        )
      })}

      {filteredProjects.length === 0 && (
        <div className="col-span-full text-center py-12">
          <h3 className="text-xl font-serif mb-2">No projects found</h3>
          <p className="text-gray-400">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  )
}
