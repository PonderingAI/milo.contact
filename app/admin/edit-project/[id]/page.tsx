import { getProjectById } from "@/lib/project-data"
import ProjectEditor from "@/components/admin/project-editor"

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  try {
    // Get the project using the more reliable getProjectById function
    const project = await getProjectById(params.id)

    if (!project) {
      return (
        <div className="p-4">
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-red-400 mb-2">Project Not Found</h2>
            <p className="text-gray-300">
              The project you're looking for could not be found. It may have been deleted or the ID is incorrect.
            </p>
          </div>
        </div>
      )
    }

    return <ProjectEditor project={project} mode="edit" />
  } catch (error) {
    console.error("Error in EditProjectPage:", error)

    return (
      <div className="p-4">
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
