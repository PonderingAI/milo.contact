import type React from "react"
import AdminCheck from "@/components/admin/admin-check"
import { UserButton } from "@clerk/nextjs"
import Link from "next/link"
import AdminDatabaseCheck from "./admin-database-check"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminCheck>
      <AdminDatabaseCheck>
        <div className="min-h-screen flex flex-col md:flex-row">
          {/* Sidebar */}
          <aside className="w-full md:w-64 bg-gray-900 text-white p-4">
            <div className="mb-8">
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            </div>
            <nav className="space-y-2">
              <Link href="/admin" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">
                Dashboard
              </Link>
              <Link href="/admin/projects" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">
                Projects
              </Link>
              <Link href="/admin/media" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">
                Media
              </Link>
              <Link href="/admin/settings" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">
                Settings
              </Link>
              <Link href="/admin/database" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">
                Database
              </Link>
              <Link href="/admin/security" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">
                Security
              </Link>
              <Link href="/" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">
                Back to Website
              </Link>
            </nav>
            <div className="mt-8">
              <UserButton afterSignOutUrl="/" />
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 p-6 overflow-auto bg-gray-950 text-white">{children}</main>
        </div>
      </AdminDatabaseCheck>
    </AdminCheck>
  )
}
