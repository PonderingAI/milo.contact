"use client"

import type React from "react"

import { useState, useEffect } from "react"
import DatabaseSetupPopup from "@/components/admin/database-setup-popup"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface AdminDatabaseCheckProps {
  children: React.ReactNode
}

export default function AdminDatabaseCheck({ children }: AdminDatabaseCheckProps) {
  const [setupComplete, setSetupComplete] = useState(false)
  const [initialCheckDone, setInitialCheckDone] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [missingTables, setMissingTables] = useState<string[]>([])

  // Check if setup was previously completed
  useEffect(() => {
    try {
      const completed = localStorage.getItem("database_setup_completed")
      if (completed === "true") {
        // Even if marked as complete, still verify the tables exist
        checkDatabase(true)
        return
      }
    } catch (e) {
      console.error("Could not read from localStorage", e)
    }

    // If not marked as complete in localStorage, check the database directly
    checkDatabase(false)
  }, [])

  const checkDatabase = async (skipSetupComplete = false) => {
    if (isChecking) return
    setIsChecking(true)

    try {
      // First try the API endpoint
      try {
        const response = await fetch("/api/check-database-setup")
        if (response.ok) {
          const data = await response.json()

          if (data.missingTables && data.missingTables.length > 0) {
            setMissingTables(data.missingTables)
            setSetupComplete(false)
            // Clear the localStorage flag if tables are missing
            localStorage.removeItem("database_setup_completed")
          } else {
            setMissingTables([])
            if (!skipSetupComplete) {
              setSetupComplete(true)
              try {
                localStorage.setItem("database_setup_completed", "true")
              } catch (e) {
                console.error("Could not save to localStorage", e)
              }
            }
          }

          setInitialCheckDone(true)
          return
        }
      } catch (apiError) {
        console.warn("API check failed, falling back to direct check:", apiError)
      }

      // Fallback to direct check
      const supabase = createClientComponentClient()
      const coreTables = ["user_roles", "site_settings", "projects"]
      const missing: string[] = []

      for (const table of coreTables) {
        try {
          const { error } = await supabase.from(table).select("id").limit(1)
          if (error && (error.code === "PGRST116" || error.message.includes("does not exist"))) {
            missing.push(table)
          }
        } catch (err) {
          console.warn(`Error checking table ${table}:`, err)
          missing.push(table)
        }
      }

      setMissingTables(missing)

      if (missing.length === 0) {
        if (!skipSetupComplete) {
          setSetupComplete(true)
          try {
            localStorage.setItem("database_setup_completed", "true")
          } catch (e) {
            console.error("Could not save to localStorage", e)
          }
        }
      } else {
        setSetupComplete(false)
        // Clear the localStorage flag if tables are missing
        localStorage.removeItem("database_setup_completed")
      }
    } catch (err) {
      console.warn("Error checking database:", err)
      // If there's an error, we'll assume setup is not complete
      setSetupComplete(false)
    } finally {
      setIsChecking(false)
      setInitialCheckDone(true)
    }
  }

  const handleSetupComplete = () => {
    setSetupComplete(true)
    try {
      localStorage.setItem("database_setup_completed", "true")
    } catch (e) {
      console.error("Could not save to localStorage", e)
    }
  }

  // Don't render anything until we've checked localStorage and/or the database
  if (!initialCheckDone) {
    return null
  }

  return (
    <>
      {!setupComplete && missingTables.length > 0 && (
        <DatabaseSetupPopup
          requiredSections={["core"]}
          adminOnly={true}
          onSetupComplete={handleSetupComplete}
          customTables={missingTables}
        />
      )}
      {children}
    </>
  )
}
