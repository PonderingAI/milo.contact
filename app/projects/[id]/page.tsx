import { Suspense } from "react"
import ProjectDetailContent from "./project-detail-content"
import { getProjectById, mockProjects, mockBtsImages } from "@/lib/project-data"
import { notFound } from "next/navigation"

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  // In production, fetch project from Supabase
  // For development, use mock data
  let project
  try {
    project = await getProjectById(params.id)

    // If no project is returned (e.g., during development without Supabase),
    // fall back to mock data
    if (!project) {
      project = mockProjects.find((p) => p.id === params.id)

      if (project) {
        // Add mock BTS images if available
        const btsImages = mockBtsImages.filter((img) => img.project_id === params.id)
        project = {
          ...project,
          bts_images: btsImages,
        }
      }
    }
  } catch (error) {
    console.error("Error fetching project:", error)
    project = mockProjects.find((p) => p.id === params.id)

    if (project) {
      // Add mock BTS images if available
      const btsImages = mockBtsImages.filter((img) => img.project_id === params.id)
      project = {
        ...project,
        bts_images: btsImages,
      }
    }
  }

  if (!project) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12">
        <Suspense fallback={<div>Loading project details...</div>}>
          <ProjectDetailContent project={project} />
        </Suspense>
      </div>
    </main>
  )
}

// Generate static params for all mock projects to ensure they work in production
export async function generateStaticParams() {
  return mockProjects.map((project) => ({
    id: project.id,
  }))
}
