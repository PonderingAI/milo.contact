"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Database } from "lucide-react"
import { SetupTablesPopup } from "@/components/setup-tables-popup"

export function DependencySystemSetup() {
  const [loading, setLoading] = useState(true)
  const [missingTables, setMissingTables] = useState<string[]>([])
  const [showSetup, setShowSetup] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [setupComplete, setSetupComplete] = useState(false)

  useEffect(() => {
    checkTables()
  }, [])

  const checkTables = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/dependencies/check-tables")

      if (!response.ok) {
        throw new Error("Failed to check tables")
      }

      const data = await response.json()

      if (data.success) {
        if (!data.allTablesExist) {
          setMissingTables(data.missingTables || [])
          setShowSetup(true)
        } else {
          setSetupComplete(true)
        }
      } else {
        throw new Error(data.message || "Unknown error checking tables")
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (setupComplete) {
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

              <div className="flex gap-3">
                <Button onClick={() => setShowSetup(true)}>Set Up Tables</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* This will use your universal SQL setup popup */}
      {showSetup && (
        <SetupTablesPopup
          requiredTables={["dependencies", "dependency_settings", "security_audits"]}
          onSetupComplete={handleSetupComplete}
        />
      )}
    </div>
  )
}
