"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

type DiagnosticResult = {
  databaseConnection: {
    success: boolean
    message?: string
  }
  migrations: {
    success: boolean
    message?: string
  }
  projects: {
    success: boolean
    message?: string
  }
}

const DatabaseDiagnostic = () => {
  const [result, setResult] = useState<DiagnosticResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runDiagnostic = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/database-diagnostic")
      const data = await response.json()
      setResult(data)
    } catch (err) {
      console.error("Error running diagnostic:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    runDiagnostic()
  }, [])

  // Add this function after the runDiagnostic function

  const setupProjectsTable = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/setup-projects-table", {
        method: "POST",
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.details || "Failed to setup projects table")
      }

      // Run diagnostic again to show updated state
      await runDiagnostic()
    } catch (err) {
      console.error("Error setting up projects table:", err)
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Diagnostic</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Running diagnostic...
          </div>
        )}
        {error && <div className="text-red-500">{error}</div>}
        {result && (
          <div>
            <div className="mb-2">
              Database Connection:{" "}
              <Badge variant={result.databaseConnection.success ? "success" : "destructive"}>
                {result.databaseConnection.success ? "Success" : "Failed"}
              </Badge>
              {result.databaseConnection.message && (
                <div className="text-sm text-muted-foreground">{result.databaseConnection.message}</div>
              )}
            </div>
            <div className="mb-2">
              Migrations:{" "}
              <Badge variant={result.migrations.success ? "success" : "destructive"}>
                {result.migrations.success ? "Success" : "Failed"}
              </Badge>
              {result.migrations.message && (
                <div className="text-sm text-muted-foreground">{result.migrations.message}</div>
              )}
            </div>
            <div className="mb-2">
              Projects Table:{" "}
              <Badge variant={result.projects.success ? "success" : "destructive"}>
                {result.projects.success ? "Success" : "Failed"}
              </Badge>
              {result.projects.message && (
                <div className="text-sm text-muted-foreground">{result.projects.message}</div>
              )}
            </div>
          </div>
        )}
        {result && !result.projects.success && (
          <div className="mt-4">
            <Button onClick={setupProjectsTable} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Setting up projects table...
                </>
              ) : (
                "Setup Projects Table"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default DatabaseDiagnostic
