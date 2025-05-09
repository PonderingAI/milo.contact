"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import DependencyTableSetupGuide from "./dependency-table-setup-guide"

export default function DependencySetupAlert() {
  const [showSetupGuide, setShowSetupGuide] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tablesStatus, setTablesStatus] = useState({
    dependencies: false,
    dependency_settings: false,
    security_audits: false,
  })
  const [missingTables, setMissingTables] = useState<string[]>([])
  const [setupMessage, setSetupMessage] = useState("")
  const [error, setError] = useState<string | null>(null)

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
        setTablesStatus(data.tables)
        setMissingTables(data.missingTables || [])
        setSetupMessage(data.setupMessage || "")
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
    checkTables()
  }

  // If all tables exist, don't show the alert
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        <span className="ml-2">Checking database setup...</span>
      </div>
    )
  }

  // If all tables exist, don't show the alert
  if (missingTables.length === 0) {
    return null
  }

  return (
    <div className="mb-6">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Database tables not fully set up</AlertTitle>
        <AlertDescription>
          {setupMessage || "Some dependency management tables are missing. Please set up the required tables."}
        </AlertDescription>
        <div className="mt-4">
          <Button onClick={() => setShowSetupGuide(true)} variant="outline" className="bg-gray-800">
            Set Up Missing Tables
          </Button>
        </div>
      </Alert>

      {showSetupGuide && (
        <div className="mt-4">
          <DependencyTableSetupGuide onSetupComplete={handleSetupComplete} missingTables={missingTables} />
        </div>
      )}
    </div>
  )
}
