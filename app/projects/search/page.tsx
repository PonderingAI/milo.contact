import { Suspense } from "react"
import type { Metadata } from "next"
import { getProjects } from "@/lib/project-data-server"
import ProjectSearchBar from "@/components/project-search-bar"
import { OffsetProjectGrid } from "@/components/offset-project-grid"
import { Loader2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Search Projects | Milo Presedo",
  description: "Search through Milo Presedo's film and photography projects",
}

interface SearchPageProps {
  searchParams: { q?: string }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q || ""

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Search Results</h1>

      <div className="max-w-xl mx-auto mb-8">
        <ProjectSearchBar initialQuery={query} />
      </div>

      <Suspense fallback={<SearchLoading />}>
        <SearchResults query={query} />
      </Suspense>
    </main>
  )
}

function SearchLoading() {
  return (
    <div className="flex justify-center items-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  )
}

async function SearchResults({ query }: { query: string }) {
  if (!query.trim()) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Enter a search term to find projects</p>
      </div>
    )
  }

  const allProjects = await getProjects()

  // Search in title, description, category, role, and tags
  const searchResults = allProjects.filter((project) => {
    const searchableText = [project.title, project.description, project.category, project.role, ...(project.tags || [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    return searchableText.includes(query.toLowerCase())
  })

  if (searchResults.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No projects found matching &quot;{query}&quot;</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-gray-400 mb-6">
        Found {searchResults.length} projects matching &quot;{query}&quot;
      </p>
      <OffsetProjectGrid projects={searchResults} />
    </div>
  )
}
