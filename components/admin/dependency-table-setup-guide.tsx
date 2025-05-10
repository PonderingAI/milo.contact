"use client"

import { DatabaseSetupPopup } from "@/components/admin/database-setup-popup"

// This is a compatibility wrapper to maintain backward compatibility
// with code that still references the old component
export default function DependencyTableSetupGuide() {
  return (
    <DatabaseSetupPopup
      requiredSections={["dependencies"]}
      title="Dependency Management Setup"
      description="This will create the necessary tables for the dependency management system."
    />
  )
}

// Also export the component as a named export for imports that use { DependencyTableSetupGuide }
export { DependencyTableSetupGuide }
