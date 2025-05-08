import { Suspense } from "react"
import SecurityClientPage from "./client-page"
import DependencySetupAlert from "@/components/admin/dependency-setup-alert"

export default function SecurityPage() {
  return (
    <>
      <DependencySetupAlert />
      <Suspense fallback={<div>Loading...</div>}>
        <SecurityClientPage />
      </Suspense>
    </>
  )
}
