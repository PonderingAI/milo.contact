"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import AdminCheck from "@/components/admin/admin-check"
import DependencyTableSetupGuide from "@/components/admin/dependency-table-setup-guide"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Dependency {
  id: number
  name: string
  current_version: string
  latest_version: string | null
  locked: boolean
  locked_version: string | null
  update_mode: "manual" | "auto" | "conservative" | "global"
  last_checked: string
  last_updated: string
  has_security_update: boolean
}

export default function ClientDependenciesPage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tablesMissing, setTablesMissing] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<Record<number, { loading: boolean; error: string | null }>>({})
  const [filter, setFilter] = useState<"all" | "outdated" | "locked">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [newDependency, setNewDependency] = useState({
    name: "",
    current_version: "",
    latest_version: "",
    update_mode: "global" as const,
  })
  const [dialogOpen, setDialogOpen] = useState(false)

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
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/dependencies")

      if (!response.ok) {
        const errorData = await response.json()

        if (response.status === 404 && errorData.tablesMissing) {
          setTablesMissing(true)
          setDependencies([])
          return
        }

        throw new Error(errorData.error || "Failed to fetch dependencies")
      }

      const data = await response.json()
      setDependencies(data.dependencies || [])
      setTablesMissing(false)
    } catch (err) {
      console.error("Error fetching dependencies:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const addDependency = async () => {
    if (!newDependency.name || !newDependency.current_version) {
      setError("Name and current version are required")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/dependencies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newDependency.name,
          current_version: newDependency.current_version,
          latest_version: newDependency.latest_version || newDependency.current_version,
          update_mode: newDependency.update_mode,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add dependency")
      }

      // Reset form and close dialog
      setNewDependency({
        name: "",
        current_version: "",
        latest_version: "",
        update_mode: "global",
      })
      setDialogOpen(false)

      // Refresh dependencies
      await fetchDependencies()
    } catch (err) {
      console.error("Error adding dependency:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
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
      update_mode?: "manual" | "auto" | "conservative" | "global"
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

  const filteredDependencies = dependencies
    .filter((dep) => {
      if (filter === "outdated") {
        return dep.latest_version && dep.current_version !== dep.latest_version
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

        {tablesMissing ? (
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

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700">Add Dependency</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Dependency</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="name"
                          value={newDependency.name}
                          onChange={(e) => setNewDependency({ ...newDependency, name: e.target.value })}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="current_version" className="text-right">
                          Current Version
                        </Label>
                        <Input
                          id="current_version"
                          value={newDependency.current_version}
                          onChange={(e) => setNewDependency({ ...newDependency, current_version: e.target.value })}
                          className="col-span-3"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="latest_version" className="text-right">
                          Latest Version
                        </Label>
                        <Input
                          id="latest_version"
                          value={newDependency.latest_version}
                          onChange={(e) => setNewDependency({ ...newDependency, latest_version: e.target.value })}
                          className="col-span-3"
                          placeholder="Optional (defaults to current version)"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="update_mode" className="text-right">
                          Update Mode
                        </Label>
                        <Select
                          value={newDependency.update_mode}
                          onValueChange={(value) =>
                            setNewDependency({
                              ...newDependency,
                              update_mode: value as "manual" | "auto" | "conservative" | "global",
                            })
                          }
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select update mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="global">Global (Default)</SelectItem>
                            <SelectItem value="manual">Manual</SelectItem>
                            <SelectItem value="auto">Automatic</SelectItem>
                            <SelectItem value="conservative">Conservative</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={addDependency} disabled={loading}>
                        {loading ? "Adding..." : "Add Dependency"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
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
                    {loading && dependencies.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center">
                          Loading dependencies...
                        </td>
                      </tr>
                    ) : dependencies.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center">
                          No dependencies found. Use the "Add Dependency" button to add your first dependency.
                        </td>
                      </tr>
                    ) : filteredDependencies.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center">
                          No dependencies match your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredDependencies.map((dep) => (
                        <tr key={dep.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium">{dep.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{dep.current_version}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {dep.latest_version ? (
                              <span
                                className={
                                  dep.current_version === dep.latest_version
                                    ? "text-green-500"
                                    : dep.has_security_update
                                      ? "text-red-500"
                                      : "text-yellow-500"
                                }
                              >
                                {dep.latest_version}
                                {dep.has_security_update && (
                                  <span className="ml-2 text-xs bg-red-600 text-white px-2 py-1 rounded">Security</span>
                                )}
                              </span>
                            ) : (
                              <span className="text-gray-400">Unknown</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={dep.update_mode}
                              onChange={(e) =>
                                updateSettings(dep.id, {
                                  update_mode: e.target.value as "manual" | "auto" | "conservative" | "global",
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
                                onChange={(e) => updateSettings(dep.id, { locked: e.target.checked })}
                                className="mr-2"
                              />
                              {dep.locked && (
                                <input
                                  type="text"
                                  value={dep.locked_version || dep.current_version}
                                  onChange={(e) => updateSettings(dep.id, { locked_version: e.target.value })}
                                  className="bg-gray-700 rounded p-1 w-24"
                                  placeholder="Version"
                                />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {dep.latest_version && dep.current_version !== dep.latest_version && !dep.locked && (
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
