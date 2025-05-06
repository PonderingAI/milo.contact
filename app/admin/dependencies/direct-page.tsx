"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import AdminCheck from "@/components/admin/admin-check"

interface Dependency {
  name: string
  currentVersion: string
  updateMode: "manual" | "auto" | "conservative" | "global"
  locked: boolean
  lockedVersion: string | null
  isDev: boolean
}

export default function DirectDependenciesPage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "dev" | "prod" | "locked">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [globalMode, setGlobalMode] = useState<"manual" | "auto" | "conservative" | "global">("global")

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in?redirect_url=/admin/dependencies")
    }
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    if (isSignedIn) {
      fetchDependencies()
    }
  }, [isSignedIn])

  const fetchDependencies = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/dependencies/direct")
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch dependencies")
      }

      const data = await response.json()
      setDependencies(data.dependencies || [])
      setGlobalMode(data.globalMode || "global")
    } catch (err) {
      console.error("Error fetching dependencies:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const updatePreferences = async (
    name: string,
    preferences: {
      updateMode?: "manual" | "auto" | "conservative" | "global"
      locked?: boolean
      lockedVersion?: string
    },
  ) => {
    try {
      setError(null)

      const response = await fetch("/api/dependencies/direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          ...preferences,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update preferences")
      }

      // Update local state
      setDependencies((prev) => prev.map((dep) => (dep.name === name ? { ...dep, ...preferences } : dep)))
    } catch (err) {
      console.error("Error updating preferences:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    }
  }

  const filteredDependencies = dependencies
    .filter((dep) => {
      if (filter === "dev") return dep.isDev
      if (filter === "prod") return !dep.isDev
      if (filter === "locked") return dep.locked
      return true
    })
    .filter((dep) => searchTerm === "" || dep.name.toLowerCase().includes(searchTerm.toLowerCase()))

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <AdminCheck>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Dependency Management</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}

        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold mb-4">Dependency Management</h2>
          <p className="mb-4">View and manage your project dependencies directly from your package.json file.</p>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <button
              onClick={fetchDependencies}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Refreshing..." : "Refresh Dependencies"}
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label htmlFor="filter" className="block text-sm font-medium mb-1">
                Filter
              </label>
              <select
                id="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full p-2 bg-gray-700 rounded"
              >
                <option value="all">All Dependencies</option>
                <option value="prod">Production Dependencies</option>
                <option value="dev">Dev Dependencies</option>
                <option value="locked">Locked Dependencies</option>
              </select>
            </div>

            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium mb-1">
                Search
              </label>
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search dependencies..."
                className="w-full p-2 bg-gray-700 rounded"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Package
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Current Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Update Mode
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Lock Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      </div>
                      <p className="mt-2">Loading dependencies...</p>
                    </td>
                  </tr>
                ) : dependencies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      No dependencies found in your package.json.
                    </td>
                  </tr>
                ) : filteredDependencies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      No dependencies match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredDependencies.map((dep) => (
                    <tr key={dep.name}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{dep.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{dep.currentVersion}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs ${dep.isDev ? "bg-gray-600" : "bg-blue-600"}`}>
                          {dep.isDev ? "DevDependency" : "Dependency"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={dep.updateMode}
                          onChange={(e) =>
                            updatePreferences(dep.name, {
                              updateMode: e.target.value as "manual" | "auto" | "conservative" | "global",
                            })
                          }
                          className="bg-gray-700 rounded p-1"
                          disabled={dep.locked}
                        >
                          <option value="global">Global</option>
                          <option value="manual">Manual</option>
                          <option value="auto">Automatic</option>
                          <option value="conservative">Conservative</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={dep.locked}
                            onChange={(e) => updatePreferences(dep.name, { locked: e.target.checked })}
                            className="mr-2"
                          />
                          {dep.locked && (
                            <input
                              type="text"
                              value={dep.lockedVersion || dep.currentVersion}
                              onChange={(e) => updatePreferences(dep.name, { lockedVersion: e.target.value })}
                              className="bg-gray-700 rounded p-1 w-24"
                              placeholder="Version"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminCheck>
  )
}
