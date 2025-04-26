import type React from "react"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Check if user is authenticated
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If not authenticated, redirect to login
  if (!session) {
    redirect("/admin/login")
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="flex min-h-screen">
        {/* Admin sidebar */}
        <aside className="w-64 bg-gray-900 text-white p-6 hidden md:block">
          <div className="mb-8">
            <h2 className="text-xl font-serif">Admin Panel</h2>
          </div>
          <nav>
            <ul className="space-y-2">
              <li>
                <a href="/admin" className="block py-2 px-4 rounded hover:bg-gray-800">
                  Dashboard
                </a>
              </li>
              <li>
                <a href="/admin/projects" className="block py-2 px-4 rounded hover:bg-gray-800">
                  Projects
                </a>
              </li>
              <li>
                <a href="/admin/media" className="block py-2 px-4 rounded hover:bg-gray-800">
                  Media
                </a>
              </li>
              <li>
                <a href="/admin/settings" className="block py-2 px-4 rounded hover:bg-gray-800">
                  Settings
                </a>
              </li>
              <li className="mt-8">
                <form action="/api/auth/signout" method="post">
                  <button type="submit" className="w-full text-left py-2 px-4 rounded hover:bg-gray-800 text-red-400">
                    Sign Out
                  </button>
                </form>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 bg-gray-950 text-white overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
