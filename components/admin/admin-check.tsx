"use client"

import type React from "react"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

interface AdminCheckProps {
  children: React.ReactNode
}

export default function AdminCheck({ children }: AdminCheckProps) {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        router.push("/sign-in?redirect_url=/admin")
        return
      }

      // For simplicity, we'll assume all signed-in users are admins
      // In a real app, you'd check for admin roles
      setIsAdmin(true)
      setLoading(false)
    }
  }, [isLoaded, isSignedIn, router, user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Checking permissions...</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4">Permission Denied</h2>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
