import { Suspense } from "react"
import DatabaseClientPage from "./client-page"
import { Skeleton } from "@/components/ui/skeleton"

export default function DatabasePage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Database Management</h1>
      <Suspense fallback={<Skeleton className="w-full h-[600px]" />}>
        <DatabaseClientPage />
      </Suspense>
    </div>
  )
}
