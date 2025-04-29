"use client"

import type React from "react"

import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function AdminCheck({ children }: { children: React.ReactNode }) {
  const { user, isLoaded, isSignedIn } = useUser()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      // Check if user has admin role or is a super admin
      const roles = (user.publicMetadata?.roles as string[]) || []
      const isAdmin = roles.includes("admin")
      const isSuperAdmin = user.publicMetadata?.superAdmin === true

      const userHasAccess = isAdmin || isSuperAdmin
      setHasAccess(userHasAccess)
      setIsChecking(false)

      // Redirect if no access
      if (!userHasAccess) {
        router.push("/admin/permission-denied")
      }
    } else if (isLoaded && !isSignedIn) {
      // Redirect to sign in if not signed in
      router.push(`/sign-in?redirect_url=${encodeURIComponent("/admin")}`)
      setIsChecking(false)
    }
  }, [isLoaded, isSignedIn, user, router])

  if (!isLoaded || isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!isSignedIn || !hasAccess) {
    return null // Will redirect in useEffect
  }

  return <>{children}</>
}
