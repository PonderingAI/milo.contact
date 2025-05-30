"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Sparkles, ArrowLeft, Palette, Code, Zap, Camera, Search } from "lucide-react"
import ToolsSearchBar from "@/components/tools-search-bar"
import ToolsTagFilter from "@/components/tools-tag-filter"

const tools = [
  {
    id: "prompt-studio",
    name: "Prompt Studio",
    description: "Organize, rate, and manage your AI image generation prompts with an intuitive interface.",
    icon: Sparkles,
    status: "stable",
    tags: ["AI", "Image Generation", "Prompts"],
  },
  // Add more tools here as they're developed
  {
    id: "color-palette-generator",
    name: "Color Palette Generator",
    description: "Generate beautiful color palettes for your creative projects.",
    icon: Palette,
    status: "coming-soon",
    tags: ["Design", "Colors", "Creative"],
  },
  {
    id: "code-formatter",
    name: "Code Formatter",
    description: "Format and beautify your code with support for multiple languages.",
    icon: Code,
    status: "coming-soon",
    tags: ["Development", "Code", "Productivity"],
  },
  {
    id: "cinema-calculator",
    name: "Cinema Calculator",
    description: "Calculate aspect ratios, frame rates, and other cinema-related measurements.",
    icon: Camera,
    status: "coming-soon",
    tags: ["Cinema", "Film", "Calculations"],
  },
]

export default function ToolsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState("All")

  // Get all unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    tools.forEach((tool) => {
      tool.tags.forEach((tag) => tags.add(tag))
    })
    return Array.from(tags).sort()
  }, [])

  // Filter tools based on search and tag
  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchesSearch =
        searchQuery === "" ||
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesTag = selectedTag === "All" || tool.tags.includes(selectedTag)

      return matchesSearch && matchesTag
    })
  }, [searchQuery, selectedTag])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "stable":
        return "bg-green-900/30 border-green-900/50 text-green-400"
      case "beta":
        return "bg-yellow-900/30 border-yellow-900/50 text-yellow-400"
      case "experimental":
        return "bg-red-900/30 border-red-900/50 text-red-400"
      case "coming-soon":
        return "bg-blue-900/30 border-blue-900/50 text-blue-400"
      default:
        return "bg-teal-900/30 border-teal-900/50 text-teal-400"
    }
  }

  return (
    <div className="min-h-screen bg-black text-neutral-100">
      <header className="border-b border-neutral-800 p-4">
        <div className="container mx-auto flex items-center space-x-4">
          <Link href="/" className="text-neutral-400 hover:text-neutral-100 transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to Portfolio</span>
          </Link>
          <h1 className="font-serif text-2xl">Tools</h1>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {/* Search and Filter Section */}
        <div className="mb-8 space-y-4">
          <ToolsSearchBar
            placeholder="Search tools by name, description, or tags..."
            onSearch={setSearchQuery}
            className="max-w-md"
          />

          <ToolsTagFilter tags={allTags} selectedTag={selectedTag} onChange={setSelectedTag} />
        </div>

        {/* Results Count */}
        {(searchQuery || selectedTag !== "All") && (
          <div className="mb-6">
            <p className="text-neutral-400 text-sm">
              {filteredTools.length} tool{filteredTools.length !== 1 ? "s" : ""} found
              {searchQuery && ` for "${searchQuery}"`}
              {selectedTag !== "All" && ` in "${selectedTag}"`}
            </p>
          </div>
        )}

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden hover:border-neutral-700 transition-colors"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-neutral-800 rounded-md">
                    <tool.icon className="h-6 w-6 text-teal-400" />
                  </div>
                  <div className={`px-2 py-1 border rounded text-xs ${getStatusColor(tool.status)}`}>
                    {tool.status === "coming-soon" ? "Coming Soon" : tool.status}
                  </div>
                </div>
                <h2 className="font-serif text-xl mb-2">{tool.name}</h2>
                <p className="text-neutral-400 mb-4">{tool.description}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {tool.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-neutral-800 text-neutral-400 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                {tool.status === "coming-soon" ? (
                  <div className="block w-full py-2 text-center bg-neutral-800 text-neutral-500 rounded cursor-not-allowed">
                    Coming Soon
                  </div>
                ) : (
                  <Link
                    href={`/tools/${tool.id}`}
                    className="block w-full py-2 text-center bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded transition-colors"
                  >
                    Launch Tool
                  </Link>
                )}
              </div>
            </div>
          ))}

          {/* Add New Tool Card - Only show for developers */}
          <div className="bg-neutral-900 border border-dashed border-neutral-800 rounded-lg overflow-hidden hover:border-neutral-700 transition-colors">
            <div className="p-6 flex flex-col items-center justify-center h-full text-center">
              <div className="p-4 mb-4 rounded-full bg-neutral-800">
                <Zap className="h-8 w-8 text-neutral-500" />
              </div>
              <h2 className="font-serif text-xl mb-2">More Tools Coming</h2>
              <p className="text-neutral-400 mb-6">New tools are being developed regularly. Check back soon!</p>
              <Link
                href="/docs/TOOLS-DEVELOPMENT.md"
                className="block w-full py-2 text-center bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded transition-colors"
              >
                Developer Docs
              </Link>
            </div>
          </div>
        </div>

        {/* No Results */}
        {filteredTools.length === 0 && (
          <div className="text-center py-12">
            <div className="p-4 mb-4 rounded-full bg-neutral-800 inline-block">
              <Search className="h-8 w-8 text-neutral-500" />
            </div>
            <h3 className="font-serif text-xl mb-2">No tools found</h3>
            <p className="text-neutral-400 mb-4">Try adjusting your search or filter criteria.</p>
            <button
              onClick={() => {
                setSearchQuery("")
                setSelectedTag("All")
              }}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
