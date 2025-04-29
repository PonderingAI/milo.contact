import type React from "react"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { UserButton } from "@clerk/nextjs"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = auth()

  if (!userId) {
    redirect("/sign-in?redirect_url=/admin")
  }

  return (
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
          <Link href="/admin/users" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">
            Users
          </Link>
          <Link href="/admin/settings" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">
            Settings
          </Link>
          <Link href="/" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">
            Back to Website
          </Link>
        </nav>
        <div className="mt-auto pt-8">
          <UserButton afterSignOutUrl="/" />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto bg-gray-950 text-white">{children}</main>
    </div>
  )
}
