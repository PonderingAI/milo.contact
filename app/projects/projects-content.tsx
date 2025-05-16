"use client"

import { useState, useEffect } from "react"
import { getProjects } from "@/lib/project-data"
import ProjectCard from "@/components/project-card"
import TagFilter from "@/components/tag-filter"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ProjectsContent() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTags, setSelectedTags] = useState([])
  const [filteredProjects, setFilteredProjects] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await getProjects()
        setProjects(data)
        setFilteredProjects(data)
      } catch (error) {
        console.error("Error loading projects:", error)
        setError("Failed to load projects. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [])

  useEffect(() => {
    if (selectedTags.length === 0) {
      setFilteredProjects(projects)
    } else {
      // Filter projects that have ALL selected tags
      const filtered = projects.filter((project) => {
        // Get all tags for this project (category, role, etc.)
        const projectTags = [
          project.category,
          ...(project.role ? project.role.split(",").map((r) => r.trim()) : []),
        ].filter(Boolean)

        // Check if ALL selected tags are in this project's tags
        return selectedTags.every((tag) =>
          projectTags.some((projectTag) => projectTag.toLowerCase() === tag.toLowerCase()),
        )
      })
      setFilteredProjects(filtered)
    }
  }, [selectedTags, projects])

  // Extract all unique categories and roles for the filter
  const allCategories = [...new Set(projects.map((p) => p.category))].filter(Boolean)
  const allRoles = [
    ...new Set(projects.flatMap((p) => (p.role ? p.role.split(",").map((r) => r.trim()) : [])).filter(Boolean)),
  ]

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>
      </div>

      <h1 className="text-4xl md:text-6xl font-serif mb-8">Projects</h1>

      <TagFilter
        categories={allCategories}
        roles={allRoles}
        selectedTags={selectedTags}
        setSelectedTags={setSelectedTags}
        loading={loading}
      />

      {error && (
        <div className="text-center py-12">
          <p className="text-xl text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-800 rounded-lg aspect-video animate-pulse"></div>
          ))}
        </div>
      ) : (
        <>
          {filteredProjects.length === 0 && !error ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-400">No projects match the selected filters.</p>
              <button
                onClick={() => setSelectedTags([])}
                className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12 mt-12">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </>
      )}

      {filteredProjects.length > 0 && (
        <div className="mt-16 text-center">
          <p className="text-gray-400 mb-4">Looking for something specific?</p>
          <p className="text-gray-500">Use the filters above to narrow down projects by category or role.</p>
        </div>
      )}
    </div>
  )
}
