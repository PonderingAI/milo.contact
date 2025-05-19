import { Suspense } from "react"
import HeroSection from "@/components/hero-section"
import AboutSection from "@/components/about-section"
import ProjectsSection from "@/components/projects-section"
import ServicesSection from "@/components/services-section"
import ContactSection from "@/components/contact-section"
import { createServerClient } from "@/lib/supabase-server"
import { unstable_noStore as noStore } from "next/cache"

async function getLatestProject() {
  // Prevent caching to ensure we always get fresh data
  noStore()

  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      console.error("Error fetching latest project:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getLatestProject:", error)
    return null
  }
}

export default async function Home() {
  // Fetch the latest project for the hero section
  const latestProject = await getLatestProject()

  return (
    <main>
      <Suspense fallback={<div className="h-screen bg-black"></div>}>
        <HeroSection latestProject={latestProject} />
      </Suspense>
      <AboutSection />
      <ProjectsSection />
      <ServicesSection />
      <ContactSection />
    </main>
  )
}
