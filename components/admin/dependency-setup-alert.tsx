"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"

export default function DependencySetupAlert() {
  const [loading, setLoading] = useState(true)
  const [setupNeeded, setSetupNeeded] = useState(false)
  const [setupInProgress, setSetupInProgress] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkTables()
  }, [])

  const checkTables = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/dependencies/check-tables")
      const data = await response.json()

      if (data.success) {
        // If either table is missing, setup is needed
        setSetupNeeded(!data.tables.dependencies || !data.tables.dependency_settings)
      } else {
        // If the check failed, assume setup is needed
        setSetupNeeded(true)
        setError(data.error || "Failed to check tables")
      }
    } catch (err) {
      console.error("Error checking tables:", err)
      setSetupNeeded(true)
      setError(err instanceof Error ? err.message : "Failed to check tables")
    } finally {
      setLoading(false)
    }
  }

  const handleSetup = async () => {
    try {
      setSetupInProgress(true)
      setError(null)

      const response = await fetch("/api/dependencies/setup", { method: "POST" })
      const data = await response.json()

      if (data.success) {
        // Setup successful, no longer needed
        setSetupNeeded(false)
      } else {
        setError(data.error || "Failed to set up tables")
      }
    } catch (err) {
      console.error("Error setting up tables:", err)
      setError(err instanceof Error ? err.message : "Failed to set up tables")
    } finally {
      setSetupInProgress(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Checking database setup...</span>
      </div>
    )
  }

  if (!setupNeeded) {
    return null
  }

  return (
    <div className="mb-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Database tables not set up</AlertTitle>
        <AlertDescription>
          The dependency management system requires database tables to be set up. Please click the button below to set
          up the required tables.
          {error && (
            <div className="mt-2 text-red-300">
              <strong>Error:</strong> {error}
            </div>
          )}
        </AlertDescription>
        <div className="mt-4">
          <Button onClick={handleSetup} disabled={setupInProgress} className="bg-gray-800 hover:bg-gray-700">
            {setupInProgress ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Setting up tables...
              </>
            ) : (
              "Set Up Tables"
            )}
          </Button>
        </div>
      </Alert>
    </div>
  )
}
