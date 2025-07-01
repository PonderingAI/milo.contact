import { Suspense } from "react"
import HeroSection from "@/components/hero-section"
import AboutSection from "@/components/about-section"
import ContactSection from "@/components/contact-section"
import ProjectsSection from "@/components/projects-section"
import Footer from "@/components/footer"
import { getProjects, isDatabaseSetup } from "@/lib/project-data-server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createServerClient } from "@/lib/supabase-server"

async function getLatestProject() {
  try {
    const supabase = createServerClient()

    // Get the latest project with a thumbnail_url instead of video_url
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .not("thumbnail_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) {
      console.error("Error fetching latest project:", error)
      return null
    }

    // Return the first item if it exists, otherwise null
    const project = data && data.length > 0 ? data[0] : null
    return project
  } catch (error) {
    console.error("Error in getLatestProject:", error)
    return null
  }
}

// In the HomePage component, ensure we're passing the latest project to HeroSection
export default async function HomePage() {
  // Get all projects
  const projects = await getProjects()

  // Get the latest project (first in the array since they're ordered by created_at desc)
  const latestProject = projects.length > 0 ? projects[0] : null

  console.log("Latest project for hero:", latestProject?.title)

  // Check if database is set up
  const dbSetup = await isDatabaseSetup()

  // Get projects - this will return mock data if the database isn't set up
  // Get the latest project with video
  // const latestProject = await getLatestProject()

  // Check if we have real projects from the database
  const hasRealProjects = dbSetup && projects.length > 0

  return (
    <main className="min-h-screen bg-black text-white">
      <HeroSection latestProject={latestProject} />

      <div className="container mx-auto px-4 py-24">
        {!dbSetup && (
          <div className="mb-12 p-6 bg-yellow-900/20 border border-yellow-800 rounded-lg">
            <h2 className="text-xl font-bold mb-2">Database Setup Required</h2>
            <p className="mb-4">
              Your portfolio database needs to be set up before all features will work correctly. This will create the
              necessary tables and default settings.
            </p>
            <Button asChild>
              <Link href="/setup">Run Setup</Link>
            </Button>
          </div>
        )}

        {/* Projects Section with client-side search and filtering */}
        <Suspense fallback={<div className="h-96 bg-gray-900 rounded-lg animate-pulse mb-24"></div>}>
          <ProjectsSection projects={projects} />
        </Suspense>

        <AboutSection />
        <ContactSection />
      </div>

      <Footer />
    </main>
  )
}
