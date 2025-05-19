"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Check, Database, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function DependencyCompatibilitySetupGuide() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [tableExists, setTableExists] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)

  // Function to check if the table exists
  const checkTable = async () => {
    setChecking(true)
    setError(null)

    try {
      const response = await fetch("/api/check-table?table=dependency_compatibility")
      const data = await response.json()

      if (response.ok) {
        setTableExists(data.exists)
      } else {
        throw new Error(data.error || "Failed to check table")
      }
    } catch (error) {
      console.error("Error checking table:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setChecking(false)
    }
  }

  // Function to create the table
  const createTable = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/dependencies/setup-compatibility-table", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTableExists(true)
      } else {
        throw new Error(data.error || "Failed to create table")
      }
    } catch (error) {
      console.error("Error creating table:", error)
      setError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Check table existence on component mount
  useState(() => {
    checkTable()
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Dependency Compatibility System
        </CardTitle>
        <CardDescription>
          Set up the dependency compatibility tracking system to automatically manage package versions
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="default" className="mb-4 bg-green-50 text-green-800 border-green-200">
            <Check className="h-4 w-4" />
            <AlertDescription>Dependency compatibility table created successfully!</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Dependency Compatibility Table</h3>
              <p className="text-sm text-gray-500">
                Stores compatibility information for dependencies to ensure safe updates
              </p>
            </div>
            <div className="flex items-center gap-2">
              {tableExists === true && <Check className="h-4 w-4 text-green-500" />}
              {tableExists === false && <AlertCircle className="h-4 w-4 text-amber-500" />}
              {tableExists === null && <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />}
              <span className="text-sm">
                {tableExists === true && "Installed"}
                {tableExists === false && "Not Installed"}
                {tableExists === null && "Checking..."}
              </span>
            </div>
          </div>

          <div className="rounded-md bg-gray-50 p-4 text-sm">
            <p className="font-medium mb-2">What this table provides:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Tracks compatible version ranges for each dependency</li>
              <li>Records breaking changes and recommended versions</li>
              <li>Enables autonomous dependency management</li>
              <li>Prevents updates to known incompatible versions</li>
              <li>Builds a knowledge base of package compatibility</li>
            </ul>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={checkTable} disabled={checking}>
          <RefreshCw className={`h-4 w-4 mr-2 ${checking ? "animate-spin" : ""}`} />
          Check Status
        </Button>

        {tableExists === false && (
          <Button onClick={createTable} disabled={loading}>
            {loading ? "Creating..." : "Create Table"}
          </Button>
        )}

        {tableExists === true && (
          <Button variant="outline" disabled>
            <Check className="h-4 w-4 mr-2" />
            Already Installed
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
