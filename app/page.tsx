import { Suspense } from "react"
import HeroSection from "@/components/hero-section"
import AboutSection from "@/components/about-section"
import ContactSection from "@/components/contact-section"
import ProjectsSection from "@/components/projects-section"
import { getProjects, isDatabaseSetup } from "@/lib/project-data"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function Home() {
  // Check if database is set up
  const dbSetup = await isDatabaseSetup()

  // Get projects - this will return mock data if the database isn't set up
  const projects = await getProjects()

  // Get the latest project
  const latestProject = projects.length > 0 ? projects[0] : null

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

      <footer className="border-t border-gray-800 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© {new Date().getFullYear()} Milo Presedo. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="https://instagram.com/milo.presedo" className="text-gray-400 hover:text-white">
                Instagram
              </a>
              <a href="https://chatgpt.com/g/g-vOF4lzRBG-milo" className="text-gray-400 hover:text-white">
                ChatGPT
              </a>
              <a href="mailto:milo.presedo@mailbox.org" className="text-gray-400 hover:text-white">
                Email
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
