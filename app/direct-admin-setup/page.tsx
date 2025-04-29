"use client"

import type React from "react"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { verifyBootstrapSecret } from "./actions"

export default function DirectAdminSetupPage() {
  const { user, isLoaded, isSignedIn } = useUser()
  const [secret, setSecret] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setResult(null)

    try {
      // Verify the secret using a server action
      const verificationResult = await verifyBootstrapSecret(secret)

      if (!verificationResult.success) {
        setResult({
          success: false,
          message: verificationResult.message,
        })
        return
      }

      // Get the current roles
      const currentRoles = (user?.publicMetadata?.roles as string[]) || []

      // Check if user already has admin role
      if (currentRoles.includes("admin")) {
        setResult({
          success: true,
          message: "You already have admin privileges",
        })
        return
      }

      // Add admin role
      await user?.update({
        publicMetadata: {
          ...user.publicMetadata,
          roles: [...currentRoles, "admin"],
        },
      })

      setResult({
        success: true,
        message: "Admin privileges granted successfully! Redirecting to admin dashboard...",
      })

      // Redirect to admin after a short delay
      setTimeout(() => {
        window.location.href = "/admin"
      }, 2000)
    } catch (error) {
      console.error("Error setting up admin:", error)
      setResult({
        success: false,
        message: "An error occurred. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
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
          <CardFooter>
            <Link href={`/sign-in?redirect_url=${encodeURIComponent("/direct-admin-setup")}`} className="w-full">
              <Button className="w-full">Sign In</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Direct Admin Setup</CardTitle>
          <CardDescription>Enter the bootstrap secret to grant admin privileges to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {result && (
            <Alert className={result.success ? "bg-green-50 mb-4" : "bg-red-50 mb-4"}>
              <AlertTitle>{result.success ? "Success!" : "Error"}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">
                Signed in as: <strong>{user?.primaryEmailAddress?.emailAddress}</strong>
              </p>
              <label htmlFor="secret" className="block text-sm font-medium text-gray-700 mb-1">
                Bootstrap Secret
              </label>
              <Input
                id="secret"
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                required
                className="w-full"
                placeholder="Enter your bootstrap secret"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                </>
              ) : (
                "Set Up Admin Access"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
