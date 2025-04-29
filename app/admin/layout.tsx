"use client"

import type React from "react"

import { UserButton, useUser } from "@clerk/nextjs"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { isAdmin } from "@/lib/auth-utils"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const [isAdminUser, setIsAdminUser] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    async function checkAdminStatus() {
      if (isLoaded && isSignedIn && user) {
        try {
          const adminStatus = await isAdmin(user.id)
          setIsAdminUser(adminStatus)
        } catch (error) {
          console.error("Error checking admin status:", error)
          setIsAdminUser(false)
        } finally {
          setIsChecking(false)
        }
      } else if (isLoaded && !isSignedIn) {
        router.push("/sign-in?redirect_url=/admin")
        setIsChecking(false)
      }
    }

    checkAdminStatus()
  }, [isLoaded, isSignedIn, user, router])

  if (!isLoaded || isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  if (!isSignedIn) {
    return null // Will redirect in useEffect
  }

  if (isAdminUser === false) {
    router.push("/admin/permission-denied")
    return null
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
          <Link href="/admin/settings" className="block px-4 py-2 rounded hover:bg-gray-800 transition-colors">
            Settings
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
  )
}
