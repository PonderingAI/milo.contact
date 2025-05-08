import { Suspense } from "react"
import SecurityClientPage from "./client-page"
import { checkDependencyTablesExist } from "@/lib/check-tables"
import { setupDependencyTables } from "@/lib/setup-dependency-tables"

export default async function SecurityPage() {
  // Check if dependency tables exist
  const tablesExist = await checkDependencyTablesExist()

  // If tables don't exist, set them up
  if (!tablesExist) {
    console.log("Dependency tables don't exist, setting them up...")
    await setupDependencyTables()
  }

  return (
    <Suspense fallback={<div>Loading security dashboard...</div>}>
      <SecurityClientPage />
    </Suspense>
  )
}
