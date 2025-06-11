"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DatabaseSetupAlertProps {
  isSetup: boolean
}

export default function DatabaseSetupAlert({ isSetup }: DatabaseSetupAlertProps) {
  const [dismissed, setDismissed] = useState(false)
  const [isDatabaseSetup, setIsDatabaseSetup] = useState(isSetup)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check local storage on mount to see if the alert has been dismissed
  useEffect(() => {
    const isDismissed = localStorage.getItem("dbSetupAlertDismissed") === "true"
    setDismissed(isDismissed)

    // If we're not set up, clear the dismissed state
    if (!isSetup) {
      localStorage.removeItem("dbSetupAlertDismissed")
      setDismissed(false)
    }
  }, [isSetup])

  useEffect(() => {
    const checkTables = async () => {
      if (isSetup || isChecking) return

      setIsChecking(true)
      setError(null)

      try {
        // Use the API endpoint which is more reliable
        const response = await fetch("/api/check-database-setup")
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log("[database-setup-alert] API response:", data)
        
        if (data.isSetup) {
          setIsDatabaseSetup(true)
          localStorage.setItem("dbSetupAlertDismissed", "true")
          setDismissed(true)
        } else {
          setIsDatabaseSetup(false)
          setError(`Database tables are missing: ${data.tablesNeeded?.join(', ') || 'Unknown tables'}. Please set up the database.`)
        }
      } catch (apiError) {
        console.error("Error checking database setup:", apiError)
        setError("Network error checking tables: " + (apiError instanceof Error ? apiError.message : String(apiError)))
        setIsDatabaseSetup(false)
      } finally {
        setIsChecking(false)
      }
    }

    // Only check if not already set up and not dismissed
    if (!isSetup && !dismissed) {
      checkTables()
    }
  }, [isSetup, dismissed, isChecking])

  const handleDismiss = () => {
    localStorage.setItem("dbSetupAlertDismissed", "true")
    setDismissed(true)
  }

  if (isDatabaseSetup || dismissed) {
    return null
  }

  return (
    <Alert variant="destructive" className="mb-8 bg-red-900/20 border-red-800">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Database Setup Required</AlertTitle>
      <AlertDescription className="flex flex-col md:flex-row md:items-center gap-4">
        <span>
          {error ||
            "Your portfolio is currently using mock data. To use your own content, you need to set up the database."}
        </span>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="border-red-400 text-red-100 hover:bg-red-900/30">
            <Link href="/setup-database">Set Up Database</Link>
          </Button>
          <Button variant="ghost" className="text-red-100 hover:bg-red-900/30" onClick={handleDismiss}>
            Dismiss
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
