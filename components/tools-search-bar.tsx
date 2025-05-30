"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface ToolsSearchBarProps {
  placeholder?: string
  className?: string
  onSearch?: (query: string) => void
  initialQuery?: string
}

export default function ToolsSearchBar({
  placeholder = "Search tools...",
  className = "",
  onSearch,
  initialQuery = "",
}: ToolsSearchBarProps) {
  const [query, setQuery] = useState(initialQuery)

  useEffect(() => {
    if (onSearch) {
      onSearch(query)
    }
  }, [query, onSearch])

  const handleSearch = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
  }

  const clearSearch = () => {
    setQuery("")
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
