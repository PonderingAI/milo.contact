import type React from "react"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // We can still get the session for UI purposes, but authentication is handled by middleware
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <div className="flex min-h-screen">
      {/* Admin sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-6 hidden md:block">
        <div className="mb-8">
          <h2 className="text-xl font-serif">Admin Panel</h2>
        </div>
        <nav>
          <ul className="space-y-2">
            <li>
              <Link href="/admin" className="block py-2 px-4 rounded hover:bg-gray-800">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/admin/projects" className="block py-2 px-4 rounded hover:bg-gray-800">
                Projects
              </Link>
            </li>
            <li>
              <Link href="/admin/media" className="block py-2 px-4 rounded hover:bg-gray-800">
                Media
              </Link>
            </li>
            <li>
              <Link href="/admin/settings" className="block py-2 px-4 rounded hover:bg-gray-800">
                Settings
              </Link>
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
  )
}
