"use client"

import type React from "react"

import { useUser } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminCheck({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function checkAdminStatus() {
      if (isLoaded && isSignedIn && user) {
        try {
          // Check if the user has the admin role in their metadata
          const roles = (user.publicMetadata?.roles as string[]) || []
          const adminStatus = roles.includes("admin")
          setIsAdmin(adminStatus)
        } catch (error) {
          console.error("Error checking admin status:", error)
          setIsAdmin(false)
        } finally {
          setIsChecking(false)
        }
      } else if (isLoaded && !isSignedIn) {
        router.push(`/sign-in?redirect_url=${encodeURIComponent("/admin")}`)
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

  if (isAdmin === false) {
    router.push("/admin/permission-denied")
    return null
  }

  return <>{children}</>
}
