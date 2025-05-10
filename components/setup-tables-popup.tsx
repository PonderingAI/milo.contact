"use client"

import { DatabaseSetupPopup } from "@/components/admin/database-setup-popup"

// This is a compatibility wrapper to maintain backward compatibility
// with code that still references the old component
export default function SetupTablesPopup({
  tables,
  onTablesCreated,
}: {
  tables?: string[]
  onTablesCreated?: () => void
}) {
  return (
    <DatabaseSetupPopup
      requiredSections={tables ? ["custom"] : ["all"]}
      customTables={tables}
      onSetupComplete={onTablesCreated}
    />
  )
}

// Also export the component as a named export for imports that use { SetupTablesPopup }
export { SetupTablesPopup }
