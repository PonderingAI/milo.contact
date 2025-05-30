"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface ProjectSearchBarProps {
  placeholder?: string
  className?: string
  onSearch?: (query: string) => void
  initialQuery?: string
  redirectToResults?: boolean
}

export default function ProjectSearchBar({
  placeholder = "Search projects...",
  className = "",
  onSearch,
  initialQuery = "",
  redirectToResults = true,
}: ProjectSearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(initialQuery || searchParams?.get("q") || "")

  useEffect(() => {
    // Update query if searchParams changes
    const searchQuery = searchParams?.get("q")
    if (searchQuery && searchQuery !== query) {
      setQuery(searchQuery)
    }
  }, [searchParams, query])

  const handleSearch = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    if (onSearch) {
      onSearch(query)
    }

    if (redirectToResults) {
      router.push(`/projects/search?q=${encodeURIComponent(query)}`)
    }
  }

  const clearSearch = () => {
    setQuery("")
    if (onSearch) {
      onSearch("")
    }
  }

  return (
    <form onSubmit={handleSearch} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10 bg-black/20 border-gray-800 focus:border-gray-700 text-gray-200"
        />
        {query && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Button type="submit" className="sr-only">
        Search
      </Button>
    </form>
  )
}
