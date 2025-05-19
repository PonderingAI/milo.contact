"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function AuthTestPage() {
  const { user, isLoaded, isSignedIn } = useUser()
  const [testResult, setTestResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function testAuth() {
    setIsLoading(true)
    try {
      const response = await fetch("/api/test-auth")
      const data = await response.json()
      setTestResult({
        status: response.status,
        data,
      })
    } catch (error) {
      console.error("Error testing auth:", error)
      setTestResult({
        error: "Failed to fetch",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentication Test</CardTitle>
          <CardDescription>Test if authentication is working correctly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <p className="text-sm font-medium">Auth Status:</p>
            <p className="text-sm">
              {!isLoaded ? (
                <span className="text-gray-500">Loading...</span>
              ) : isSignedIn ? (
                <span className="text-green-600">Signed in as {user?.primaryEmailAddress?.emailAddress}</span>
              ) : (
                <span className="text-red-600">Not signed in</span>
              )}
            </p>
          </div>

          {testResult && (
            <div className="mb-4 p-4 bg-gray-50 rounded-md">
              <p className="text-sm font-medium">API Test Result:</p>
              <pre className="text-xs mt-2 overflow-auto p-2 bg-gray-100 rounded">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={testAuth} disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testing...
              </>
            ) : (
              "Test Authentication"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
