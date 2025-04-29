import type React from "react"
import AdminCheck from "@/components/admin/admin-check"
import Sidebar from "@/components/admin/sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminCheck>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 p-8">{children}</div>
      </div>
    </AdminCheck>
  )
}
