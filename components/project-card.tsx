import Image from "next/image"
import Link from "next/link"

interface ProjectCardProps {
  id: string
  title: string
  category?: string
  role?: string
  image?: string
  link: string
}

export function ProjectCard({ id, title, category, role, image, link }: ProjectCardProps) {
  // Provide fallbacks for all props
  const safeTitle = title || "Untitled Project"
  const safeCategory = category || ""
  const safeRole = role || ""
  const safeImage = image || "/images/project1.jpg" // Default image
  const safeLink = link || "#"

  return (
    <div className="group relative overflow-hidden rounded-lg bg-black">
      <Link href={safeLink} className="block">
        <div className="relative h-[300px] w-full overflow-hidden">
          <Image
            src={safeImage || "/placeholder.svg"}
            alt={safeTitle}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-80"></div>
        </div>
        <div className="absolute bottom-0 left-0 w-full p-4 text-white">
          <h3 className="text-xl font-bold">{safeTitle}</h3>
          <div className="mt-1 flex flex-wrap gap-2">
            {safeCategory && (
              <span className="inline-block rounded-full bg-white/20 px-2 py-1 text-xs">{safeCategory}</span>
            )}
            {safeRole && <span className="inline-block rounded-full bg-white/20 px-2 py-1 text-xs">{safeRole}</span>}
          </div>
        </div>
      </Link>
    </div>
  )
}

export default ProjectCard
