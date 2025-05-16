"use client"

import type React from "react"

import { useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface ProjectSearchProps {
  onSearch: (query: string) => void
}

export default function ProjectSearch({ onSearch }: ProjectSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    onSearch(query)
  }

  return (
    <div className="relative w-full max-w-3xl mx-auto mb-8">
      <Input
        type="text"
        placeholder="Search projects by name or tag..."
        value={searchQuery}
        onChange={handleSearch}
        className="bg-gray-900 border-gray-800 pl-10 py-6 text-lg rounded-lg focus:border-white"
      />
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
    </div>
  )
}
