import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import ProjectForm from "@/components/admin/project-form"
import { getProjectById } from "@/lib/project-data"

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  try {
    // Get the project using the more reliable getProjectById function
    const project = await getProjectById(params.id)

    if (!project) {
      return (
        <div className="p-8">
          <div className="flex items-center gap-4 mb-8">
            <Link
              href="/admin/projects"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Projects
            </Link>
          </div>

          <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-red-400 mb-2">Project Not Found</h2>
            <p className="text-gray-300">
              The project you're looking for could not be found. It may have been deleted or the ID is incorrect.
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="p-8">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/projects"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Projects
          </Link>
        </div>

        <h1 className="text-3xl font-serif mb-8">Edit Project: {project.title}</h1>

        <ProjectForm project={project} mode="edit" />
      </div>
    )
  } catch (error) {
    console.error("Error in EditProjectPage:", error)

    return (
      <div className="p-8">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin/projects"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Projects
          </Link>
        </div>

        <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Project</h2>
          <p className="text-gray-300">
            There was an error loading this project. Please try again later or contact support.
          </p>
          <p className="text-gray-400 mt-4 text-sm">Error details: {(error as Error).message || "Unknown error"}</p>
        </div>
      </div>
    )
  }
}
