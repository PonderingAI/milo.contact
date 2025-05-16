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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    onSearch(query)
  }

  return (
    <div className="relative mb-8">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Search projects by title, category, or role..."
          value={searchQuery}
          onChange={handleChange}
          className="pl-10 bg-gray-900/50 border-gray-800 focus:border-gray-700"
        />
      </div>
    </div>
  )
}
