"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { WidgetContainer } from "@/components/admin/dashboard/widget-container"
import { widgetRegistry, defaultDashboardWidgets } from "@/components/admin/dashboard/widget-registry"

export default function AdminDashboard() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in?redirect_url=/admin")
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  if (!isSignedIn) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="container mx-auto p-6">
      <WidgetContainer
        availableWidgets={widgetRegistry}
        defaultWidgets={defaultDashboardWidgets}
        storageKey="milo-admin-dashboard-widgets"
      />
    </div>
  )
}
