import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Edit, Eye, EyeOff, CalendarDays } from "lucide-react"

interface ProjectCardProps {
  id: string
  title: string
  category: string
  role: string
  image: string
  link: string
  isAdmin?: boolean
  onEdit?: () => void
  is_public?: boolean
  publish_date?: string | null
}

export function ProjectCard({ id, title, category, role, image, link, isAdmin, onEdit, is_public, publish_date }: ProjectCardProps) {
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
      
      {isAdmin && (
        <div className="absolute top-2 left-2 z-10 space-y-1 text-xs">
          {typeof is_public !== 'undefined' && (
            <div className="flex items-center rounded-full bg-black/50 px-2 py-0.5 text-white">
              {is_public ? <Eye className="mr-1 h-3 w-3" /> : <EyeOff className="mr-1 h-3 w-3" />}
              <span>{is_public ? "Public" : "Private"}</span>
            </div>
          )}
          {publish_date && (
            <div className="flex items-center rounded-full bg-black/50 px-2 py-0.5 text-white">
              <CalendarDays className="mr-1 h-3 w-3" />
              <span>Scheduled: {new Date(publish_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      )}

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
          className="absolute bottom-3 right-3 z-20 h-8 w-8 p-0"
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
