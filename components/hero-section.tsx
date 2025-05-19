import { createServerClient } from "@/lib/supabase-server"
import VideoBackground from "./video-background"
import { fontSerif } from "@/lib/fonts"
import { unstable_noStore as noStore } from "next/cache"

interface HeroSectionProps {
  latestProject?: any
}

async function getHeroSettings() {
  // Prevent caching to ensure we always get fresh data
  noStore()

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

    // Debug log to verify what settings are being fetched
    console.log("Hero settings fetched:", {
      hero_bg_type: settings.hero_bg_type,
      image_hero_bg: settings.image_hero_bg,
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

export default async function HeroSection({ latestProject: propLatestProject }: HeroSectionProps) {
  const settings = await getHeroSettings()

  // Only fetch latest project if needed and not provided as prop
  let latestProject = propLatestProject
  if (settings.hero_bg_type === "latest_project" && !propLatestProject) {
    latestProject = await getLatestProject()
  }

  // Determine what media to show based on hero_bg_type
  let backgroundMedia = settings.image_hero_bg

  if (settings.hero_bg_type === "latest_project" && latestProject) {
    // Use the latest project's video or image
    backgroundMedia = latestProject.thumbnail_url || latestProject.image || settings.image_hero_bg
    console.log("Using latest project media:", backgroundMedia)
  }

  const isVideo =
    backgroundMedia?.includes("vimeo.com") ||
    backgroundMedia?.includes("youtube.com") ||
    backgroundMedia?.includes("youtu.be") ||
    backgroundMedia?.includes("linkedin.com")

  // Debug log to verify what's being rendered
  console.log("Hero rendering with:", {
    bgType: settings.hero_bg_type,
    isVideo,
    backgroundMedia,
  })

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Background Media */}
      {isVideo ? (
        <VideoBackground videoUrl={backgroundMedia} />
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundMedia})` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        </div>
      )}

      {/* Bottom Left Text */}
      <div className="absolute bottom-8 left-8 z-10 max-w-md text-left">
        <h1
          className={`text-3xl md:text-4xl font-bold mb-2 ${fontSerif.variable} font-serif text-shadow-sm`}
          style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
        >
          {settings.hero_heading}
        </h1>
        <p
          className="text-sm md:text-base text-gray-200 leading-snug"
          style={{ textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
        >
          {settings.hero_subheading}
        </p>
      </div>
    </section>
  )
}
