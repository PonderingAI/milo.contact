import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"

interface ProjectCardProps {
  id: string
  title: string
  category: string
  role: string
  image: string
  link: string
  isAdmin?: boolean
  onEdit?: () => void
}

export function ProjectCard({ id, title, category, role, image, link, isAdmin, onEdit }: ProjectCardProps) {
  return (
    <div className="relative group block aspect-video overflow-hidden rounded-lg">
      <Image
        src={image || "/placeholder.svg"}
        alt={title}
        fill
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <Link href={link} className="absolute inset-0 z-0" aria-label={title}></Link>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>
      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 text-white z-10">
        <h3 className="text-lg md:text-xl font-serif mb-0.5 md:mb-1 group-hover:text-gray-200 transition-colors">{title}</h3>
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs md:text-sm text-gray-300">
          <span>{category}</span>
          <span className="before:content-['•'] before:mr-2">{role}</span>
        </div>
      </div>
      {isAdmin && onEdit && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2 z-20 h-8 w-8 p-0"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onEdit()
          }}
          aria-label="Edit project"
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

// Also keep the default export for backward compatibility
export default ProjectCard
