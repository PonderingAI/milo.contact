"use client"

import type React from "react"

import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AdminCheck({ children }: { children: React.ReactNode }) {
  const { user, isLoaded, isSignedIn } = useUser()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      // Check if user has admin role
      const roles = (user.publicMetadata.roles as string[]) || []
      const hasAdminRole = roles.includes("admin")
      setIsAdmin(hasAdminRole)
      setIsChecking(false)

      // Redirect if not admin
      if (!hasAdminRole) {
        router.push("/admin/permission-denied")
      }
    } else if (isLoaded && !isSignedIn) {
      // Redirect to sign in if not signed in
      router.push("/sign-in?redirect_url=/admin")
      setIsChecking(false)
    }
  }, [isLoaded, isSignedIn, user, router])

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (isAdmin) {
    return <>{children}</>
  }

  return null
}
