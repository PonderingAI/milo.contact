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
      <Suspense fallback={<ProjectDetailSkeleton />}>
        <ProjectDetailContent project={project} />
      </Suspense>
    </main>
  )
}

function ProjectDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Back button skeleton */}
        <div className="mb-8">
          <div className="w-32 h-10 bg-gray-800 rounded-md animate-pulse"></div>
        </div>

        {/* Video skeleton */}
        <div className="w-full mb-12 aspect-video bg-gray-800 rounded-lg animate-pulse"></div>

        {/* Title skeleton */}
        <div className="mb-16">
          <div className="w-3/4 h-12 bg-gray-800 rounded-md animate-pulse mb-6"></div>
          <div className="flex gap-3">
            <div className="w-24 h-8 bg-gray-800 rounded-full animate-pulse"></div>
            <div className="w-24 h-8 bg-gray-800 rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
          <div className="lg:col-span-2">
            <div className="w-48 h-8 bg-gray-800 rounded-md animate-pulse mb-6"></div>
            <div className="space-y-4">
              <div className="w-full h-4 bg-gray-800 rounded animate-pulse"></div>
              <div className="w-full h-4 bg-gray-800 rounded animate-pulse"></div>
              <div className="w-3/4 h-4 bg-gray-800 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="w-48 h-8 bg-gray-800 rounded-md animate-pulse mb-6"></div>
            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
              <div className="space-y-4">
                <div className="w-full h-4 bg-gray-800 rounded animate-pulse"></div>
                <div className="w-3/4 h-4 bg-gray-800 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Generate static params for all mock projects to ensure they work in production
export async function generateStaticParams() {
  return mockProjects.map((project) => ({
    id: project.id,
  }))
}
