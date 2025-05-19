import Link from "next/link"
import VideoBackground from "./video-background"
import { unstable_cache } from "next/cache"

// Cache the hero section data
const getHeroData = unstable_cache(
  async (projectId: string | undefined) => {
    // This is a placeholder for actual data fetching
    // In a real app, you would fetch data from an API or database
    return {
      title: "Milo Presedo",
      subtitle: "Director of Photography, Camera Assistant, Drone & Underwater Operator",
    }
  },
  ["hero-data"],
  { revalidate: 60 }, // Revalidate every 60 seconds
)

interface HeroSectionProps {
  latestProject: any
}

export default async function HeroSection({ latestProject }: HeroSectionProps) {
  const heroData = await getHeroData(latestProject?.id)

  // Determine if we have a valid video URL
  const hasVideo = latestProject?.video_url && typeof latestProject.video_url === "string"

  // Log for debugging
  console.log("Hero section latest project:", {
    title: latestProject?.title,
    hasVideo,
    videoUrl: hasVideo ? latestProject.video_url : "none",
  })

  return (
    <section className="relative h-screen flex items-end justify-start overflow-hidden">
      {/* Background - either video or plain black */}
      {hasVideo ? (
        <VideoBackground videoUrl={latestProject.video_url} />
      ) : (
        <div className="absolute inset-0 bg-black" />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

      {/* Content */}
      <div className="relative container mx-auto px-4 pb-24 z-10">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-white">{heroData.title}</h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8">{heroData.subtitle}</p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/projects"
              className="bg-white text-black px-6 py-3 rounded-md font-medium hover:bg-gray-200 transition"
            >
              View Projects
            </Link>
            <Link
              href="/contact"
              className="bg-transparent border border-white text-white px-6 py-3 rounded-md font-medium hover:bg-white/10 transition"
            >
              Contact Me
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
