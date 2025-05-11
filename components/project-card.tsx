import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

interface ProjectCardProps {
  id: string
  title: string
  category: string
  role: string
  image: string
  link: string
}

export default function ProjectCard({ id, title, category, role, image, link }: ProjectCardProps) {
  return (
    <Link href={link} className="group relative block h-[200px] overflow-hidden rounded-lg">
      <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors z-10" />

      <Image
        src={image || "/placeholder.svg?height=200&width=300"}
        alt={title}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />

      <div className="absolute inset-0 z-20 p-4 flex flex-col justify-between">
        <div className="self-end">
          <span className="inline-flex items-center rounded-full bg-white/10 backdrop-blur-sm px-3 py-1 text-xs">
            {category}
          </span>
        </div>

        <div>
          <h3 className="text-lg font-serif mb-1">{title}</h3>
          <span className="project-role text-xs">{role}</span>
          <div className="flex items-center gap-1 text-xs opacity-0 transform translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all absolute top-4 right-4">
            View <ArrowUpRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </Link>
  )
}
