import type { Metadata } from "next"
import ProjectForm from "@/components/admin/project-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Create New Project",
  description: "Create a new project in your portfolio",
}

export default function NewProjectPage() {
  return (
    <div className="container py-10">
      <Card className="border-gray-800 bg-[#070a10]">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Create New Project</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm mode="create" />
        </CardContent>
      </Card>
    </div>
  )
}
