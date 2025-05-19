"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Play, ArrowUpRight } from "lucide-react"
import { extractVideoInfo } from "@/lib/project-data"
import type { Project } from "@/lib/project-data"

export default function FeaturedProject({ project }: { project: Project }) {
  const [isHovering, setIsHovering] = useState(false)

  // Extract video info if available
  const videoInfo = project.video_url ? extractVideoInfo(project.video_url) : null

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group relative block w-full h-[50vh] md:h-[70vh] overflow-hidden rounded-lg mb-12"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors z-10" />

      <Image
        src={project.image || "/placeholder.svg?height=800&width=1200"}
        alt={project.title}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
        priority
      />

      {videoInfo && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-all">
            <Play className="w-10 h-10 text-white fill-white" />
          </div>
        </div>
      )}

      <div className="absolute inset-0 z-20 p-8 flex flex-col justify-between">
        <div className="self-end">
          <span className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-sm px-3 py-1 text-sm">
            {project.category}
          </span>
        </div>

        <div className="max-w-3xl">
          <span className="text-sm uppercase tracking-wider text-gray-300 mb-2 block">Featured Project</span>
          <h2 className="text-3xl md:text-5xl font-serif mb-4">{project.title}</h2>
          <p className="text-gray-300 mb-6 max-w-2xl line-clamp-3">{project.description}</p>
          <div className="flex items-center gap-2 text-sm font-medium bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full w-fit">
            View Project <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  )
}
