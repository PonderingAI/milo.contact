"use client"

import type React from "react"

import { useState, useEffect } from "react"
import DatabaseSetupPopup from "@/components/admin/database-setup-popup"

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
      // Use the API instead of creating a Supabase client to avoid multiple client instances
      const response = await fetch('/api/check-database-setup')
      
      if (response.ok) {
        const data = await response.json()
        if (data.isSetup) {
          setSetupComplete(true)
          try {
            localStorage.setItem("database_setup_completed", "true")
          } catch (e) {
            // Silently handle localStorage errors
          }
        }
      } else {
        // If API fails, assume setup is not complete
        setSetupComplete(false)
      }
    } catch (err) {
      // Silently handle errors without logging to console
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
      {!setupComplete && (
        <DatabaseSetupPopup requiredSections={["core"]} adminOnly={true} onSetupComplete={handleSetupComplete} />
      )}
      {children}
    </>
  )
}
