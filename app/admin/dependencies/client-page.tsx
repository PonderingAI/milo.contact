"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import AdminCheck from "@/components/admin/admin-check"
import { Button } from "@/components/ui/button"
import { AlertCircle, Package, RefreshCw } from "lucide-react"
import DependencyTableSetupGuide from "@/components/admin/dependency-table-setup-guide"
import { DependencyList } from "@/components/admin/dependency-list"
import type { ToggleState } from "@/components/ui/four-state-toggle"

// Define the dependency interface
interface Dependency {
  id: string
  name: string
  currentVersion: string
  latestVersion: string
  outdated: boolean
  locked: boolean
  description: string
  hasSecurityIssue: boolean
  securityDetails?: any
  hasDependabotAlert?: boolean
  dependabotAlertDetails?: any
  updateMode: ToggleState
  isDev?: boolean
}

export default function ClientDependenciesPage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [setupNeeded, setSetupNeeded] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)
  const [filter, setFilter] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [showVulnerabilityDetails, setShowVulnerabilityDetails] = useState(false)
  const [selectedDependency, setSelectedDependency] = useState(null)

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
    if (typeof window === "undefined") return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/dependencies")
      const data = await response.json()

      if (data.setupNeeded) {
        setSetupNeeded(true)
        setDependencies([])
      } else {
        // Map the API response to the expected format
        const mappedDependencies = (data.dependencies || []).map((dep) => ({
          id: dep.id || dep.name,
          name: dep.name,
          currentVersion: dep.current_version,
          latestVersion: dep.latest_version,
          outdated: dep.outdated,
          locked: dep.locked || false,
          description: dep.description || "",
          hasSecurityIssue: dep.has_security_issue || false,
          securityDetails: dep.security_details,
          hasDependabotAlert: dep.has_dependabot_alert || false,
          dependabotAlertDetails: dep.dependabot_alert_details,
          updateMode: dep.update_mode || "global",
          isDev: dep.is_dev || false,
        }))

        setDependencies(mappedDependencies)
        setSetupNeeded(false)
      }
    } catch (err) {
      console.error("Error fetching dependencies:", err)
      setError("Failed to load dependencies. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const scanDependencies = async () => {
    if (typeof window === "undefined") return

    setLoading(true)
    setError(null)

    try {
      // First, trigger a scan to update dependency information
      const scanResponse = await fetch("/api/dependencies/scan", {
        method: "POST",
      })

      if (!scanResponse.ok) {
        throw new Error("Failed to scan dependencies")
      }

      // Then fetch the updated dependency information
      await fetchDependencies()
    } catch (err) {
      console.error("Error scanning dependencies:", err)
      setError("Failed to scan dependencies. Please try again.")
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isSignedIn && !setupNeeded) {
      scanDependencies()
    }
  }, [isSignedIn, setupNeeded])

  const handleSetupComplete = () => {
    setSetupComplete(true)
    setSetupNeeded(false)
    fetchDependencies()
  }

  const updateDependencyMode = async (id: string, value: ToggleState) => {
    // Find the dependency
    const dependency = dependencies.find((dep) => dep.id === id)
    if (!dependency) return

    // Update locally first for immediate feedback
    setDependencies((deps) => deps.map((dep) => (dep.id === id ? { ...dep, updateMode: value } : dep)))

    // Then update on the server
    try {
      await fetch(`/api/dependencies/update-mode`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, mode: value }),
      })
    } catch (error) {
      console.error("Failed to update dependency mode:", error)
      // Revert on failure
      fetchDependencies()
    }
  }

  const viewVulnerabilityDetails = (dependency) => {
    setSelectedDependency(dependency)
    setShowVulnerabilityDetails(true)
  }

  const viewDependabotAlertDetails = (dependency) => {
    setSelectedDependency(dependency)
    setShowVulnerabilityDetails(true)
  }

  const clearFilters = () => {
    setFilter("")
    setSearchTerm("")
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Authentication Required</h2>
          <p className="mb-4">You need to be signed in to access this page.</p>
          <Button onClick={() => router.push("/sign-in?redirect_url=/admin/dependencies")}>Sign In</Button>
        </div>
      </div>
    )
  }

  return (
    <AdminCheck>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Dependency Management</h1>

        {/* Setup Popup */}
        {setupNeeded && !setupComplete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Database Setup Required</h2>
                <p className="mb-6">
                  The dependency management system needs to be set up. Please follow the instructions below.
                </p>
                <DependencyTableSetupGuide onSetupComplete={handleSetupComplete} />
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {loading ? (
          <div className="bg-gray-800 p-6 rounded-lg flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-3"></div>
            <p>Loading dependency information...</p>
          </div>
        ) : setupComplete ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            <p className="font-bold">Setup completed successfully!</p>
            <p>The dependency management system is now ready to use.</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          </div>
        ) : dependencies.length === 0 && !setupNeeded ? (
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center justify-center flex-col p-8">
              <Package className="h-16 w-16 mb-4 text-gray-400" />
              <h2 className="text-xl font-bold mb-2">No Dependencies Found</h2>
              <p className="text-center text-gray-400 mb-4">Your project doesn't have any dependencies yet.</p>
              <Button onClick={scanDependencies}>Scan for Dependencies</Button>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Project Dependencies</h2>
              <Button onClick={scanDependencies} className="ml-auto">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Dependencies
              </Button>
            </div>

            {/* Search and filter controls */}
            <div className="mb-6 flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  placeholder="Search dependencies..."
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filter === "" ? "default" : "outline"}
                  onClick={() => setFilter("")}
                  className="border-gray-600"
                >
                  All
                </Button>
                <Button
                  variant={filter === "outdated" ? "default" : "outline"}
                  onClick={() => setFilter("outdated")}
                  className="border-gray-600"
                >
                  Outdated
                </Button>
                <Button
                  variant={filter === "security" ? "default" : "outline"}
                  onClick={() => setFilter("security")}
                  className="border-gray-600"
                >
                  Security Issues
                </Button>
                <Button
                  variant={filter === "dev" ? "default" : "outline"}
                  onClick={() => setFilter("dev")}
                  className="border-gray-600"
                >
                  Dev Dependencies
                </Button>
              </div>
            </div>

            {/* Dependency list */}
            {dependencies.length > 0 ? (
              <DependencyList
                dependencies={dependencies}
                filter={filter}
                searchTerm={searchTerm}
                updateDependencyMode={updateDependencyMode}
                viewVulnerabilityDetails={viewVulnerabilityDetails}
                viewDependabotAlertDetails={viewDependabotAlertDetails}
                clearFilters={clearFilters}
                onRefresh={fetchDependencies}
              />
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No dependencies match your search criteria.</p>
                {(filter !== "" || searchTerm !== "") && (
                  <Button variant="outline" className="mt-4 border-gray-700" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminCheck>
  )
}
