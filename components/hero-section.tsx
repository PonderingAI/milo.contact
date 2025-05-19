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

  console.log("Hero settings:", settings)
  console.log("Latest project:", latestProject)

  // Determine what media to show based on hero_bg_type
  let backgroundMedia = settings.image_hero_bg
  let fallbackImage = "/images/hero-bg.jpg"

  if (settings.hero_bg_type === "latest_project" && latestProject) {
    // Use the latest project's video or image
    backgroundMedia = latestProject.video_url || latestProject.thumbnail_url || settings.image_hero_bg
    fallbackImage = latestProject.thumbnail_url || settings.image_hero_bg
    console.log("Using latest project media:", backgroundMedia)
  } else {
    console.log("Using configured media:", backgroundMedia)
  }

  // Ensure we have a valid fallback image
  if (!fallbackImage || fallbackImage === "latest_project") {
    fallbackImage = "/images/hero-bg.jpg"
  }

  const isVideo =
    backgroundMedia?.includes("vimeo.com") ||
    backgroundMedia?.includes("youtube.com") ||
    backgroundMedia?.includes("youtu.be") ||
    backgroundMedia?.includes("linkedin.com")

  return (
    <section className="relative h-screen overflow-hidden">
      {/* Background Media */}
      {isVideo ? (
        <VideoBackground videoUrl={backgroundMedia} fallbackImage={fallbackImage} />
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
        <h1 className={`text-3xl md:text-4xl font-bold mb-2 ${fontSerif.variable} font-serif`}>
          {settings.hero_heading}
        </h1>
        <p className="text-sm md:text-base text-gray-200 leading-snug">{settings.hero_subheading}</p>
      </div>
    </section>
  )
}
