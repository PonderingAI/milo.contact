"use client"

import { useEffect, useState } from "react"
import DatabaseSetupPopup from "@/components/admin/database-setup-popup"

interface SetupTablesPopupProps {
  requiredTables?: string[]
  onSetupComplete?: () => void
}

export function SetupTablesPopup({ requiredTables = [], onSetupComplete }: SetupTablesPopupProps) {
  const [isAdminPage, setIsAdminPage] = useState(false)

  // Check if we're on an admin page
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAdmin = window.location.pathname.startsWith("/admin")
      setIsAdminPage(isAdmin)
    }
  }, [])

  // Only render in admin pages
  if (!isAdminPage) {
    return null
  }

  return <DatabaseSetupPopup customTables={requiredTables} adminOnly={true} onSetupComplete={onSetupComplete} />
}

export default SetupTablesPopup
