import { Suspense } from "react"
import HeroSection from "@/components/hero-section"
import AboutSection from "@/components/about-section"
import ServicesSection from "@/components/services-section"
import ProjectsSection from "@/components/projects-section"
import ContactSection from "@/components/contact-section"
import { createAdminClient } from "@/lib/supabase-server"

async function getLatestProject() {
  try {
    const supabase = createAdminClient()
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
  const latestProject = await getLatestProject()

  return (
    <main>
      <Suspense fallback={<div>Loading...</div>}>
        <HeroSection latestProject={latestProject} />
      </Suspense>
      <AboutSection />
      <ServicesSection />
      <ProjectsSection />
      <ContactSection />
    </main>
  )
}
