import { Suspense } from "react"
import ClientDependenciesPage from "./client-page"
import DependencySetupGuide from "@/components/admin/dependency-setup-guide"

export const metadata = {
  title: "Dependency Management",
  description: "Manage your project dependencies",
}

export default function DependenciesPage() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <DependencySetupGuide />
        <div className="mt-8">
          <ClientDependenciesPage />
        </div>
      </Suspense>
    </div>
  )
}
