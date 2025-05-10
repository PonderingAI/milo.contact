"use client"

import { useState, useEffect } from "react"
import DependencyItem from "./dependency-item"
import DependencyListHeader from "./dependency-list-header"
import DependencyListFilters from "./dependency-list-filters"
import { Button } from "@/components/ui/button"

interface Dependency {
  id: string
  name: string
  currentVersion: string
  latestVersion: string
  hasUpdate: boolean
  hasVulnerability: boolean
  type: "production" | "development"
}

export default function DependencyList() {
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const response = await fetch("/api/dependencies/list")
        if (response.ok) {
          const data = await response.json()
          setDependencies(data.dependencies || [])
        } else {
          console.error("Failed to fetch dependencies")
        }
      } catch (error) {
        console.error("Error fetching dependencies:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDependencies()
  }, [])

  const filteredDependencies = dependencies.filter((dep) => {
    if (filter === "all") return true
    if (filter === "updates") return dep.hasUpdate
    if (filter === "vulnerabilities") return dep.hasVulnerability
    if (filter === "production") return dep.type === "production"
    if (filter === "development") return dep.type === "development"
    return true
  })

  const handleScanForUpdates = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/dependencies/check-updates", {
        method: "POST",
      })
      if (response.ok) {
        const data = await response.json()
        setDependencies(data.dependencies || [])
      } else {
        console.error("Failed to scan for updates")
      }
    } catch (error) {
      console.error("Error scanning for updates:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Dependencies</h3>
        <Button size="sm" onClick={handleScanForUpdates} disabled={isLoading}>
          {isLoading ? "Scanning..." : "Scan for Updates"}
        </Button>
      </div>

      <DependencyListFilters filter={filter} onFilterChange={setFilter} />

      <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
        <DependencyListHeader />

        <div className="max-h-[250px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading dependencies...</div>
          ) : filteredDependencies.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No dependencies found</div>
          ) : (
            filteredDependencies.map((dependency) => <DependencyItem key={dependency.id} dependency={dependency} />)
          )}
        </div>
      </div>
    </div>
  )
}
