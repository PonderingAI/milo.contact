"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import OffsetProjectGrid from "./offset-project-grid"
import TagFilter from "./tag-filter"

export default function ProjectsSection() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true)
        const supabase = getSupabaseBrowserClient()
        const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching projects:", error)
          setError("Failed to load projects")
          setProjects([]) // Ensure projects is always an array
        } else {
          setProjects(data || []) // Ensure projects is always an array
        }
      } catch (err) {
        console.error("Error in fetchProjects:", err)
        setError("Failed to load projects")
        setProjects([]) // Ensure projects is always an array
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  const handleTagSelect = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag)
      } else {
        return [...prev, tag]
      }
    })
  }

  return (
    <section id="projects" className="py-16 md:py-24 bg-black">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Projects</h2>

        {/* Tag Filter */}
        <div className="mb-12">
          <TagFilter selectedTags={selectedTags} onTagSelect={handleTagSelect} />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Loading projects...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-400">{error}</p>
          </div>
        ) : (
          <OffsetProjectGrid projects={projects || []} selectedTags={selectedTags} />
        )}

        <div className="text-center mt-12">
          <Button variant="outline" size="lg" asChild>
            <a href="/projects">View All Projects</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
