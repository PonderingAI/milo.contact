import { Suspense } from "react"
import SecurityClientPage from "./client-page"
import DependencyTablesSetup from "@/components/admin/dependency-tables-setup"

export default function SecurityPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Security Center</h1>

      {/* Add the setup component */}
      <DependencyTablesSetup />

      <Suspense fallback={<div>Loading security dashboard...</div>}>
        <SecurityClientPage />
      </Suspense>
    </div>
  )
}
