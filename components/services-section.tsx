"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import ProjectMiniCard from "./project-mini-card"
import type { Project } from "@/lib/project-data"

interface ServicesSettings {
  services_heading?: string
  services_text?: string
}

export default function ServicesSection({ projects }: { projects: Project[] }) {
  const [settings, setSettings] = useState<ServicesSettings>({
    services_heading: "My Work",
    services_text: "Explore my portfolio of projects across different roles and categories.",
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await supabase
          .from("site_settings")
          .select("key, value")
          .in("key", ["services_heading", "services_text"])

        if (error) {
          console.error("Error loading services settings:", error)
          return
        }

        if (data && data.length > 0) {
          const newSettings: ServicesSettings = { ...settings }
          data.forEach((item) => {
            if (item.key === "services_heading") newSettings.services_heading = item.value
            if (item.key === "services_text") newSettings.services_text = item.value
          })
          setSettings(newSettings)
        }
      } catch (err) {
        console.error("Error in loadSettings:", err)
      }
    }

    loadSettings()
  }, [])

  // Group projects by type
  const directedProjects = projects.filter((project) => project.type === "directed").slice(0, 3)
  const cameraProjects = projects.filter((project) => project.type === "camera").slice(0, 3)
  const productionProjects = projects.filter((project) => project.type === "production").slice(0, 3)
  const photoProjects = projects.filter((project) => project.type === "photography").slice(0, 3)

  return (
    <section id="services" className="py-16">
      <h2 className="text-3xl md:text-4xl font-bold mb-4 font-serif">{settings.services_heading}</h2>
      <p className="text-lg text-gray-300 mb-12">{settings.services_text}</p>

      <div className="space-y-16">
        {directedProjects.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold mb-6">Directed</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {directedProjects.map((project) => (
                <ProjectMiniCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}

        {cameraProjects.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold mb-6">Camera</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cameraProjects.map((project) => (
                <ProjectMiniCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}

        {productionProjects.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold mb-6">Production</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productionProjects.map((project) => (
                <ProjectMiniCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}

        {photoProjects.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold mb-6">Photography</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {photoProjects.map((project) => (
                <ProjectMiniCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-12 text-center">
        <a
          href="/projects"
          className="inline-block px-6 py-3 border border-white text-white hover:bg-white hover:text-black transition-colors"
        >
          View All Projects
        </a>
      </div>
    </section>
  )
}
