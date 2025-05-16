import type { Metadata } from "next"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import ProjectForm from "@/components/admin/project-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { notFound } from "next/navigation"

export const metadata: Metadata = {
  title: "Edit Project",
  description: "Edit an existing project in your portfolio",
}

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies })

  // Fetch the project data
  const { data: project, error } = await supabase.from("projects").select("*").eq("id", params.id).single()

  if (error || !project) {
    return notFound()
  }

  return (
    <div className="container py-10">
      <Card className="border-gray-800 bg-[#070a10]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Edit Project: {project.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm project={project} mode="edit" />
        </CardContent>
      </Card>
    </div>
  )
}
