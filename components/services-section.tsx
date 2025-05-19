"use client"

/**
 * @deprecated This component is deprecated and should not be used.
 * It has been removed from the main page layout.
 * Do not reimplement or add this component back to the page.
 */

import { useState, useEffect } from "react"
import { Camera, Film, Smartphone, Waves, DrillIcon as Drone } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import ProjectMiniCard from "@/components/project-mini-card"
import { motion, AnimatePresence } from "framer-motion"
import type { Project } from "@/lib/project-data"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"

interface ServicesSectionProps {
  projects: Project[]
}

const services = [
  {
    icon: <Film className="w-8 h-8" />,
    title: "Director of Photography",
    description: "Crafting visual narratives through expert cinematography and lighting design.",
    type: "camera",
    filter: "DP",
  },
  {
    icon: <Camera className="w-8 h-8" />,
    title: "Camera Assistant",
    description: "Providing technical support as 1AC & 2AC to ensure smooth production workflows.",
    type: "camera",
    filter: ["1st AC", "2nd AC", "Camera Operator"],
  },
  {
    icon: <Drone className="w-8 h-8" />,
    title: "Drone Operator",
    description: "Capturing breathtaking aerial footage with precision and creative vision.",
    type: "camera",
    filter: "Drone Operator",
  },
  {
    icon: <Waves className="w-8 h-8" />,
    title: "Underwater Operator",
    description: "Specialized in capturing stunning underwater imagery for unique perspectives.",
    type: "camera",
    filter: "Underwater Operator",
  },
  {
    icon: <Camera className="w-8 h-8" />,
    title: "Photography",
    description: "Creating compelling visual stories through artistic photography and imagery.",
    type: "photography",
    filter: "Photography",
  },
  {
    icon: <Smartphone className="w-8 h-8" />,
    title: "AI",
    description: "Leveraging artificial intelligence to create innovative visual content and solutions.",
    type: "ai",
    filter: "AI",
  },
]

export default function ServicesSection({ projects }: ServicesSectionProps) {
  const [activeService, setActiveService] = useState<number | null>(null)
  const [settings, setSettings] = useState({
    services_heading: "Services",
    services_text: "",
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadSettings() {
      try {
        setIsLoading(true)
        const supabase = getSupabaseBrowserClient()

        const { data, error } = await supabase
          .from("site_settings")
          .select("key, value")
          .in("key", ["services_heading", "services_text"])

        if (error) {
          // If table doesn't exist, we'll use default values
          if (error.code === "42P01") {
            console.log("Site settings table doesn't exist yet. Using default values.")
          } else {
            console.error("Error loading services settings:", error)
          }
          return
        }

        if (data && data.length > 0) {
          const newSettings = { ...settings }
          data.forEach((item) => {
            if (item.key === "services_heading") newSettings.services_heading = item.value
            if (item.key === "services_text") newSettings.services_text = item.value
          })
          setSettings(newSettings)
        }
      } catch (err) {
        console.error("Error in loadSettings:", err)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  // Filter projects based on active service
  const getFilteredProjects = (index: number) => {
    const service = services[index]

    if (Array.isArray(service.filter)) {
      return projects.filter((project) => project.type === service.type && service.filter.includes(project.role))
    }

    return projects.filter(
      (project) =>
        project.type === service.type && (project.role === service.filter || project.category === service.filter),
    )
  }

  const handleServiceClick = (index: number) => {
    if (activeService === index) {
      setActiveService(null)
    } else {
      setActiveService(index)
    }
  }

  return (
    <section id="services" className="py-24">
      <h2 className="text-5xl md:text-7xl font-serif mb-16">{settings.services_heading}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {services.map((service, index) => (
          <div key={index} className="relative">
            <div
              className={`border ${activeService === index ? "border-white" : "border-gray-800"} rounded-lg p-8 hover:border-white transition-colors cursor-pointer`}
              onClick={() => handleServiceClick(index)}
            >
              <div className="mb-6">{service.icon}</div>
              <h3 className="text-2xl font-serif mb-4">{service.title}</h3>
              <p className="text-gray-400">{service.description}</p>
            </div>

            <AnimatePresence>
              {activeService === index && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute left-0 right-0 mt-2 bg-gray-900 rounded-lg p-4 z-20 shadow-xl border border-gray-800"
                >
                  <div className="grid grid-cols-2 gap-2">
                    {getFilteredProjects(index)
                      .slice(0, 4)
                      .map((project) => (
                        <ProjectMiniCard
                          key={project.id}
                          id={project.id}
                          title={project.title}
                          image={project.image}
                          role={project.role}
                        />
                      ))}
                  </div>
                  {getFilteredProjects(index).length > 4 && (
                    <div className="mt-3 text-center">
                      <Link
                        href={`/projects?category=${services[index].type}&role=${services[index].filter}`}
                        className="text-sm text-gray-400 hover:text-white"
                      >
                        + {getFilteredProjects(index).length - 4} more projects
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <Button
          asChild
          variant="outline"
          size="lg"
          className="rounded-full border-white hover:bg-white hover:text-black transition-colors"
        >
          <Link href="/projects">View All Projects</Link>
        </Button>
      </div>
    </section>
  )
}
