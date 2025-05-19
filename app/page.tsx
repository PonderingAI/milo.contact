import HeroSection from "@/components/hero-section"
import AboutSection from "@/components/about-section"
import ProjectsSection from "@/components/projects-section"
import ServicesSection from "@/components/services-section"
import ContactSection from "@/components/contact-section"
import { createServerClient } from "@/lib/supabase-server"

async function getLatestProject() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)

    if (error || !data || data.length === 0) {
      console.log("No latest project found or error:", error)
      return null
    }

    return data[0]
  } catch (error) {
    console.error("Error in getLatestProject:", error)
    return null
  }
}

export default async function Home() {
  // Fetch the latest project for the hero section
  let latestProject = null
  try {
    latestProject = await getLatestProject()
  } catch (error) {
    console.error("Failed to get latest project:", error)
  }

  return (
    <main>
      <HeroSection latestProject={latestProject} />
      <AboutSection />
      <ProjectsSection />
      <ServicesSection />
      <ContactSection />
    </main>
  )
}
