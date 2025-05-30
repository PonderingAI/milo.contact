"use client"

import { useState, useEffect } from "react"
import { ProjectCard } from "./project-card"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import type { Project } from "@/lib/project-data"

interface OffsetProjectGridProps {
  projects: Project[]
  searchQuery?: string
  selectedTags?: string[]
}

export function OffsetProjectGrid({ projects, searchQuery = "", selectedTags = [] }: OffsetProjectGridProps) {
  const [projectsPerPage, setProjectsPerPage] = useState(20)
  const [visibleProjects, setVisibleProjects] = useState(projectsPerPage)
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(projects)

  // Load projects per page setting
  useEffect(() => {
    async function loadSettings() {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data, error } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "projects_per_page")
          .single()

        if (!error && data && data.value) {
          setProjectsPerPage(Number.parseInt(data.value, 10))
          setVisibleProjects(Number.parseInt(data.value, 10))
        }
      } catch (err) {
        console.error("Error loading projects per page setting:", err)
      }
    }

    loadSettings()
  }, [])

  // Filter projects based on search query and selected tags
  useEffect(() => {
    let filtered = [...projects]

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (project) =>
          project.title?.toLowerCase().includes(query) ||
          project.category?.toLowerCase().includes(query) ||
          project.role?.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query),
      )
    }

    // Filter by selected tags (match ALL of the selected tags)
    if (selectedTags && selectedTags.length > 0) {
      filtered = filtered.filter((project) => {
        return selectedTags.every(
          (tag) =>
            project.category?.toLowerCase() === tag.toLowerCase() || project.role?.toLowerCase() === tag.toLowerCase(),
        )
      })
    }

    setFilteredProjects(filtered)
    // Reset visible projects when filters change
    setVisibleProjects(projectsPerPage)
  }, [projects, searchQuery, selectedTags, projectsPerPage])

  const loadMoreProjects = () => {
    setVisibleProjects((prev) => prev + projectsPerPage)
  }

  // No projects found
  if (filteredProjects.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl mb-2">No projects found</h3>
        <p className="text-gray-400">Try adjusting your search or filters</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
        {filteredProjects.slice(0, visibleProjects).map((project, index) => {
          // Calculate offset for each project - horizontal offset pattern
          const row = Math.floor(index / 3)
          const col = index % 3

          let offsetClass = ""

          if (row % 2 === 1) {
            // Second row
            if (col === 1) offsetClass = "md:translate-x-8"
            else if (col === 2) offsetClass = "md:translate-x-16"
          }

          return (
            <div key={project.id} className={offsetClass}>
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
      </div>

      {filteredProjects.length > visibleProjects && (
        <div className="flex justify-center mt-12">
          <Button onClick={loadMoreProjects} variant="outline" size="lg">
            View More
          </Button>
        </div>
      )}
    </div>
  )
}

// Also keep the default export for backward compatibility
export default OffsetProjectGrid
