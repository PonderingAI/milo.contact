import { Suspense } from "react"
import SecurityClientPage from "./client-page"
import DependencySetupAlert from "@/components/admin/dependency-setup-alert"

// Initialize the dependency system
async function initializeDependencySystem() {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/dependencies/initialize`)
  } catch (error) {
    console.error("Error initializing dependency system:", error)
  }
}

export default async function SecurityPage() {
  // Initialize the dependency system
  await initializeDependencySystem()

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DependencySetupAlert />
      <SecurityClientPage />
    </Suspense>
  )
}
