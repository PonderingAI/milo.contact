"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import { Loader2 } from "lucide-react"
import ProjectSearchBar from "@/components/project-search-bar"
import TagFilter from "@/components/tag-filter"
import OffsetProjectGrid from "@/components/offset-project-grid"

export default function ProjectsSection() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [projectsPerPage, setProjectsPerPage] = useState(20)

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true)
        const supabase = getSupabaseBrowserClient()

        // First, try to get the projects_per_page setting
        const { data: settingsData } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "projects_per_page")
          .single()

        if (settingsData?.value) {
          const perPage = Number.parseInt(settingsData.value)
          if (!isNaN(perPage) && perPage > 0) {
            setProjectsPerPage(perPage)
          }
        }

        // Then fetch the projects
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(projectsPerPage)

        if (error) {
          console.error("Error loading projects:", error)
          return
        }

        setProjects(data || [])
      } catch (err) {
        console.error("Error in loadProjects:", err)
      } finally {
        setLoading(false)
      }
    }

    loadProjects()
  }, [projectsPerPage])

  const filteredProjects =
    selectedTags.length > 0
      ? projects.filter((project: any) => {
          const projectTags = [project.type, project.role, project.category, ...(project.tags || [])].filter(Boolean)

          return selectedTags.some((tag) => projectTags.includes(tag))
        })
      : projects

  return (
    <section id="projects" className="py-24">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <ProjectSearchBar />
        </div>
        <TagFilter
          selectedTags={selectedTags}
          onTagSelect={(tag) => {
            setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
          }}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <OffsetProjectGrid projects={filteredProjects} />

          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No projects found matching your filters.</p>
            </div>
          )}

          {filteredProjects.length > 0 && filteredProjects.length < projects.length && (
            <div className="text-center mt-8">
              <p className="text-gray-400 mb-4">
                Showing {filteredProjects.length} of {projects.length} projects
              </p>
            </div>
          )}

          <div className="mt-12 text-center">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-full border-white hover:bg-white hover:text-black transition-colors"
            >
              <Link href="/projects">View All Projects</Link>
            </Button>
          </div>
        </>
      )}
    </section>
  )
}
