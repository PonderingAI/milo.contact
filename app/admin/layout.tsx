import type React from "react"
import AdminCheck from "@/components/admin/admin-check"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminCheck>{children}</AdminCheck>
}
