"use client"

import type React from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useHasRole } from "@/lib/auth-sync"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, ShieldAlert, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AdminCheckProps {
  children: React.ReactNode
}

export default function AdminCheck({ children }: AdminCheckProps) {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isLoaded) return
      
      setLoading(true)
      setError(null)
      
      try {
        // If not signed in, redirect to sign-in page
        if (!isSignedIn || !user) {
          router.push("/sign-in?redirect_url=/admin")
          return
        }
        
        // Check for superAdmin in Clerk metadata
        const isSuperAdmin = user.publicMetadata?.superAdmin === true
        
        // Check for admin role in Clerk roles array
        const hasAdminRoleInClerk = Array.isArray(user.publicMetadata?.roles) && 
          (user.publicMetadata?.roles as string[]).includes('admin')
        
        // Debug information (only in development)
        if (process.env.NODE_ENV === 'development') {
          setDebugInfo({
            userId: user.id,
            isSuperAdmin,
            hasAdminRoleInClerk,
            clerkMetadata: user.publicMetadata
          })
        }
        
        // If user is superAdmin but doesn't have admin role in Clerk metadata,
        // we need to sync roles within Clerk
        if (isSuperAdmin && !hasAdminRoleInClerk) {
          console.log("SuperAdmin detected without admin role in Clerk metadata - syncing roles...")
          try {
            // Call API to sync roles within Clerk
            const response = await fetch('/api/admin/sync-roles', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              }
            })
            
            const syncData = await response.json()
            
            if (response.ok) {
              console.log("Role sync successful:", syncData)
              // Refresh the page to get updated metadata
              window.location.reload()
              return
            } else {
              console.warn('Failed to sync admin role:', syncData.error)
            }
          } catch (syncError) {
            console.error('Error syncing roles:', syncError)
          }
        }
        
        // User is admin if they are superAdmin OR have admin role in Clerk metadata
        const userIsAdmin = isSuperAdmin || hasAdminRoleInClerk
        
        setIsAdmin(userIsAdmin)
        
        // If not admin, redirect to permission denied page after a short delay
        if (!userIsAdmin) {
          setTimeout(() => {
            router.push("/admin/permission-denied")
          }, 1500)
        }
      } catch (err) {
        console.error("Error checking admin status:", err)
        setError(err instanceof Error ? err.message : "Failed to verify admin permissions")
      } finally {
        setLoading(false)
      }
    }
    
    checkAdminStatus()
  }, [isLoaded, isSignedIn, router, user])
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium mb-2">Verifying admin permissions...</p>
        <p className="text-sm text-muted-foreground">Please wait while we check your access rights.</p>
      </div>
    )
  }
  
  // Show error state if there was a problem checking permissions
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription className="font-medium">Authentication Error</AlertDescription>
          </Alert>
          <p className="text-sm mb-4">{error}</p>
          <div className="flex space-x-2">
            <Button onClick={() => router.push("/")} variant="outline">
              Return to Home
            </Button>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }
  
  // Show permission denied message if not admin (will redirect shortly)
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Permission Denied</h2>
        <p className="text-center mb-4">
          You don't have permission to access the admin area.
          <br />
          Redirecting to permission denied page...
        </p>
        <Button onClick={() => router.push("/")} variant="outline">
          Return to Home
        </Button>
      </div>
    )
  }
  
  // Show debug info in development mode
  const showDebugInfo = process.env.NODE_ENV === 'development' && debugInfo
  
  // User is admin, render children with optional debug info
  return (
    <>
      {showDebugInfo && (
        <div className="bg-yellow-50 border border-yellow-200 p-3 text-xs font-mono text-yellow-800 rounded mb-4 overflow-auto max-h-40">
          <details>
            <summary className="cursor-pointer font-medium">Admin Debug Info (Dev Only)</summary>
            <pre className="mt-2">{JSON.stringify(debugInfo, null, 2)}</pre>
          </details>
        </div>
      )}
      {children}
    </>
  )
}
