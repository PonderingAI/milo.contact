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

      // Check if user_roles table exists (core table)
      const { data, error } = await supabase.from("user_roles").select("id").limit(1).maybeSingle()

      // If no error, the table exists
      if (!error) {
        setSetupComplete(true)
        try {
          localStorage.setItem("database_setup_completed", "true")
        } catch (e) {
          console.error("Could not save to localStorage", e)
        }
      }
    } catch (err) {
      console.warn("Error checking database:", err)
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
