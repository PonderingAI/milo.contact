import { createServerClient } from "@/lib/supabase-server"
import VideoBackground from "./video-background"
import { fontSerif } from "@/lib/fonts"

interface HeroSectionProps {
  latestProject?: any
}

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

export default async function HeroSection({ latestProject }: HeroSectionProps) {
  const settings = await getHeroSettings()

  // Determine what media to show based on hero_bg_type
  let backgroundMedia = settings.image_hero_bg

  if (settings.hero_bg_type === "latest_project" && latestProject) {
    // Use the latest project's video or image
    backgroundMedia = latestProject.video_url || latestProject.thumbnail_url || settings.image_hero_bg
  }

  const isVideo =
    backgroundMedia?.includes("vimeo.com") ||
    backgroundMedia?.includes("youtube.com") ||
    backgroundMedia?.includes("youtu.be") ||
    backgroundMedia?.includes("linkedin.com")

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
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

      {/* Center Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl">
        <h1 className={`text-4xl md:text-6xl font-bold mb-4 ${fontSerif.variable} font-serif`}>
          {settings.hero_heading}
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">{settings.hero_subheading}</p>
      </div>

      {/* Bottom Left Text */}
      <div className="absolute bottom-8 left-8 z-10">
        <p className="text-sm md:text-base text-gray-300 opacity-80">Cinematography • Camera • Drone • Underwater</p>
      </div>
    </section>
  )
}
