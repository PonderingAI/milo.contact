"use client"

import { DatabaseSetupPopup } from "@/components/admin/database-setup-popup"

// This is a compatibility wrapper to maintain backward compatibility
// with code that still references the old component
export default function ContactTableSetupGuide() {
  return (
    <DatabaseSetupPopup
      requiredSections={["contact"]}
      title="Contact Table Setup"
      description="This will create the necessary tables for the contact form functionality."
    />
  )
}

// Also export the component as a named export for imports that use { ContactTableSetupGuide }
export { ContactTableSetupGuide }
