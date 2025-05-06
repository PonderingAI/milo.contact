"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, RefreshCw } from "lucide-react"

interface Dependency {
  name: string
  currentVersion: string
  latestVersion?: string
  needsUpdate?: boolean
  type: "production" | "development"
  updateMode: "manual" | "auto" | "conservative" | "global"
  locked: boolean
  lockedVersion?: string
}

export default function DependenciesClientPage() {
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [globalMode, setGlobalMode] = useState<"manual" | "auto" | "conservative">("manual")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<"all" | "production" | "development" | "updates">("all")

  // Fetch dependencies
  const fetchDependencies = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/dependencies")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch dependencies")
      }

      const data = await response.json()
      setDependencies(data.dependencies || [])
      setGlobalMode(data.globalMode || "manual")
    } catch (err) {
      console.error("Error fetching dependencies:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Update preferences
  const updatePreferences = async (packageName: string, prefs: any) => {
    try {
      const response = await fetch("/api/dependencies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageName,
          ...prefs,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update preferences")
      }

      // Update local state
      if (prefs.updateMode) {
        setDependencies((prev) =>
          prev.map((dep) => (dep.name === packageName ? { ...dep, updateMode: prefs.updateMode } : dep)),
        )
      }

      if (prefs.locked !== undefined) {
        setDependencies((prev) =>
          prev.map((dep) => (dep.name === packageName ? { ...dep, locked: prefs.locked } : dep)),
        )
      }

      if (prefs.lockedVersion) {
        setDependencies((prev) =>
          prev.map((dep) => (dep.name === packageName ? { ...dep, lockedVersion: prefs.lockedVersion } : dep)),
        )
      }
    } catch (err) {
      console.error("Error updating preferences:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    }
  }

  // Update global mode
  const updateGlobalMode = async (mode: "manual" | "auto" | "conservative") => {
    try {
      const response = await fetch("/api/dependencies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          globalMode: mode,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update global mode")
      }

      setGlobalMode(mode)
    } catch (err) {
      console.error("Error updating global mode:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    }
  }

  // Refresh dependencies
  const refreshDependencies = async () => {
    setRefreshing(true)
    await fetchDependencies()
    setRefreshing(false)
  }

  // Filter dependencies
  const filteredDependencies = dependencies.filter((dep) => {
    if (filter === "production") return dep.type === "production"
    if (filter === "development") return dep.type === "development"
    if (filter === "updates") return dep.needsUpdate
    return true
  })

  useEffect(() => {
    fetchDependencies()
  }, [])

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dependency Management</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </p>
        </div>
      )}

      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Project Dependencies</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshDependencies}
            disabled={refreshing || loading}
            className="flex items-center gap-2"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="flex-1">
            <h3 className="font-medium mb-2">Global Update Mode</h3>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-sm mb-2">
                This setting applies to all dependencies that use the "global" update mode.
              </p>
              <select
                value={globalMode}
                onChange={(e) => updateGlobalMode(e.target.value as any)}
                className="w-full p-2 bg-gray-600 rounded"
              >
                <option value="manual">Manual (Never update automatically)</option>
                <option value="conservative">Conservative (Security updates only)</option>
                <option value="auto">Automatic (All updates)</option>
              </select>
            </div>
          </div>

          <div className="flex-1">
            <h3 className="font-medium mb-2">Filter Dependencies</h3>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-sm mb-2">Filter the dependencies list:</p>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full p-2 bg-gray-600 rounded"
              >
                <option value="all">All Dependencies</option>
                <option value="production">Production Only</option>
                <option value="development">Development Only</option>
                <option value="updates">Needs Updates</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/4">
                  Package Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Current Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Latest Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider w-1/6">
                  Update Mode
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Lock Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <div className="flex justify-center">
                      <RefreshCw size={24} className="animate-spin" />
                    </div>
                    <p className="mt-2">Loading dependencies...</p>
                  </td>
                </tr>
              ) : dependencies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <p>No dependencies found in package.json</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Add dependencies to your package.json file to manage them here.
                    </p>
                  </td>
                </tr>
              ) : filteredDependencies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center">
                    <p>No dependencies match the current filter</p>
                    <Button variant="link" onClick={() => setFilter("all")} className="text-blue-400">
                      View all dependencies
                    </Button>
                  </td>
                </tr>
              ) : (
                filteredDependencies.map((dep) => (
                  <tr key={dep.name} className="hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="font-medium">{dep.name}</div>
                    </td>
                    <td className="px-6 py-4">{dep.currentVersion}</td>
                    <td className="px-6 py-4">
                      {dep.needsUpdate ? (
                        <Badge className="bg-amber-600">{dep.latestVersion}</Badge>
                      ) : (
                        <Badge className="bg-green-600">Up to date</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={dep.type === "production" ? "bg-blue-900" : "bg-gray-700"}>
                        {dep.type === "production" ? "Production" : "Development"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={dep.updateMode}
                        onChange={(e) => updatePreferences(dep.name, { updateMode: e.target.value })}
                        className="w-full p-1 bg-gray-700 rounded text-sm"
                        disabled={dep.locked}
                      >
                        <option value="global">Global</option>
                        <option value="manual">Manual</option>
                        <option value="conservative">Conservative</option>
                        <option value="auto">Automatic</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={dep.locked}
                          onChange={(e) => updatePreferences(dep.name, { locked: e.target.checked })}
                          className="mr-2"
                        />
                        <span className="text-sm">{dep.locked ? "Locked" : "Unlocked"}</span>
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
  )
}
