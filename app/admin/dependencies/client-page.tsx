"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import AdminCheck from "@/components/admin/admin-check"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase-browser"
import { AlertCircle, CheckCircle, AlertTriangle, Package, Shield, RefreshCw } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface Dependency {
  id?: number
  name: string
  current_version: string
  latest_version: string | null
  description?: string
  required_version?: string
  from?: string
  resolved?: string | null
  has_security_update?: boolean
  update_mode?: "manual" | "auto" | "conservative" | "global"
  is_dev?: boolean
  outdated?: boolean
  locked?: boolean
  last_checked?: string
  last_updated?: string
}

interface UpdateResult {
  name: string
  success: boolean
  from?: string
  to?: string
  error?: string
}

export default function ClientDependenciesPage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [securityScore, setSecurityScore] = useState(100)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updateStatus, setUpdateStatus] = useState<Record<string, { loading: boolean; error: string | null }>>({})
  const [filter, setFilter] = useState<"all" | "outdated" | "vulnerable" | "dev" | "prod">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [showSetupSQL, setShowSetupSQL] = useState(false)
  const [sqlExecuting, setSqlExecuting] = useState(false)
  const [sqlSuccess, setSqlSuccess] = useState(false)
  const [tablesExist, setTablesExist] = useState(false)
  const [lastScan, setLastScan] = useState<string | null>(null)
  const [vulnerabilityCount, setVulnerabilityCount] = useState(0)
  const [outdatedCount, setOutdatedCount] = useState(0)
  const [activeTab, setActiveTab] = useState("dependencies")
  const [updateResults, setUpdateResults] = useState<UpdateResult[]>([])
  const [updateHistory, setUpdateHistory] = useState<UpdateResult[]>([])
  const [globalUpdateMode, setGlobalUpdateMode] = useState<"manual" | "auto" | "conservative">("conservative")
  const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(false)
  const [updateSchedule, setUpdateSchedule] = useState("daily")

  const supabase = createClient()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in?redirect_url=/admin/dependencies")
    }
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    if (isSignedIn) {
      checkTablesExist()
      fetchDependencies()
    }
  }, [isSignedIn])

  // Set up polling for updates
  useEffect(() => {
    if (!isSignedIn) return

    const intervalId = setInterval(
      () => {
        if (autoUpdateEnabled) {
          checkForUpdates()
        }
      },
      60 * 60 * 1000,
    ) // Check every hour

    return () => clearInterval(intervalId)
  }, [isSignedIn, autoUpdateEnabled])

  const checkTablesExist = async () => {
    try {
      const { data: exists, error } = await supabase.rpc("check_table_exists", {
        table_name: "dependencies",
      })

      if (error) {
        console.error("Error checking if table exists:", error)
        return
      }

      setTablesExist(exists)
    } catch (err) {
      console.error("Error checking if tables exist:", err)
    }
  }

  const fetchDependencies = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/dependencies")

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch dependencies")
      }

      const data = await response.json()

      if (data.dependencies) {
        setDependencies(data.dependencies)
      }

      if (data.securityScore !== undefined) {
        setSecurityScore(data.securityScore)
      }

      if (data.lastScan) {
        setLastScan(data.lastScan)
      }

      if (data.vulnerabilities !== undefined) {
        setVulnerabilityCount(data.vulnerabilities)
      }

      if (data.outdatedPackages !== undefined) {
        setOutdatedCount(data.outdatedPackages)
      }

      setTablesExist(data.tableExists)

      // Get settings if available
      if (data.settings) {
        setGlobalUpdateMode(data.settings.update_mode || "conservative")
        setAutoUpdateEnabled(data.settings.auto_update_enabled || false)
        setUpdateSchedule(data.settings.update_schedule || "daily")
      }
    } catch (err) {
      console.error("Error fetching dependencies:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const checkForUpdates = async () => {
    try {
      const response = await fetch("/api/dependencies/scheduled-update")

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error checking for updates:", errorData)
        return
      }

      const data = await response.json()

      if (data.updated > 0) {
        // Add to update history
        if (data.results) {
          setUpdateHistory((prev) => [...data.results, ...prev].slice(0, 20))
        }

        // Refresh dependencies
        fetchDependencies()
      }
    } catch (err) {
      console.error("Error checking for updates:", err)
    }
  }

  const updateDependency = async (name: string) => {
    setUpdateStatus((prev) => ({
      ...prev,
      [name]: { loading: true, error: null },
    }))

    try {
      const response = await fetch("/api/dependencies/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update dependency")
      }

      const data = await response.json()

      // Add to update history
      if (data.success) {
        const dep = dependencies.find((d) => d.name === name)
        if (dep) {
          const updateResult = {
            name,
            success: true,
            from: dep.current_version,
            to: dep.latest_version,
          }
          setUpdateHistory((prev) => [updateResult, ...prev].slice(0, 20))
        }
      }

      // Refresh dependencies
      await fetchDependencies()

      setUpdateStatus((prev) => ({
        ...prev,
        [name]: { loading: false, error: null },
      }))
    } catch (err) {
      console.error("Error updating dependency:", err)

      setUpdateStatus((prev) => ({
        ...prev,
        [name]: {
          loading: false,
          error: err instanceof Error ? err.message : "An unexpected error occurred",
        },
      }))
    }
  }

  const updateSettings = async (name: string, settings: { update_mode?: string; locked?: boolean }) => {
    if (!tablesExist) {
      setError("Database tables not set up. Please set up the tables first.")
      setShowSetupSQL(true)
      return
    }

    try {
      // Check if the dependency already exists in the database
      const { data: existingDep, error: fetchError } = await supabase
        .from("dependencies")
        .select("id")
        .eq("name", name)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        throw new Error(fetchError.message)
      }

      if (existingDep) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("dependencies")
          .update({
            ...settings,
            updated_at: new Date().toISOString(),
          })
          .eq("name", name)

        if (updateError) {
          throw new Error(updateError.message)
        }
      } else {
        // Insert new record
        const dep = dependencies.find((d) => d.name === name)
        if (!dep) {
          throw new Error("Dependency not found")
        }

        const { error: insertError } = await supabase.from("dependencies").insert({
          name,
          current_version: dep.current_version,
          latest_version: dep.latest_version,
          has_security_update: dep.has_security_update,
          ...settings,
        })

        if (insertError) {
          throw new Error(insertError.message)
        }
      }

      // Update local state
      setDependencies((prev) => prev.map((dep) => (dep.name === name ? { ...dep, ...settings } : dep)))
    } catch (err) {
      console.error("Error updating settings:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    }
  }

  const updateGlobalSettings = async (settings: {
    update_mode?: string
    auto_update_enabled?: boolean
    update_schedule?: string
  }) => {
    if (!tablesExist) {
      setError("Database tables not set up. Please set up the tables first.")
      setShowSetupSQL(true)
      return
    }

    try {
      const response = await fetch("/api/dependencies/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update settings")
      }

      // Update local state
      if (settings.update_mode !== undefined) {
        setGlobalUpdateMode(settings.update_mode as any)
      }
      if (settings.auto_update_enabled !== undefined) {
        setAutoUpdateEnabled(settings.auto_update_enabled)
      }
      if (settings.update_schedule !== undefined) {
        setUpdateSchedule(settings.update_schedule)
      }
    } catch (err) {
      console.error("Error updating global settings:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    }
  }

  const runSQL = async () => {
    setSqlExecuting(true)
    setSqlSuccess(false)
    setError(null)

    try {
      const response = await fetch("/api/setup-dependencies-tables", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to set up tables")
      }

      setSqlSuccess(true)
      setTablesExist(true)

      // Refresh dependencies
      await fetchDependencies()
    } catch (err) {
      console.error("Error setting up tables:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setSqlExecuting(false)
    }
  }

  const applyUpdates = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/dependencies/apply", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to apply updates")
      }

      const data = await response.json()

      // Add to update history
      if (data.results) {
        setUpdateResults(data.results)
        setUpdateHistory((prev) => [...data.results, ...prev].slice(0, 20))
      }

      // Refresh dependencies
      await fetchDependencies()
    } catch (err) {
      console.error("Error applying updates:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const filteredDependencies = dependencies
    .filter((dep) => {
      if (filter === "outdated") {
        return dep.outdated
      }
      if (filter === "vulnerable") {
        return dep.has_security_update
      }
      if (filter === "dev") {
        return dep.is_dev
      }
      if (filter === "prod") {
        return !dep.is_dev
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

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>{error}</p>
          </div>
        )}

        {!tablesExist && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
            <p className="font-bold">Database tables not set up</p>
            <p className="mt-2">
              The dependency management system requires database tables to store settings. You can still view your
              dependencies, but to save settings you need to set up the tables.
            </p>
            <div className="mt-4">
              <Button onClick={runSQL} disabled={sqlExecuting}>
                {sqlExecuting ? "Setting up tables..." : "Set Up Tables"}
              </Button>
            </div>
          </div>
        )}

        {sqlSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p>Tables set up successfully!</p>
          </div>
        )}

        <Tabs defaultValue="dependencies" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="history">Update History</TabsTrigger>
          </TabsList>

          <TabsContent value="dependencies">
            <div className="bg-gray-800 p-6 rounded-lg mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Dependency Management</h2>
                <div className="flex items-center gap-2">
                  <div className="text-sm">
                    Security Score:
                    <span
                      className={`ml-2 px-2 py-1 rounded ${
                        securityScore > 80 ? "bg-green-500" : securityScore > 60 ? "bg-yellow-500" : "bg-red-500"
                      }`}
                    >
                      {securityScore}%
                    </span>
                  </div>
                </div>
              </div>

              <p className="mb-4">
                Manage your project dependencies, set update preferences, and keep your project up-to-date.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-700 p-4 rounded-lg flex items-center">
                  <Package className="h-8 w-8 mr-3 text-blue-400" />
                  <div>
                    <h3 className="font-medium">Total Dependencies</h3>
                    <p className="text-2xl">{dependencies.length}</p>
                  </div>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg flex items-center">
                  <AlertTriangle className="h-8 w-8 mr-3 text-yellow-400" />
                  <div>
                    <h3 className="font-medium">Outdated</h3>
                    <p className="text-2xl">{outdatedCount}</p>
                  </div>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg flex items-center">
                  <Shield className="h-8 w-8 mr-3 text-red-400" />
                  <div>
                    <h3 className="font-medium">Security Issues</h3>
                    <p className="text-2xl">{vulnerabilityCount}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <button
                  onClick={fetchDependencies}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                  {loading ? "Refreshing..." : "Refresh Dependencies"}
                </button>

                <button onClick={applyUpdates} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  Apply Updates Now
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
                    <option value="vulnerable">Security Vulnerabilities</option>
                    <option value="dev">Development Dependencies</option>
                    <option value="prod">Production Dependencies</option>
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

              {lastScan && (
                <div className="text-sm text-gray-400 mb-2">Last scanned: {new Date(lastScan).toLocaleString()}</div>
              )}
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
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                          </div>
                          <p className="mt-2">Loading dependencies...</p>
                        </td>
                      </tr>
                    ) : dependencies.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center">
                          No dependencies found.
                        </td>
                      </tr>
                    ) : filteredDependencies.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 text-center">
                          No dependencies match your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredDependencies.map((dep) => (
                        <tr key={dep.name}>
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
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-300 max-w-md truncate">
                              {dep.description || "No description available"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded text-xs ${dep.is_dev ? "bg-purple-600" : "bg-blue-600"}`}
                            >
                              {dep.is_dev ? "Development" : "Production"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {dep.outdated ? (
                              <span className="flex items-center text-yellow-500">
                                <AlertTriangle className="h-4 w-4 mr-1" /> Outdated
                              </span>
                            ) : dep.has_security_update ? (
                              <span className="flex items-center text-red-500">
                                <AlertCircle className="h-4 w-4 mr-1" /> Vulnerable
                              </span>
                            ) : (
                              <span className="flex items-center text-green-500">
                                <CheckCircle className="h-4 w-4 mr-1" /> Up to date
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {dep.latest_version && dep.current_version !== dep.latest_version && (
                              <button
                                onClick={() => updateDependency(dep.name)}
                                disabled={updateStatus[dep.name]?.loading}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 mr-2"
                              >
                                {updateStatus[dep.name]?.loading ? "Updating..." : "Update"}
                              </button>
                            )}
                            {updateStatus[dep.name]?.error && (
                              <div className="text-red-500 text-xs mt-1">{updateStatus[dep.name].error}</div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="bg-gray-800 p-6 rounded-lg mb-8">
              <h2 className="text-xl font-bold mb-4">Dependency Update Settings</h2>
              <p className="mb-6">Configure how dependency updates are handled in your project.</p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Automatic Updates</h3>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="auto-update"
                      checked={autoUpdateEnabled}
                      onCheckedChange={(checked) => {
                        setAutoUpdateEnabled(checked)
                        updateGlobalSettings({ auto_update_enabled: checked })
                      }}
                    />
                    <Label htmlFor="auto-update">Enable automatic updates</Label>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    When enabled, dependencies will be updated automatically according to your update mode.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Update Mode</h3>
                  <RadioGroup
                    value={globalUpdateMode}
                    onValueChange={(value) => {
                      setGlobalUpdateMode(value as any)
                      updateGlobalSettings({ update_mode: value })
                    }}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="manual" id="manual" />
                      <Label htmlFor="manual">Manual</Label>
                    </div>
                    <p className="text-sm text-gray-400 ml-6 mb-2">
                      Only update dependencies when explicitly requested.
                    </p>

                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="conservative" id="conservative" />
                      <Label htmlFor="conservative">Conservative</Label>
                    </div>
                    <p className="text-sm text-gray-400 ml-6 mb-2">
                      Only automatically update dependencies with security vulnerabilities.
                    </p>

                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="auto" id="auto" />
                      <Label htmlFor="auto">Automatic</Label>
                    </div>
                    <p className="text-sm text-gray-400 ml-6">
                      Automatically update all dependencies to their latest versions.
                    </p>
                  </RadioGroup>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Update Schedule</h3>
                  <select
                    value={updateSchedule}
                    onChange={(e) => {
                      setUpdateSchedule(e.target.value)
                      updateGlobalSettings({ update_schedule: e.target.value })
                    }}
                    className="w-full p-2 bg-gray-700 rounded"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <p className="text-sm text-gray-400 mt-1">How often the system should check for and apply updates.</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <div className="bg-gray-800 p-6 rounded-lg mb-8">
              <h2 className="text-xl font-bold mb-4">Update History</h2>
              <p className="mb-6">Recent dependency updates in your project.</p>

              {updateHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No update history available.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {updateHistory.map((update, index) => (
                    <div key={index} className="bg-gray-700 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">{update.name}</span>
                          <span className="text-sm text-gray-400 ml-2">
                            {update.from} → {update.to}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded ${
                            update.success ? "bg-green-500 text-white" : "bg-red-500 text-white"
                          }`}
                        >
                          {update.success ? "Success" : "Failed"}
                        </span>
                      </div>
                      {update.error && <div className="mt-2 text-red-400 text-sm">Error: {update.error}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminCheck>
  )
}
