"use client"

import { useState } from "react"
import DatabaseSetupPopup from "@/components/admin/database-setup-popup"

export default function AdminDatabaseCheck() {
  const [setupComplete, setSetupComplete] = useState(false)

  // This component will render the database setup popup when needed
  // It's designed to be included in the admin layout

  return (
    <>
      <DatabaseSetupPopup
        requiredTables={["user_roles", "site_settings"]}
        adminOnly={true}
        onSetupComplete={() => setSetupComplete(true)}
      />
    </>
  )
}
