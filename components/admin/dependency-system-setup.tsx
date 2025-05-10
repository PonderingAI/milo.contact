"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Database, Check } from "lucide-react"
import { SetupTablesPopup } from "@/components/setup-tables-popup"
import { getTablesForSection } from "@/lib/database-schema"

export function DependencySystemSetup() {
  const [loading, setLoading] = useState(true)
  const [missingTables, setMissingTables] = useState<string[]>([])
  const [showSetup, setShowSetup] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [setupComplete, setSetupComplete] = useState(false)
  const [manualOverride, setManualOverride] = useState(false)
  const [setupAttempted, setSetupAttempted] = useState(false)

  // Get required tables for the security section
  const requiredTables = getTablesForSection("security").map((table) => table.name)

  useEffect(() => {
    // Check if we have a manual override in localStorage
    const override = localStorage.getItem("dependency_setup_override")
    if (override === "true") {
      setManualOverride(true)
      setSetupComplete(true)
      return
    }

    checkTables()
  }, [])

  const checkTables = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/direct-table-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tables: requiredTables }),
      })

      if (!response.ok) {
        throw new Error("Failed to check tables")
      }

      const data = await response.json()

      if (data.allExist) {
        setSetupComplete(true)
      } else {
        setMissingTables(data.missingTables || [])
        setShowSetup(true)
      }
    } catch (err) {
      console.error("Error checking tables:", err)
      setError(err instanceof Error ? err.message : "Failed to check tables")
    } finally {
      setLoading(false)
    }
  }

  const handleSetupComplete = () => {
    setSetupComplete(true)
    setShowSetup(false)
    // Refresh the page to show the dependency system
    window.location.reload()
  }

  const handleManualOverride = () => {
    // Set the override in localStorage
    localStorage.setItem("dependency_setup_override", "true")
    setManualOverride(true)
    setSetupComplete(true)
    // Refresh the page
    window.location.reload()
  }

  const handleRetry = () => {
    setSetupAttempted(true)
    checkTables()
  }

  if (loading && !setupAttempted) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (setupComplete || manualOverride) {
    return null
  }

  return (
    <div className="mb-6">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {showSetup && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-900/20 p-3 rounded-full">
              <Database className="h-6 w-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2">Dependency System Setup Required</h3>
              <p className="text-gray-400 mb-4">
                The dependency management system requires database tables to store settings and dependency information.
              </p>

              {missingTables.length > 0 && (
                <div className="mb-4">
                  <p className="font-medium">Missing tables:</p>
                  <ul className="list-disc list-inside text-sm text-gray-400">
                    {missingTables.map((table) => (
                      <li key={table}>{table}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setShowSetup(true)}>Set Up Tables</Button>
                <Button variant="outline" onClick={handleRetry}>
                  Retry Check
                </Button>
                <Button variant="ghost" onClick={handleManualOverride} className="text-gray-400">
                  <Check className="h-4 w-4 mr-2" />
                  Skip Setup (Override)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* This will use the universal SQL setup popup */}
      {showSetup && <SetupTablesPopup requiredTables={requiredTables} onSetupComplete={handleSetupComplete} />}
    </div>
  )
}
