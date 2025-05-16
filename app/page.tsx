import { Suspense } from "react"
import HeroSection from "@/components/hero-section"
import AboutSection from "@/components/about-section"
import ServicesSection from "@/components/services-section"
import ProjectsSection from "@/components/projects-section"
import ContactSection from "@/components/contact-section"
import CustomCursor from "@/components/custom-cursor"
import { getProjects } from "@/lib/project-data"

export default async function Home() {
  // Safely fetch projects with error handling
  let projects = []
  try {
    projects = await getProjects()
  } catch (error) {
    console.error("Error fetching projects:", error)
    // Continue with empty projects array
  }

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      <CustomCursor />

      <Suspense fallback={<div className="h-screen bg-black"></div>}>
        <HeroSection />
      </Suspense>

      <AboutSection />

      <ServicesSection />

      <Suspense fallback={<div className="h-screen bg-black"></div>}>
        <ProjectsSection projects={projects} />
      </Suspense>

      <ContactSection />
    </main>
  )
}
