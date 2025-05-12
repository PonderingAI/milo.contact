"use client"
import { WidgetContainer } from "@/components/admin/dashboard/widget-container"
import { availableWidgets, defaultWidgets } from "@/components/admin/dashboard/widget-registry"

export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto py-6">
      <WidgetContainer
        availableWidgets={availableWidgets}
        defaultWidgets={defaultWidgets}
        storageKey="admin-dashboard-widgets"
      />
    </div>
  )
}
