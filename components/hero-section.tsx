import Link from "next/link"
import VideoBackground from "./video-background"
import type { Project } from "@/lib/project-data"

interface HeroSectionProps {
  title?: string
  subtitle?: string
  bgImageUrl?: string
  bgVideoUrl?: string
  bgType?: "image" | "video" | "latest_project"
  buttonText?: string
  buttonUrl?: string
  latestProject?: Project
}

export default function HeroSection({
  title = "Milo Presedo",
  subtitle = "Filmmaker, Podcaster & Media Expert",
  bgImageUrl = "/images/hero-bg.jpg",
  bgVideoUrl = "",
  bgType = "image",
  buttonText = "View Projects",
  buttonUrl = "/projects",
  latestProject,
}: HeroSectionProps) {
  // Determine the correct background to use based on the bgType
  const useLatestProject = bgType === "latest_project" && latestProject

  let backgroundImageUrl = bgImageUrl
  let backgroundVideoUrl = bgVideoUrl

  // Log important information for debugging
  console.log("HeroSection: Background type:", bgType)
  console.log("HeroSection: Latest project available:", !!latestProject)

  if (useLatestProject) {
    console.log("HeroSection: Using latest project:", latestProject.id, latestProject.title)

    // Use latest project video URL if available, otherwise use the image
    if (latestProject.video_url) {
      console.log("HeroSection: Using latest project video:", latestProject.video_url)
      backgroundVideoUrl = latestProject.video_url
      backgroundImageUrl = latestProject.image || bgImageUrl // Use project image as fallback
    } else {
      console.log("HeroSection: Latest project has no video, using image:", latestProject.image)
      backgroundImageUrl = latestProject.image || bgImageUrl
    }
  }

  // Determine which background to show
  const showVideo =
    (bgType === "video" && !!backgroundVideoUrl) || (bgType === "latest_project" && !!backgroundVideoUrl)

  console.log("HeroSection: Show video:", showVideo)
  console.log("HeroSection: Video URL:", backgroundVideoUrl)
  console.log("HeroSection: Image URL:", backgroundImageUrl)

  return (
    <section className="relative h-screen flex items-center justify-center text-white overflow-hidden">
      {/* Background */}
      {showVideo ? (
        <VideoBackground videoUrl={backgroundVideoUrl} fallbackImageUrl={backgroundImageUrl} isVisible={true} />
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        >
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 text-center max-w-3xl px-4 md:px-8 animate-fade-in">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif mb-6">{title}</h1>
        <p className="text-lg sm:text-xl md:text-2xl mb-8 max-w-2xl mx-auto opacity-90">{subtitle}</p>
        {buttonText && buttonUrl && (
          <Link
            href={buttonUrl}
            className="inline-block bg-white text-black px-6 py-3 rounded-full font-medium transition-transform hover:scale-105"
          >
            {buttonText}
          </Link>
        )}
      </div>
    </section>
  )
}
