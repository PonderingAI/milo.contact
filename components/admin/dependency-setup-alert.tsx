"use client"

import { useState, useEffect } from "react"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DependencySetupAlert() {
  const [loading, setLoading] = useState(true)
  const [tablesExist, setTablesExist] = useState(true)
  const [missingTables, setMissingTables] = useState<string[]>([])
  const [setupRunning, setSetupRunning] = useState(false)
  const [setupSuccess, setSetupSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const runCheck = async () => {
      if (isMounted) {
        await checkTables()
      }
    }

    runCheck()

    return () => {
      isMounted = false
    }
  }, [])

  const checkTables = async () => {
    try {
      setLoading(true)
      setError(null)

      // Add a timeout to the fetch request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const response = await fetch("/api/dependencies/check-tables", {
        signal: controller.signal,
      }).catch((err) => {
        // Handle network errors explicitly
        console.warn("Network error checking tables:", err)
        // Return a fake response to continue execution
        return {
          ok: false,
          json: async () => ({ success: false, message: "Network error" }),
        }
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to parse error response" }))
        throw new Error(errorData.message || "Failed to check tables")
      }

      const data = await response.json().catch(() => ({ success: false, message: "Failed to parse response" }))

      if (data.success) {
        setTablesExist(data.allTablesExist)
        setMissingTables(data.missingTables || [])
      } else {
        // Don't throw here, just set the error state
        setError(data.message || "Unknown error checking tables")
      }
    } catch (err) {
      console.warn("Error checking tables:", err)
      setError(err instanceof Error ? err.message : "Failed to check tables")
      // Set default values to prevent UI issues
      setTablesExist(false)
      setMissingTables([])
    } finally {
      setLoading(false)
    }
  }

  const setupTables = async () => {
    try {
      setSetupRunning(true)
      setError(null)

      const response = await fetch("/api/setup-dependencies-tables", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to set up tables")
      }

      setSetupSuccess(true)
      setTablesExist(true)
      setMissingTables([])

      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } catch (err) {
      console.error("Error setting up tables:", err)
      setError(err instanceof Error ? err.message : "Failed to set up tables")
    } finally {
      setSetupRunning(false)
    }
  }

  if (loading) {
    return null // Don't show anything while loading
  }

  if (tablesExist) {
    return null // Don't show anything if tables exist
  }

  return (
    <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-6">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-bold">Database tables not set up</p>

          {missingTables.length > 0 && (
            <p className="mt-2">
              The following tables are missing: <strong>{missingTables.join(", ")}</strong>
            </p>
          )}

          <p className="mt-2">
            The dependency management system requires database tables to store settings and dependency information.
          </p>

          {error && <p className="mt-2 text-red-600">Error: {error}</p>}

          <div className="mt-4">
            <Button
              onClick={setupTables}
              disabled={setupRunning}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {setupRunning ? "Setting up tables..." : "Set Up Tables"}
            </Button>

            {setupSuccess && <p className="mt-2 text-green-600">Tables set up successfully! Refreshing page...</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
