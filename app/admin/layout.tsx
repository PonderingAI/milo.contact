import type React from "react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-gray-950 text-white">{children}</div>
}
