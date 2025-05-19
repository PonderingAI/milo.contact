import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import MediaHostingGuide from "@/components/media-hosting-guide"

export default function MediaHostingPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-24">
        <div className="flex items-center gap-4 mb-12">
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
        </div>

        <h1 className="text-5xl md:text-7xl font-serif mb-8">Media Hosting Guide</h1>
        <p className="text-xl text-gray-300 mb-12 max-w-3xl">
          Find the most cost-effective ways to host your images and videos for your portfolio website.
        </p>

        <MediaHostingGuide />
      </div>
    </main>
  )
}
