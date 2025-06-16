import ProjectEditor from "@/components/admin/project-editor"
import { getProjectById } from "@/lib/project-data-server"

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  try {
    // Get the project using the more reliable getProjectById function
    const project = await getProjectById(params.id)

    if (!project) {
      return <ProjectEditor mode="edit" />
    }

    return <ProjectEditor project={project} mode="edit" />
  } catch (error) {
    console.error("Error in EditProjectPage:", error)
    return <ProjectEditor mode="edit" />
  }
}
