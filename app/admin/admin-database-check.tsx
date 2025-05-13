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

  // Check if setup was previously completed
  useEffect(() => {
    try {
      const completed = localStorage.getItem("database_setup_completed")
      if (completed === "true") {
        setSetupComplete(true)
        setInitialCheckDone(true)
        return
      }
    } catch (e) {
      console.error("Could not read from localStorage", e)
    }

    // If not marked as complete in localStorage, check the database directly
    checkDatabase()
  }, [])

  const checkDatabase = async () => {
    if (isChecking) return
    setIsChecking(true)

    try {
      const supabase = createClientComponentClient()

      // Check if core tables exist - specifically include projects table
      const coreTables = ["user_roles", "projects"]
      let allTablesExist = true

      for (const table of coreTables) {
        try {
          const { error } = await supabase.from(table).select("id").limit(1)
          if (error && (error.code === "PGRST116" || error.message.includes("does not exist"))) {
            allTablesExist = false
            break
          }
        } catch (err) {
          // Silently handle the error without logging to console
          allTablesExist = false
          break
        }
      }

      if (allTablesExist) {
        setSetupComplete(true)
        try {
          localStorage.setItem("database_setup_completed", "true")
        } catch (e) {
          // Silently handle localStorage errors
        }
      }
    } catch (err) {
      // Silently handle errors without logging to console
      // If there's an error, we'll assume setup is not complete
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
      {!setupComplete && (
        <DatabaseSetupPopup requiredSections={["core"]} adminOnly={true} onSetupComplete={handleSetupComplete} />
      )}
      {children}
    </>
  )
}
