import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function ProjectNotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
      <h1 className="text-4xl md:text-6xl font-serif mb-6">Project Not Found</h1>
      <p className="text-xl text-gray-400 mb-8 text-center">
        The project you're looking for doesn't exist or has been removed.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/projects"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Projects
        </Link>
        <Link
          href="/"
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-black hover:bg-gray-200 rounded-md transition-colors"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  )
}
