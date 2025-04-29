"use client"

import { useState, useEffect } from "react"
import { useUser, useClerk } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import Link from "next/link"

export default function AdminSetupPage() {
  const { user, isLoaded, isSignedIn } = useUser()
  const { session } = useClerk()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  // Check if user is already an admin
  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const roles = (user.publicMetadata?.roles as string[]) || []
      setIsAdmin(roles.includes("admin"))
    }
  }, [isLoaded, isSignedIn, user])

  async function makeAdmin() {
    if (!user || !session) return

    setIsProcessing(true)
    setResult(null)

    try {
      // Update the user's metadata directly through Clerk's client SDK
      await user.update({
        publicMetadata: {
          ...user.publicMetadata,
          roles: [...((user.publicMetadata?.roles as string[]) || []), "admin"],
        },
      })

      // Force a session refresh to update the metadata
      await session.reload()

      setResult({
        success: true,
        message: "Admin privileges granted successfully! Redirecting to admin dashboard...",
      })

      // Redirect to admin after a short delay
      setTimeout(() => {
        window.location.href = "/admin"
      }, 2000)
    } catch (error) {
      console.error("Error setting admin role:", error)
      setResult({
        success: false,
        message: "An error occurred while setting admin privileges. Please try again.",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>You need to sign in to set up an admin account.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/sign-in?redirect_url=/admin-setup" className="w-full">
              <Button className="w-full">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Setup</CardTitle>
          <CardDescription>
            {isAdmin ? "You already have admin privileges." : "Make yourself an admin to access the admin dashboard."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result && (
            <Alert className={result.success ? "bg-green-50 mb-4" : "bg-red-50 mb-4"}>
              <AlertTitle>{result.success ? "Success!" : "Error"}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}

          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2">
              Signed in as: <strong>{user?.primaryEmailAddress?.emailAddress}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Status: <strong>{isAdmin ? "Admin" : "Not an admin"}</strong>
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
          {!isAdmin && (
            <Button onClick={makeAdmin} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                "Make Me Admin"
              )}
            </Button>
          )}
          {isAdmin && (
            <Link href="/admin">
              <Button>Go to Admin Dashboard</Button>
            </Link>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
