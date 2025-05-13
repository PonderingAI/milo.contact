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

  // Check local storage on mount to see if the alert has been dismissed
  useEffect(() => {
    const isDismissed = localStorage.getItem("dbSetupAlertDismissed") === "true"
    setDismissed(isDismissed)
  }, [])

  // Update the useEffect to better handle network errors
  useEffect(() => {
    const checkTables = async () => {
      try {
        // Add a timeout to the fetch request
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        try {
          const response = await fetch("/api/check-table?table=projects", {
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            console.warn("Error checking tables:", response.status, response.statusText)
            return
          }

          let data
          try {
            data = await response.json()
          } catch (parseError) {
            console.error("Error parsing JSON response:", parseError)
            return
          }

          if (data?.exists) {
            setIsDatabaseSetup(true)
          }
        } catch (fetchError) {
          clearTimeout(timeoutId)
          console.warn("Fetch error checking tables:", fetchError)

          // Don't show errors for timeout - just fail silently
          if (fetchError.name !== "AbortError") {
            console.error("Error checking tables:", fetchError)
          }
        }
      } catch (err) {
        console.warn("Error checking tables:", err)
        // Handle error gracefully
      }
    }

    if (!isSetup) {
      checkTables()
    }
  }, [isSetup])

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
          Your portfolio is currently using mock data. To use your own content, you need to set up the database.
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
