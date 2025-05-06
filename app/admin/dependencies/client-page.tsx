"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import AdminCheck from "@/components/admin/admin-check"
import DependencyTableSetupGuide from "@/components/admin/dependency-table-setup-guide"
import { Button } from "@/components/ui/button"

interface Dependency {
  id: number
  name: string
  currentVersion: string
  latestVersion: string | null
  outdated: boolean
  locked: boolean
  description: string
  hasSecurityIssue: boolean
  securityDetails: any
  updateMode: "manual" | "auto" | "conservative" | "global"
  isDev: boolean
}

export default function ClientDependenciesPage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tableExists, setTableExists] = useState(true)
  const [updateStatus, setUpdateStatus] = useState<Record<number, { loading: boolean; error: string | null }>>({})
  const [filter, setFilter] = useState<"all" | "outdated" | "locked">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [securityStats, setSecurityStats] = useState({
    vulnerabilities: 0,
    outdatedPackages: 0,
    securityScore: 100,
    lastScan: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString(),
  })
  const [globalUpdateMode, setGlobalUpdateMode] = useState<"manual" | "auto" | "conservative">("conservative")

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

      const response = await fetch("/api/dependencies")
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch dependencies")
      }

      const data = await response.json()

      // Check if we got a message about missing tables
      if (data.message && data.message.includes("not found")) {
        setError("Dependencies table not set up yet. Please set up the dependencies table first.")
        setDependencies([])
        return
      }

      // Map the data to our internal format
      const mappedDependencies = (data.dependencies || []).map((dep: any) => ({
        id: dep.id || dep.name,
        name: dep.name,
        currentVersion: dep.currentVersion || dep.current_version,
        latestVersion: dep.latestVersion || dep.latest_version,
        outdated: dep.outdated || (dep.currentVersion !== dep.latestVersion && dep.latestVersion),
        locked: dep.locked || false,
        description: dep.description || "",
        hasSecurityIssue: dep.hasSecurityIssue || dep.has_security_issue || false,
        securityDetails: dep.securityDetails || dep.security_details,
        updateMode: dep.updateMode || "global",
        isDev: dep.isDev || dep.is_dev || false,
      }))

      setDependencies(mappedDependencies)

      // Update security stats
      setSecurityStats({
        vulnerabilities: data.vulnerabilities || mappedDependencies.filter((d) => d.hasSecurityIssue).length,
        outdatedPackages: data.outdatedPackages || mappedDependencies.filter((d) => d.outdated).length,
        securityScore: data.securityScore || calculateSecurityScore(mappedDependencies),
        lastScan: data.lastScan || new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString(),
      })

      // Get global update mode - default to conservative (security only)
      setGlobalUpdateMode(data.updateMode || "conservative")
    } catch (err: any) {
      setError(`Error fetching dependencies: ${err.message}`)
      console.error("Error fetching dependencies:", err)

      // Set empty dependencies to avoid UI errors
      setDependencies([])
    } finally {
      setLoading(false)
    }
  }

  const setupDependencies = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/setup-dependencies", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to set up dependencies")
      }

      const data = await response.json()

      // Show success message
      setError(`Dependencies set up successfully! ${data.dependenciesCount} dependencies added.`)

      // Fetch dependencies after setup
      fetchDependencies()
    } catch (err: any) {
      setError(`Error setting up dependencies: ${err.message}`)
      console.error("Error setting up dependencies:", err)
    } finally {
      setLoading(false)
    }
  }

  const updateDependency = async (id: number, toVersion?: string) => {
    setUpdateStatus((prev) => ({
      ...prev,
      [id]: { loading: true, error: null },
    }))

    try {
      const response = await fetch("/api/dependencies/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, toVersion }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update dependency")
      }

      // Refresh dependencies
      await fetchDependencies()

      setUpdateStatus((prev) => ({
        ...prev,
        [id]: { loading: false, error: null },
      }))
    } catch (err) {
      console.error("Error updating dependency:", err)

      setUpdateStatus((prev) => ({
        ...prev,
        [id]: {
          loading: false,
          error: err instanceof Error ? err.message : "An unexpected error occurred",
        },
      }))
    }
  }

  const updateSettings = async (
    id: number,
    settings: {
      locked?: boolean
      locked_version?: string
      update_mode?: "manual" | "auto" | "conservative"
    },
  ) => {
    try {
      const response = await fetch("/api/dependencies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, ...settings }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update settings")
      }

      // Update local state
      setDependencies((prev) => prev.map((dep) => (dep.id === id ? { ...dep, ...settings } : dep)))
    } catch (err) {
      console.error("Error updating settings:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    }
  }

  const runAutoUpdates = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/dependencies/auto-update")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to run auto updates")
      }

      // Refresh dependencies
      await fetchDependencies()
    } catch (err) {
      console.error("Error running auto updates:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const calculateSecurityScore = (deps: Dependency[]) => {
    if (!deps || deps.length === 0) return 100

    const totalDependencies = deps.length
    const securityIssues = deps.filter((dep) => dep.hasSecurityIssue).length
    const outdated = deps.filter((dep) => dep.outdated).length

    // Penalize for security issues and outdated packages
    let score = 100
    score -= securityIssues * (100 / totalDependencies) * 0.75 // Security issues are weighted more
    score -= outdated * (100 / totalDependencies) * 0.25

    return Math.max(0, Math.min(100, score)) // Ensure score is within 0-100 range
  }

  const filteredDependencies = dependencies
    .filter((dep) => {
      if (filter === "outdated") {
        return dep.latestVersion && dep.currentVersion !== dep.latestVersion
      }
      if (filter === "locked") {
        return dep.locked
      }
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

        {!tableExists ? (
          <DependencyTableSetupGuide onSetupComplete={fetchDependencies} />
        ) : (
          <>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p>{error}</p>
              </div>
            )}

            <div className="bg-gray-800 p-6 rounded-lg mb-8">
              <h2 className="text-xl font-bold mb-4">Dependency Management</h2>
              <p className="mb-4">
                Manage your project dependencies, set update preferences, and keep your project up-to-date.
              </p>

              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <button
                  onClick={fetchDependencies}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Refreshing..." : "Refresh Dependencies"}
                </button>

                <button
                  onClick={runAutoUpdates}
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  Run Auto Updates
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
                    <option value="outdated">Outdated</option>
                    <option value="locked">Locked</option>
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
                        Latest Version
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Update Mode
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Lock Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                        <p className="mt-4">Loading dependencies...</p>
                      </div>
                    ) : dependencies.length === 0 ? (
                      <div className="text-center py-8">
                        <p>
                          No dependencies found. This could be because the dependencies table hasn't been set up yet.
                        </p>
                        <div className="flex justify-center gap-2 mt-4">
                          <Button onClick={setupDependencies}>Set Up Dependencies</Button>
                          <Button variant="outline" onClick={fetchDependencies} className="border-gray-700">
                            Retry
                          </Button>
                        </div>
                      </div>
                    ) : filteredDependencies.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center">
                          No dependencies found.
                        </td>
                      </tr>
                    ) : (
                      filteredDependencies.map((dep) => (
                        <tr key={dep.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium">{dep.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{dep.currentVersion}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {dep.latestVersion ? (
                              <span
                                className={
                                  dep.currentVersion === dep.latestVersion
                                    ? "text-green-500"
                                    : dep.hasSecurityIssue
                                      ? "text-red-500"
                                      : "text-yellow-500"
                                }
                              >
                                {dep.latestVersion}
                                {dep.hasSecurityIssue && (
                                  <span className="ml-2 text-xs bg-red-600 text-white px-2 py-1 rounded">Security</span>
                                )}
                              </span>
                            ) : (
                              <span className="text-gray-400">Unknown</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={dep.updateMode}
                              onChange={(e) =>
                                updateSettings(dep.id, {
                                  update_mode: e.target.value as "manual" | "auto" | "conservative",
                                })
                              }
                              className="bg-gray-700 rounded p-1"
                              disabled={dep.locked}
                            >
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
                                onChange={(e) => updateSettings(dep.id, { locked: e.target.checked })}
                                className="mr-2"
                              />
                              {dep.locked && (
                                <input
                                  type="text"
                                  value={dep.locked_version || dep.currentVersion}
                                  onChange={(e) => updateSettings(dep.id, { locked_version: e.target.value })}
                                  className="bg-gray-700 rounded p-1 w-24"
                                  placeholder="Version"
                                />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {dep.latestVersion && dep.currentVersion !== dep.latestVersion && !dep.locked && (
                              <button
                                onClick={() => updateDependency(dep.id)}
                                disabled={updateStatus[dep.id]?.loading}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mr-2"
                              >
                                {updateStatus[dep.id]?.loading ? "Updating..." : "Update"}
                              </button>
                            )}
                            {updateStatus[dep.id]?.error && (
                              <div className="text-red-500 text-xs mt-1">{updateStatus[dep.id].error}</div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminCheck>
  )
}
