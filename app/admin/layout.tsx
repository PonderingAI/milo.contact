"use client"

import type React from "react"

import { UserButton, useUser } from "@clerk/nextjs"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push(`/sign-in?redirect_url=${pathname}`)
    }
  }, [isLoaded, isSignedIn, router, pathname])

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="mt-4 text-lg">Loading authentication...</p>
      </div>
    )
  }

  if (!isSignedIn) {
    return null // Will redirect in the useEffect
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/admin" className="text-xl font-bold">
            Admin Dashboard
          </Link>
          <div className="flex items-center space-x-4">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="w-64 border-r border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="space-y-1">
            <NavLink href="/admin" exact>
              Dashboard
            </NavLink>
            <NavLink href="/admin/projects">Projects</NavLink>
            <NavLink href="/admin/media">Media</NavLink>
            <NavLink href="/admin/users">Users</NavLink>
            <NavLink href="/admin/settings">Settings</NavLink>
            <div className="my-4 border-t border-gray-200 dark:border-gray-700"></div>
            <NavLink href="/">Back to Website</NavLink>
          </div>
        </nav>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}

function NavLink({
  href,
  children,
  exact = false,
}: {
  href: string
  children: React.ReactNode
  exact?: boolean
}) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={`block rounded-md px-3 py-2 text-sm font-medium ${
        isActive
          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
          : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
      }`}
    >
      {children}
    </Link>
  )
}
