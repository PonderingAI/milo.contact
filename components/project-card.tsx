import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Edit, Eye, EyeOff, CalendarDays } from "lucide-react"
import DeleteProjectButton from "@/components/admin/delete-project-button"
import type React from "react" // Added import for React.MouseEvent

interface ProjectCardProps {
  id: string
  title: string
  category: string
  role: string
  image: string
  link: string
  isAdmin?: boolean
  onEdit?: () => void
  onDelete?: () => void
  project_date?: string | null
  is_public?: boolean
}

export function ProjectCard({ id, title, category, role, image, link, isAdmin, onEdit, onDelete, project_date, is_public }: ProjectCardProps) {
  // Determine if project is private based on is_public flag and project_date
  const now = new Date()
  const isPrivate = is_public === false || (project_date && new Date(project_date) > now)

  return (
    <Link href={link} aria-label={title} className="relative group block aspect-video overflow-hidden rounded-lg">
      <Image 
        src={image || "/placeholder.svg"} 
        alt={title} 
        fill 
        className="object-cover transition-transform duration-500 group-hover:scale-105" 
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-80 group-hover:opacity-100 transition-opacity"></div>

      {/* Admin Indicators (top-left) */}
      {isAdmin && (
        <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-1 text-xs">
          <div className="flex items-center rounded-full bg-black/50 px-2 py-0.5 text-white">
            {isPrivate ? <EyeOff className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}
            <span>{isPrivate ? "Private" : "Public"}</span>
          </div>
          {isPrivate && project_date && (
            <div className="flex items-center rounded-full bg-black/50 px-2 py-0.5 text-white">
              <CalendarDays className="mr-1 h-3 w-3" />
              <span>{new Date(project_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Text content (bottom-left) */}
      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 text-white z-10">
        <h3 className="text-lg md:text-xl font-serif mb-0.5 md:mb-1 group-hover:text-gray-200 transition-colors">{title}</h3>
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs md:text-sm">
          <span className="text-gray-300">{category}</span>
          <span className="text-gray-300 before:content-['•'] before:mr-1.5 md:before:mr-2">{role}</span>
        </div>
      </div>

      {/* Edit and Delete Buttons (bottom-right) */}
      {isAdmin && onEdit && (
        <div className="absolute bottom-3 right-3 z-20 flex gap-1">
          <Button
            onClick={(e: React.MouseEvent) => { 
              e.stopPropagation(); 
              e.preventDefault();  
              if (onEdit) { 
                  onEdit();
              }
            }}
            variant="secondary" 
            size="icon" 
            className="h-8 w-8 p-0"
            aria-label="Edit project"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <DeleteProjectButton id={id} onDelete={onDelete} />
        </div>
      )}
    </Link>
  )
}

// Also keep the default export for backward compatibility
export default ProjectCard
