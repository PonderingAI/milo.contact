import { getProjects } from "@/lib/project-data"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function SeedProjectsPage() {
  // Get the existing projects
  const projects = await getProjects()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-serif">Projects Status</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-medium mb-4">Projects Found: {projects.length}</h2>

        <div className="space-y-4">
          <p>
            Your projects are already available in the system. You can manage them from the{" "}
            <Link href="/admin/projects" className="text-blue-600 hover:underline">
              Projects page
            </Link>
            .
          </p>

          <div className="bg-green-50 border border-green-200 rounded p-4">
            <p className="text-green-800">
              The projects are already connected to your admin panel. You can edit, delete, or add new projects as
              needed.
            </p>
          </div>

          <h3 className="font-medium mt-6">Project Types Found:</h3>
          <ul className="list-disc pl-5 space-y-1">
            {Array.from(new Set(projects.map((p) => p.type))).map((type) => (
              <li key={type} className="capitalize">
                {type}
              </li>
            ))}
          </ul>

          <h3 className="font-medium mt-6">Roles Found:</h3>
          <ul className="list-disc pl-5 space-y-1">
            {Array.from(new Set(projects.map((p) => p.role))).map((role) => (
              <li key={role}>{role}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" asChild>
          <Link href="/admin">Back to Dashboard</Link>
        </Button>
        <Button asChild>
          <Link href="/admin/projects">Manage Projects</Link>
        </Button>
      </div>
    </div>
  )
}
