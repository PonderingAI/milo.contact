import Image from "next/image"
import Link from "next/link"

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
    <Link href={link} className="group block">
      <div className="relative aspect-video overflow-hidden rounded-lg">
        <Image
          src={image || "/placeholder.svg"}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors"></div>

        {/* Text overlay positioned at bottom left */}
        <div className="absolute bottom-0 left-0 p-4 w-full bg-gradient-to-t from-black/80 to-transparent">
          <h3 className="text-xl font-serif text-white mb-1 group-hover:text-gray-200 transition-colors">{title}</h3>
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-300">{category}</span>
            <span className="text-sm text-gray-300 before:content-['•'] before:mr-2">{role}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
