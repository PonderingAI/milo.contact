import { Suspense } from "react"
import SecurityClientPage from "./client-page"

export default function SecurityPage() {
  return (
    <Suspense fallback={<div>Loading security dashboard...</div>}>
      <SecurityClientPage />
    </Suspense>
  )
}
