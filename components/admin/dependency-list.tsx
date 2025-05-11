"use client"

import { useState } from "react"
import { Package, Search, AlertTriangle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// Mock data for dependencies
const mockDependencies = [
  {
    id: "1",
    name: "react",
    currentVersion: "18.2.0",
    latestVersion: "18.2.0",
    type: "production",
    hasVulnerability: false,
  },
  {
    id: "2",
    name: "next",
    currentVersion: "13.4.12",
    latestVersion: "14.0.0",
    type: "production",
    hasVulnerability: false,
  },
  {
    id: "3",
    name: "lodash",
    currentVersion: "4.17.20",
    latestVersion: "4.17.21",
    type: "production",
    hasVulnerability: true,
  },
  {
    id: "4",
    name: "tailwindcss",
    currentVersion: "3.3.0",
    latestVersion: "3.3.3",
    type: "development",
    hasVulnerability: false,
  },
]

export default function DependencyList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState("all")

  // Filter dependencies based on search term and filter
  const filteredDependencies = mockDependencies.filter((dep) => {
    const matchesSearch = dep.name.toLowerCase().includes(searchTerm.toLowerCase())

    if (filter === "all") return matchesSearch
    if (filter === "outdated") return matchesSearch && dep.currentVersion !== dep.latestVersion
    if (filter === "vulnerable") return matchesSearch && dep.hasVulnerability
    if (filter === "production") return matchesSearch && dep.type === "production"
    if (filter === "development") return matchesSearch && dep.type === "development"

    return matchesSearch
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search dependencies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
          All
        </Button>
        <Button variant={filter === "outdated" ? "default" : "outline"} size="sm" onClick={() => setFilter("outdated")}>
          Outdated
        </Button>
        <Button
          variant={filter === "vulnerable" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("vulnerable")}
        >
          Vulnerable
        </Button>
        <Button
          variant={filter === "production" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("production")}
        >
          Production
        </Button>
        <Button
          variant={filter === "development" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("development")}
        >
          Development
        </Button>
      </div>

      <div className="border rounded-md divide-y">
        {filteredDependencies.map((dep) => (
          <div key={dep.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
            <div className="flex items-center">
              <Package className="h-4 w-4 mr-2 text-gray-500" />
              <div>
                <div className="font-medium">{dep.name}</div>
                <div className="text-sm text-gray-500">
                  {dep.currentVersion}
                  {dep.currentVersion !== dep.latestVersion && (
                    <span className="text-amber-600"> → {dep.latestVersion}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {dep.hasVulnerability && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Vulnerable
                </Badge>
              )}

              {dep.currentVersion !== dep.latestVersion && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  Outdated
                </Badge>
              )}

              <Badge
                variant="outline"
                className={
                  dep.type === "production"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-purple-50 text-purple-700 border-purple-200"
                }
              >
                {dep.type === "production" ? "Prod" : "Dev"}
              </Badge>
            </div>
          </div>
        ))}

        {filteredDependencies.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No dependencies found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}
