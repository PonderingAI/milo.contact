"use client"

import { WidgetContainer } from "@/components/admin/dashboard/widget-container"
import { availableWidgets, defaultWidgets } from "@/components/admin/dashboard/widget-registry"

export default function AdminDashboardPage() {
  return (
    <div className="h-screen w-full overflow-hidden">
      <WidgetContainer
        availableWidgets={availableWidgets}
        defaultWidgets={defaultWidgets}
        storageKey="admin-dashboard-widgets"
      />
    </div>
  )
}
