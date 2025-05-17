import HeroSection from "@/components/hero-section"
import AboutSection from "@/components/about-section"
import ProjectsSection from "@/components/projects-section"
import ServicesSection from "@/components/services-section"
import ContactSection from "@/components/contact-section"
import { createServerClient } from "./lib/supabase-server"
import { getProjects } from "./lib/project-data"

export const revalidate = 3600 // Revalidate at most once per hour

export default async function Home() {
  // Get site settings
  const supabase = createServerClient()
  const { data: settingsData } = await supabase.from("settings").select("key, value")

  // Convert settings to an object
  const settings: Record<string, any> = {}
  settingsData?.forEach((item) => {
    settings[item.key] = item.value
  })

  // Get projects for the featured section
  let allProjects = []
  let latestProject = null

  try {
    allProjects = await getProjects()

    // Sort projects by project_date or created_at, descending
    allProjects.sort((a, b) => {
      // Use project_date if available, otherwise fallback to created_at
      const dateA = a.project_date ? new Date(a.project_date) : a.created_at ? new Date(a.created_at) : new Date(0)
      const dateB = b.project_date ? new Date(b.project_date) : b.created_at ? new Date(b.created_at) : new Date(0)
      return dateB.getTime() - dateA.getTime()
    })

    // Get latest project with a video
    latestProject = allProjects.find((project) => project.video_url || project.thumbnail_url)

    console.log("Home: Latest project with video:", latestProject?.id, latestProject?.title)
    console.log("Home: Latest project video URL:", latestProject?.video_url || latestProject?.thumbnail_url)
  } catch (error) {
    console.error("Error fetching projects:", error)
  }

  return (
    <main>
      <HeroSection
        title={settings.hero_title || "Milo Presedo"}
        subtitle={settings.hero_subtitle || "Filmmaker, Podcaster & Media Expert"}
        bgImageUrl={settings.hero_bg_url || "/images/hero-bg.jpg"}
        bgVideoUrl={settings.video_url || ""}
        bgType={settings.hero_bg_type || "image"}
        buttonText={settings.cta_text || "View Projects"}
        buttonUrl={settings.cta_url || "/projects"}
        latestProject={latestProject}
      />
      <AboutSection />
      <ProjectsSection projects={allProjects.slice(0, 6)} />
      <ServicesSection />
      <ContactSection />
    </main>
  )
}
