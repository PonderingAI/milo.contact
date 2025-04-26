import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createServerClient } from "@/lib/supabase"
import ProjectForm from "@/components/admin/project-form"
import { notFound } from "next/navigation"
import BtsImageManager from "@/components/admin/bts-image-manager"

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()

  // Get the project
  const { data: project, error } = await supabase.from("projects").select("*").eq("id", params.id).single()

  if (error || !project) {
    notFound()
  }

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

      <h1 className="text-3xl font-serif mb-8">Edit Project: {project.title}</h1>

      <ProjectForm project={project} mode="edit" />

      <div className="mt-12 border-t border-gray-800 pt-8">
        <h2 className="text-2xl font-serif mb-6">Behind the Scenes Images</h2>
        <BtsImageManager projectId={params.id} />
      </div>
    </div>
  )
}
