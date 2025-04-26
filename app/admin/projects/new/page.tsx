import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import ProjectForm from "@/components/admin/project-form"

export default function NewProjectPage() {
  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/projects"
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Projects
        </Link>
      </div>

      <h1 className="text-3xl font-serif mb-8">Create New Project</h1>

      <ProjectForm mode="create" />
    </div>
  )
}
