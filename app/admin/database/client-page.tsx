"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Database } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import DatabaseSetupPopup from "@/components/admin/database-setup-popup"

export default function DatabaseClientPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Force localStorage to not remember the database setup completion
    // This ensures the database management page always shows tables
    try {
      localStorage.removeItem("database_setup_completed")
    } catch (e) {
      console.error("Could not access localStorage", e)
    }

    // Setup the check_tables_exist function
    fetch("/api/setup-check-tables-function")
      .then((response) => {
        if (!response.ok) {
          console.warn("Failed to setup check_tables_exist function")
        }
      })
      .catch((err) => {
        console.warn("Error setting up check_tables_exist function:", err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Database Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-6">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Database Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Use the DatabaseSetupPopup component directly in stationary mode */}
          <div className="mt-4">
            <DatabaseSetupPopup
              requiredSections={["all"]}
              adminOnly={false}
              title="Database Tables Management"
              description="View, create, and manage database tables for your application."
              isStationary={true}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
