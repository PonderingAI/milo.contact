import type { Metadata } from "next"
import DatabaseDiagnostic from "@/components/admin/database-diagnostic"

export const metadata: Metadata = {
  title: "Database Diagnostic",
  description: "Check database connection and schema",
}

export default function DatabaseCheckPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Database Diagnostic</h1>
      <p className="text-gray-400 mb-6">This page helps diagnose issues with the database connection and schema.</p>

      <DatabaseDiagnostic />
    </div>
  )
}
