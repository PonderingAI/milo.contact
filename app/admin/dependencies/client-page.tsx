"use client"

import { useEffect, useState } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import AdminCheck from "@/components/admin/admin-check"
import { Button } from "@/components/ui/button"
import { AlertCircle, Package } from "lucide-react"
import DependencyTableSetupGuide from "@/components/admin/dependency-table-setup-guide"
import { Badge } from "@/components/ui/badge"

export default function ClientDependenciesPage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [dependencies, setDependencies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [setupNeeded, setSetupNeeded] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)

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
        setDependencies(data.dependencies || [])
        setSetupNeeded(false)
      }
    } catch (err) {
      console.error("Error fetching dependencies:", err)
      setError("Failed to load dependencies. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Add after the fetchDependencies function
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

  // Add a useEffect to scan dependencies on initial load
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
                Refresh Dependencies
              </Button>
            </div>

            {dependencies.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 px-4">Package</th>
                      <th className="text-left py-2 px-4">Current</th>
                      <th className="text-left py-2 px-4">Latest</th>
                      <th className="text-left py-2 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dependencies.map((dep) => (
                      <tr key={dep.name} className="border-b border-gray-800">
                        <td className="py-2 px-4">
                          <div className="font-medium">{dep.name}</div>
                          <div className="text-sm text-gray-400">{dep.description || "No description"}</div>
                        </td>
                        <td className="py-2 px-4">{dep.current_version}</td>
                        <td className="py-2 px-4">{dep.latest_version}</td>
                        <td className="py-2 px-4">
                          {dep.outdated ? (
                            <Badge variant="outline" className="border-yellow-600 text-yellow-300">
                              Outdated
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-green-600 text-green-300">
                              Up to date
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>Click "Scan for Dependencies" to analyze your project.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminCheck>
  )
}
