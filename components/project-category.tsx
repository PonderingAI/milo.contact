"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import ProjectCard from "@/components/project-card"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export interface Project {
  id: string
  title: string
  category: string
  type: string
  role: string
  image: string
  link: string
  description?: string
  hasVideo?: boolean
  hasBts?: boolean
}

interface ProjectCategoryProps {
  title: string
  projects: Project[]
  limit?: number
  showViewAll?: boolean
}

export default function ProjectCategory({ title, projects, limit = 4, showViewAll = true }: ProjectCategoryProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Limit the number of projects shown
  const displayedProjects = projects.slice(0, limit)

  return (
    <section className="mb-24" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-4xl md:text-5xl font-serif">{title}</h2>
        {showViewAll && projects.length > limit && (
          <Link href={`/projects?category=${title.toLowerCase()}`} className="group flex items-center gap-2 text-lg">
            View All
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AnimatePresence>
          {displayedProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  delay: index * 0.1,
                  duration: 0.5,
                },
              }}
              exit={{ opacity: 0, y: -20 }}
              whileHover={{ scale: 1.03 }}
              className="relative"
            >
              <ProjectCard
                id={project.id}
                title={project.title}
                category={project.category}
                role={project.role}
                image={project.image}
                link={`/projects/${project.id}`}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  )
}
