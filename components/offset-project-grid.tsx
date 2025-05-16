"use client"

import { useState, useEffect } from "react"
import ProjectCard from "./project-card"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import type { Project } from "@/lib/project-data"

interface OffsetProjectGridProps {
  projects: Project[]
  searchQuery?: string
  selectedTag?: string | null
}

export default function OffsetProjectGrid({ projects, searchQuery = "", selectedTag = null }: OffsetProjectGridProps) {
  const [projectsPerPage, setProjectsPerPage] = useState(20)
  const [projectGap, setProjectGap] = useState(4) // Default gap size (16px)
  const [visibleProjects, setVisibleProjects] = useState(projectsPerPage)
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(projects)
  const [backgroundColor, setBackgroundColor] = useState("#000000")

  // Load settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data, error } = await supabase
          .from("site_settings")
          .select("key, value")
          .in("key", ["projects_per_page", "project_gap", "background_color"])

        if (!error && data) {
          data.forEach((item) => {
            if (item.key === "projects_per_page" && item.value) {
              setProjectsPerPage(Number.parseInt(item.value, 10))
              setVisibleProjects(Number.parseInt(item.value, 10))
            }
            if (item.key === "project_gap" && item.value) {
              setProjectGap(Number.parseInt(item.value, 10))
            }
            if (item.key === "background_color" && item.value) {
              setBackgroundColor(item.value)
            }
          })
        }
      } catch (err) {
        console.error("Error loading settings:", err)
      }
    }

    loadSettings()
  }, [])

  // Filter projects based on search query and selected tag
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
          project.description?.toLowerCase().includes(query) ||
          project.tags?.some((tag) => tag.toLowerCase().includes(query)),
      )
    }

    // Filter by selected tag
    if (selectedTag) {
      filtered = filtered.filter(
        (project) =>
          project.category?.toLowerCase() === selectedTag.toLowerCase() ||
          project.role?.toLowerCase() === selectedTag.toLowerCase() ||
          project.tags?.some((tag) => tag.toLowerCase() === selectedTag.toLowerCase()),
      )
    }

    setFilteredProjects(filtered)
    // Reset visible projects when filters change
    setVisibleProjects(projectsPerPage)
  }, [projects, searchQuery, selectedTag, projectsPerPage])

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

  // Calculate gap class based on settings
  const gapClass = `gap-${projectGap}`

  return (
    <div className="space-y-8" style={{ backgroundColor }}>
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 ${gapClass}`}>
        {filteredProjects.slice(0, visibleProjects).map((project, index) => {
          // Calculate vertical offset for each project
          // First column: no offset
          // Second column: offset down
          // Third column: offset up
          // Pattern repeats
          const col = index % 3

          let offsetClass = ""

          if (col === 1) {
            offsetClass = "md:mt-16" // Second column offset down
          } else if (col === 2) {
            offsetClass = "md:-mt-16" // Third column offset up
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
