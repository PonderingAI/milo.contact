"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { useState } from "react"
import DatabaseSetupPopup from "@/components/admin/database-setup-popup"

// Define which tables are required for which admin sections
const SECTION_REQUIREMENTS = {
  "/admin": ["user_roles", "site_settings"],
  "/admin/projects": ["projects", "user_roles"],
  "/admin/media": ["media", "user_roles"],
  "/admin/settings": ["site_settings", "user_roles"],
  "/admin/dependencies": ["dependencies", "dependency_settings", "user_roles"],
  "/admin/security": ["dependencies", "user_roles"],
  "/admin/users": ["user_roles"],
}

export default function AdminDatabaseCheck({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [setupComplete, setSetupComplete] = useState(false)

  // Determine which tables are required for the current section
  const getRequiredTables = () => {
    // Start with base requirements
    let required = ["user_roles"]

    // Add section-specific requirements
    for (const [path, tables] of Object.entries(SECTION_REQUIREMENTS)) {
      if (pathname?.startsWith(path)) {
        required = [...new Set([...required, ...tables])]
      }
    }

    return required
  }

  const requiredTables = getRequiredTables()

  const handleSetupComplete = () => {
    setSetupComplete(true)
  }

  return (
    <>
      <DatabaseSetupPopup onSetupComplete={handleSetupComplete} requiredTables={requiredTables} isAdmin={true} />
      {children}
    </>
  )
}
