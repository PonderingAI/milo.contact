"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import ProjectCard from "@/components/project-card"
import type { Project } from "@/lib/project-data"
import { useSearchParams } from "next/navigation"

interface ProjectsContentProps {
  initialProjects: Project[]
}

export default function ProjectsContent({ initialProjects }: ProjectsContentProps) {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get("category")
  const initialRole = searchParams.get("role")

  const [activeCategory, setActiveCategory] = useState<string | null>(initialCategory)
  const [projects] = useState<Project[]>(initialProjects)

  // Get unique project types
  const projectTypes = Array.from(new Set(projects.map((project) => project.type)))

  // Filter projects based on active category and role
  const filteredProjects = activeCategory
    ? projects.filter((project) => {
        if (initialRole) {
          // If role is specified, filter by both type and role
          return (
            project.type === activeCategory &&
            (project.role === initialRole || (Array.isArray(initialRole) && initialRole.includes(project.role)))
          )
        }
        // Otherwise just filter by type
        return project.type === activeCategory
      })
    : projects

  return (
    <>
      <div className="flex items-center gap-4 mb-12">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>
      </div>

      <h1 className="text-5xl md:text-7xl font-serif mb-12">All Projects</h1>

      <div className="category-tabs mb-12">
        <button
          className={`category-tab ${activeCategory === null ? "active" : ""}`}
          onClick={() => setActiveCategory(null)}
        >
          All
        </button>

        {projectTypes.map((type) => (
          <button
            key={type}
            className={`category-tab ${activeCategory === type ? "active" : ""}`}
            onClick={() => setActiveCategory(type)}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProjects.map((project) => (
          <ProjectCard
            key={project.id}
            id={project.id}
            title={project.title}
            category={project.category}
            role={project.role}
            image={project.image}
            link={`/projects/${project.id}`}
          />
        ))}
      </div>
    </>
  )
}
