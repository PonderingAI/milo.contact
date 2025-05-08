"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function DependencySetupAlert() {
  const [loading, setLoading] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)

  useEffect(() => {
    // Check if tables exist on mount
    checkAndSetupTables()
  }, [])

  const checkAndSetupTables = async () => {
    try {
      setLoading(true)

      // Try to set up tables directly
      const response = await fetch("/api/setup-dependencies-tables", { method: "POST" })

      if (response.ok) {
        setSetupComplete(true)

        // Initialize dependencies after tables are set up
        try {
          await fetch("/api/dependencies/initialize", { method: "POST" })
        } catch (initError) {
          console.error("Error initializing dependencies:", initError)
        }
      }
    } catch (error) {
      console.error("Error setting up tables:", error)
    } finally {
      setLoading(false)
    }
  }

  // If setup is complete or in progress, don't show anything
  if (setupComplete || loading) {
    return null
  }

  // Simple button to retry setup if needed
  return (
    <div className="flex justify-center my-4">
      <Button onClick={checkAndSetupTables} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Initialize Dependency System
      </Button>
    </div>
  )
}
