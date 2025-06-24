"use client"

import { WidgetContainer } from "@/components/admin/dashboard/widget-container"
import { availableWidgets, defaultWidgets } from "@/components/admin/dashboard/widget-registry"

export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen w-full">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-400 mt-1">Welcome to your admin dashboard</p>
      </div>
      
      <WidgetContainer
        availableWidgets={availableWidgets}
        defaultWidgets={defaultWidgets}
        storageKey="admin-dashboard-widgets"
      />
    </div>
  )
}
