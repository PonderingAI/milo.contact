"use client"

import { useState, useEffect } from "react"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import CompactDatabaseManager from "@/components/admin/compact-database-manager"

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

    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <CompactDatabaseManager />
    </div>
  )
}
