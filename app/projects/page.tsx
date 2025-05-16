import { Suspense } from "react"
import ProjectsContent from "./projects-content"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Projects | Milo Presedo",
  description: "Explore Milo Presedo's portfolio of film, photography, and creative projects.",
}

export default function ProjectsPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-12">
        <Suspense fallback={<div>Loading projects...</div>}>
          <ProjectsContent />
        </Suspense>
      </div>
    </main>
  )
}
