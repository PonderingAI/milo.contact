"use client"

import { useState } from "react"
import ProjectSearch from "@/components/project-search"
import TagFilter from "@/components/tag-filter"
import OffsetProjectGrid from "@/components/offset-project-grid"
import type { Project } from "@/lib/project-data"

interface ProjectsSectionProps {
  projects: Project[]
}

export default function ProjectsSection({ projects }: ProjectsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleTagSelect = (tags: string[]) => {
    setSelectedTags(tags)
  }

  // Filter projects based on search term and selected tags
  const filteredProjects = projects.filter((project) => {
    // Filter by search term
    const matchesSearch =
      searchQuery === "" ||
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (project.category && project.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (project.role && project.role.toLowerCase().includes(searchQuery.toLowerCase()))

    // Filter by selected tags - use OR logic (match any selected tag)
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => {
        const tagLower = tag.toLowerCase()
        // Check if tag matches category exactly
        const matchesCategory = project.category && project.category.toLowerCase() === tagLower
        // Check if tag is contained in the comma-separated roles string
        const matchesRole = project.role && project.role.toLowerCase().split(',').some(role => role.trim() === tagLower)
        return matchesCategory || matchesRole
      })

    return matchesSearch && matchesTags
  })

  return (
    <section id="projects" className="mb-24">
      <h2 className="text-5xl md:text-7xl font-serif mb-12">My Work</h2>

      <ProjectSearch onSearch={handleSearch} />
      <TagFilter onTagSelect={handleTagSelect} selectedTags={selectedTags} />
      <OffsetProjectGrid projects={filteredProjects} searchQuery={searchQuery} selectedTags={selectedTags} />
    </section>
  )
}
