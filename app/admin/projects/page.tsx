import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { PlusCircle, Edit } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import DeleteProjectButton from "@/components/admin/delete-project-button"
import { getProjects } from "@/lib/project-data"

export default async function ProjectsPage() {
  // Get projects using the existing getProjects function
  const projects = await getProjects()

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif">Projects</h1>
        <Button asChild>
          <Link href="/admin/projects/new">
            <PlusCircle className="mr-2 h-4 w-4" /> New Project
          </Link>
        </Button>
      </div>

      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="overflow-hidden">
              <div className="relative h-48">
                <Image
                  src={project.image || "/placeholder.svg?height=200&width=300"}
                  alt={project.title}
                  fill
                  className="object-cover"
                />
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-lg">{project.title}</h3>
                    <p className="text-sm text-gray-400">
                      {project.category} • {project.role}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/projects/${project.id}/edit`}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Link>
                    </Button>
                    <DeleteProjectButton id={project.id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">No projects found</p>
          <Button asChild>
            <Link href="/admin/projects/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Create Your First Project
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
