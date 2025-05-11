import Image from "next/image"
import Link from "next/link"

interface ProjectMiniCardProps {
  id: string
  title: string
  image: string
  role: string
}

export default function ProjectMiniCard({ id, title, image, role }: ProjectMiniCardProps) {
  return (
    <Link href={`/projects/${id}`} className="block">
      <div className="relative h-24 rounded-md overflow-hidden group">
        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors z-10" />

        <Image src={image || "/placeholder.svg?height=100&width=150"} alt={title} fill className="object-cover" />

        <div className="absolute inset-0 z-20 p-2 flex flex-col justify-between">
          <div className="self-end">
            <span className="text-xs truncate max-w-full block">{title}</span>
          </div>

          <div>
            <span className="text-xs bg-black/50 px-1 py-0.5 rounded">{role}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
