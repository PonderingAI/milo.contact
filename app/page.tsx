import { createServerClient } from "@/lib/supabase-server"
import HeroSection from "@/components/hero-section"
import AboutSection from "@/components/about-section"
import ProjectsSection from "@/components/projects-section"
import ServicesSection from "@/components/services-section"
import ContactSection from "@/components/contact-section"

async function getHeroSettings() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .in("key", ["hero_heading", "hero_subheading", "image_hero_bg", "hero_bg_type"])

    if (error) {
      console.error("Error fetching hero settings:", error)
      return {
        hero_heading: "Milo Presedo",
        hero_subheading: "Director of Photography, Camera Assistant, Drone & Underwater Operator",
        image_hero_bg: "/images/hero-bg.jpg",
        hero_bg_type: "image",
      }
    }

    // Convert array to object
    const settings: Record<string, string> = {}
    data.forEach((item) => {
      settings[item.key] = item.value
    })

    return {
      hero_heading: settings.hero_heading || "Milo Presedo",
      hero_subheading:
        settings.hero_subheading || "Director of Photography, Camera Assistant, Drone & Underwater Operator",
      image_hero_bg: settings.image_hero_bg || "/images/hero-bg.jpg",
      hero_bg_type: settings.hero_bg_type || "image",
    }
  } catch (error) {
    console.error("Error in getHeroSettings:", error)
    return {
      hero_heading: "Milo Presedo",
      hero_subheading: "Director of Photography, Camera Assistant, Drone & Underwater Operator",
      image_hero_bg: "/images/hero-bg.jpg",
      hero_bg_type: "image",
    }
  }
}

async function getLatestProject() {
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
  const heroSettings = await getHeroSettings()
  const latestProject = await getLatestProject()

  return (
    <main>
      <HeroSection initialSettings={heroSettings} latestProject={latestProject} />
      <AboutSection />
      <ProjectsSection />
      <ServicesSection />
      <ContactSection />
    </main>
  )
}
