import { Suspense } from "react"
import ProjectsContent from "./projects-content"
import { getProjects, mockProjects } from "@/lib/project-data"

export default async function ProjectsPage() {
  // In production, fetch projects from Supabase
  // For development, use mock data
  let projects
  try {
    projects = await getProjects()
    // If no projects are returned (e.g., during development without Supabase),
    // fall back to mock data
    if (projects.length === 0) {
      projects = mockProjects
    }
  } catch (error) {
    console.error("Error fetching projects:", error)
    projects = mockProjects
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-24">
        <Suspense fallback={<div>Loading projects...</div>}>
          <ProjectsContent initialProjects={projects} />
        </Suspense>
      </div>
    </main>
  )
}
