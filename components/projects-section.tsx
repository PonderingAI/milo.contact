"use client"

import { useState } from "react"
import ProjectFilters from "@/components/project-filters"
import OffsetProjectGrid from "@/components/offset-project-grid"
import type { Project } from "@/lib/project-data"

interface ProjectsSectionProps {
  projects: Project[]
}

export default function ProjectsSection({ projects }: ProjectsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [privacyFilter, setPrivacyFilter] = useState<"all" | "public" | "private">("all")

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleTagSelect = (tags: string[]) => {
    setSelectedTags(tags)
  }

  const handlePrivacyFilter = (filter: "all" | "public" | "private") => {
    setPrivacyFilter(filter)
  }

  // Filter projects based on search term, selected tags, and privacy
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
        return (project.category && project.category.includes(tag)) || (project.role && project.role.includes(tag))
      })

    // Filter by privacy setting
    const matchesPrivacy = 
      privacyFilter === "all" ||
      (privacyFilter === "public" && project.is_public === true) ||
      (privacyFilter === "private" && project.is_public === false)

    return matchesSearch && matchesTags && matchesPrivacy
  })

  return (
    <section id="projects" className="mb-24">
      <h2 className="text-5xl md:text-7xl font-serif mb-12">My Work</h2>

      <ProjectFilters 
        onSearch={handleSearch}
        onTagSelect={handleTagSelect}
        onPrivacyFilter={handlePrivacyFilter}
        selectedTags={selectedTags}
        privacyFilter={privacyFilter}
      />
      <OffsetProjectGrid projects={filteredProjects} searchQuery={searchQuery} selectedTags={selectedTags} />
    </section>
  )
}
