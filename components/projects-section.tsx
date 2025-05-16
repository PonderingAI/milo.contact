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
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  const handleTagSelect = (tag: string | null) => {
    setSelectedTag(tag)
  }

  return (
    <section id="projects" className="mb-24">
      <h2 className="text-5xl md:text-7xl font-serif mb-12">My Work</h2>

      <ProjectSearch onSearch={handleSearch} />
      <TagFilter onTagSelect={handleTagSelect} selectedTag={selectedTag} />
      <OffsetProjectGrid projects={projects} searchQuery={searchQuery} selectedTag={selectedTag} />
    </section>
  )
}
