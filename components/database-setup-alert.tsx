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

  useEffect(() => {
    const checkTables = async () => {
      try {
        // Add a timeout to the fetch request
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

        const response = await fetch("/api/check-table?table=projects", {
          signal: controller.signal,
        }).catch((err) => {
          // Handle network errors explicitly
          console.warn("Network error checking tables:", err)
          // Return a fake response to continue execution
          return {
            ok: false,
            json: async () => ({ success: false, message: "Network error" }),
          }
        })

        clearTimeout(timeoutId)

        if (!response?.ok) {
          console.warn("Error checking tables:", response)
          return
        }

        const data = await response.json()

        if (data?.exists) {
          setIsDatabaseSetup(true)
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
