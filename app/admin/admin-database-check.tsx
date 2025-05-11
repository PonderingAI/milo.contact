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

  // Check if setup was previously completed
  useEffect(() => {
    try {
      const completed = localStorage.getItem("database_setup_completed")
      if (completed === "true") {
        setSetupComplete(true)
      }
    } catch (e) {
      console.error("Could not read from localStorage", e)
    }

    setInitialCheckDone(true)
  }, [])

  const handleSetupComplete = () => {
    setSetupComplete(true)
    try {
      localStorage.setItem("database_setup_completed", "true")
    } catch (e) {
      console.error("Could not save to localStorage", e)
    }
  }

  // Don't render anything until we've checked localStorage
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
