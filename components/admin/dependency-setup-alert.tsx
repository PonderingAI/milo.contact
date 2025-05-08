"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import DependencyTableSetupGuide from "./dependency-table-setup-guide"

export default function DependencySetupAlert() {
  const [showSetupGuide, setShowSetupGuide] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tablesExist, setTablesExist] = useState({
    dependencies: false,
    dependency_settings: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [setupAttempted, setSetupAttempted] = useState(false)
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const setupTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Clear timeouts on component unmount
  useEffect(() => {
    return () => {
      if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current)
      if (setupTimeoutRef.current) clearTimeout(setupTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    checkTables()
  }, [])

  const checkTables = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/dependencies/check-tables")

      if (!response.ok) {
        throw new Error("Failed to check tables")
      }

      const data = await response.json()

      if (data.success) {
        setTablesExist(data.tables)

        // If tables don't exist and we haven't attempted setup yet, try to set them up
        if ((!data.tables.dependencies || !data.tables.dependency_settings) && !setupAttempted) {
          setSetupAttempted(true)
          try {
            await fetch("/api/dependencies/setup", { method: "POST" })
            // Schedule a single recheck after setup
            if (setupTimeoutRef.current) clearTimeout(setupTimeoutRef.current)
            setupTimeoutRef.current = setTimeout(() => {
              checkTables()
            }, 5000) // Check again after 5 seconds
          } catch (setupError) {
            console.error("Error setting up tables:", setupError)
          }
        }
      } else {
        throw new Error(data.error || "Unknown error checking tables")
      }
    } catch (err) {
      console.error("Error checking tables:", err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSetupComplete = () => {
    setShowSetupGuide(false)
    setSetupAttempted(true)
    checkTables()
  }

  const handleManualSetup = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/dependencies/setup", { method: "POST" })
      if (!response.ok) {
        throw new Error("Failed to set up tables")
      }

      // Wait 3 seconds before checking tables again
      setTimeout(() => {
        checkTables()
      }, 3000)
    } catch (error) {
      console.error("Error setting up tables:", error)
      setError(error instanceof Error ? error.message : String(error))
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        <span className="ml-2">Checking database setup...</span>
      </div>
    )
  }

  if (tablesExist.dependencies && tablesExist.dependency_settings) {
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
        </AlertDescription>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => setShowSetupGuide(true)} variant="outline" className="bg-gray-800">
            Set Up Dependencies Tables
          </Button>
          <Button onClick={handleManualSetup} variant="outline" className="bg-gray-800" disabled={loading}>
            {loading ? "Setting up..." : "Quick Setup"}
          </Button>
        </div>
      </Alert>

      {showSetupGuide && (
        <div className="mt-4">
          <DependencyTableSetupGuide onSetupComplete={handleSetupComplete} />
        </div>
      )}
    </div>
  )
}
